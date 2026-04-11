import re
import warnings
from datetime import date

import numpy as np
import onnxruntime as ort
import polars as pl
from fastembed import TextEmbedding

from src.services.storage import StorageClient

INTENT_LABELS = ["informational", "commercial", "transactional", "navigational"]
ENTITY_LABELS = ["person", "event", "location", "company", "product", "other"]
BINARY_THRESHOLDS = {"is_question": 0.64, "is_comparison": 0.11, "is_branded": 0.49, "is_adult": 0.5}

QUESTION_WORDS = re.compile(
    r"^(how|what|why|where|when|which|who|whom|whose|is|are|can|could|does|do|will|should)\b", re.IGNORECASE
)
VS_PATTERN = re.compile(r"\b(vs\.?|versus|compared to|comparison)\b", re.IGNORECASE)

MANUAL_FIXES = {
    "intent": {"hotels": "informational", "restaurants near me": "informational"},
    "entity_type": {
        "desmos": "company",
        "charles schwab": "company",
        "realtor": "company",
        "coach": "company",
        "apple music": "product",
        "paw patrol": "product",
        "missav": "product",
        "detroit tigers": "company",
        "harris teeter": "company",
        "dirft boss": "product",
        "ross": "company",
    },
    "is_adult": {"eporner": True, "baddiehub": True, "nhentai": True, "bonnie blue": True, "sxyprn": True},
    "is_branded": {
        "twitter": True,
        "nba": True,
        "linkedin": True,
        "indeed": True,
        "dow jones": True,
        "dow jones today": True,
        "nba scores": True,
        "yt": True,
        "discord": True,
        "menards": True,
    },
}


class Classifier:
    def __init__(self, storage: StorageClient) -> None:
        warnings.filterwarnings("ignore", message=".*Cannot enable progress bars.*")
        self._embedding_model = TextEmbedding("BAAI/bge-small-en-v1.5")

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
        embeddings = list(self._embedding_model.embed(keywords))
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
            "saas_potential": saas_raw.squeeze(-1).tolist(),  # ty:ignore[unresolved-attribute]
        }

        for flag, logits in [
            ("is_question", is_question_logits),
            ("is_comparison", is_comparison_logits),
            ("is_branded", is_branded_logits),
        ]:
            probs = 1.0 / (1.0 + np.exp(-logits.squeeze(-1)))  # ty:ignore[unresolved-attribute]
            result[flag] = (probs > BINARY_THRESHOLDS[flag]).tolist()

        result["is_adult"] = (is_adult_raw.squeeze(-1) > BINARY_THRESHOLDS["is_adult"]).tolist()  # ty:ignore[unresolved-attribute]

        df = pl.DataFrame(result).with_columns(
            updated_at=pl.lit(date.today()),
            saas_potential=pl.col("saas_potential").clip(0.0, 1.0),
            # Apply manual fixes
            intent=pl.when(pl.col("keyword").is_in(MANUAL_FIXES["intent"].keys()))
            .then(pl.col("keyword").replace(MANUAL_FIXES["intent"]))
            .otherwise(pl.col("intent")),
            entity_type=pl.when(pl.col("keyword").is_in(MANUAL_FIXES["entity_type"].keys()))
            .then(pl.col("keyword").replace(MANUAL_FIXES["entity_type"]))
            .otherwise(pl.col("entity_type")),
            is_adult=pl.when(pl.col("keyword").is_in(MANUAL_FIXES["is_adult"].keys()))
            .then(pl.col("keyword").replace_strict(MANUAL_FIXES["is_adult"], default=None))
            .otherwise(pl.col("is_adult")),
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
