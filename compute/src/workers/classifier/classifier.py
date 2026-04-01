import re
from datetime import date

import numpy as np
import onnxruntime as ort
import polars as pl
from sentence_transformers import SentenceTransformer

from src.services.storage import StorageClient

INTENT_LABELS = ["informational", "commercial", "transactional", "navigational"]
ENTITY_LABELS = ["person", "event", "location", "company", "product", "other"]
BINARY_THRESHOLDS = {"is_question": 0.64, "is_comparison": 0.11, "is_branded": 0.49, "is_adult": 0.5}

QUESTION_WORDS = re.compile(
    r"^(how|what|why|where|when|which|who|whom|whose|is|are|can|could|does|do|will|should)\b", re.IGNORECASE
)
VS_PATTERN = re.compile(r"\b(vs\.?|versus|compared to|comparison)\b", re.IGNORECASE)
ADULT_KEYWORDS = {"eporner", "baddiehub", "nhentai", "bonnie blue", "sxyprn"}


class Classifier:
    def __init__(self, storage: StorageClient, verbose: bool = False) -> None:
        self._embedding_model = SentenceTransformer("BAAI/bge-small-en-v1.5", backend="onnx")
        self._verbose = verbose

        path = f"gs://{StorageClient.BUCKET}/models/classifier.onnx"
        model_raw = storage.read_bytes(path)
        self._ort_session = ort.InferenceSession(model_raw, providers=["CPUExecutionProvider"])

    def classify(self, keywords: list[str]) -> pl.DataFrame:
        """Run inference on a list of keywords and predict the following classes: is_adult, is_question, is_comparison,
        is_branded, intent, entity_type, saas_potential.

        Args:
            keywords: A list of keywords to classify.

        Returns:
            pl.DataFrame: A DataFrame containing the classification results.
        """
        embeddings = self._compute_embeddings(keywords)
        df = self._run_inference(keywords, embeddings)
        return df

    def _compute_embeddings(self, keywords: list[str]) -> np.ndarray:
        embeddings = self._embedding_model.encode(
            keywords, batch_size=256, show_progress_bar=self._verbose, normalize_embeddings=False
        )
        return np.asarray(embeddings, dtype=np.float32)

    def _run_inference(self, keywords: list[str], embeddings: np.ndarray) -> pl.DataFrame:
        x = np.hstack([embeddings, self._text_features(keywords)])

        # ONNX output order: intent, entity_type, is_adult, saas_potential, is_question, is_comparison, is_branded
        (
            intent_logits,
            entity_logits,
            is_adult_raw,
            saas_raw,
            is_question_logits,
            is_comparison_logits,
            is_branded_logits,
        ) = self._ort_session.run(None, {"input": x})

        result: dict[str, list] = {
            "keyword": keywords,
            "intent": [INTENT_LABELS[i] for i in intent_logits.argmax(axis=1)],  # ty:ignore[unresolved-attribute]
            "entity_type": [ENTITY_LABELS[i] for i in entity_logits.argmax(axis=1)],  # ty:ignore[unresolved-attribute]
            "is_adult": is_adult_raw.squeeze(-1).tolist(),  # ty:ignore[unresolved-attribute]
            "saas_potential": saas_raw.squeeze(-1).tolist(),  # ty:ignore[unresolved-attribute]
        }

        for flag, logits in [
            ("is_question", is_question_logits),
            ("is_comparison", is_comparison_logits),
            ("is_branded", is_branded_logits),
            ("is_adult", is_adult_raw),
        ]:
            probs = 1.0 / (1.0 + np.exp(-logits.squeeze(-1)))  # ty:ignore[unresolved-attribute]
            result[flag] = (probs > BINARY_THRESHOLDS[flag]).astype(np.int8).tolist()

        df = pl.DataFrame(result).with_columns(
            updated_at=pl.lit(date.today()),
            saas_potential=pl.col("saas_potential").clip(0.0, 1.0),
            is_adult=pl.when(pl.col("keyword").is_in(ADULT_KEYWORDS)).then(True).otherwise(pl.col("is_adult")),
        )
        return df

    def _text_features(self, keywords: list[str]) -> np.ndarray:
        feats = np.zeros((len(keywords), 5), dtype=np.float32)
        for i, kw in enumerate(keywords):
            feats[i, 0] = len(kw)
            feats[i, 1] = len(kw.split())
            feats[i, 2] = float(bool(QUESTION_WORDS.search(kw)))
            feats[i, 3] = float(bool(VS_PATTERN.search(kw)))
            feats[i, 4] = float(bool(re.search(r"\d", kw)))
        return feats
