"use client";

import { useCallback, useRef, useState } from "react";
import type {
  AuditProgress,
  AuditResult,
  AuditStreamEvent,
} from "@/lib/seo-audit/types";

export function useSeoAudit() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<AuditResult | null>(null);
  const [progress, setProgress] = useState<AuditProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = url.trim();
      if (!trimmed || isRunning) return;

      const finalUrl =
        trimmed.startsWith("http://") || trimmed.startsWith("https://")
          ? trimmed
          : `https://${trimmed}`;

      setError(null);
      setResult(null);
      setProgress(null);
      setIsRunning(true);

      eventSourceRef.current?.close();

      const es = new EventSource(
        `/api/seo-audit?url=${encodeURIComponent(finalUrl)}`,
      );
      eventSourceRef.current = es;

      es.onmessage = (event) => {
        if (event.data === "[DONE]") {
          es.close();
          setIsRunning(false);
          return;
        }

        try {
          const data = JSON.parse(event.data) as AuditStreamEvent;

          if (data.type === "progress") {
            setProgress(data);
          } else if (data.type === "result") {
            setResult(data);
            setProgress(null);
          } else if (data.type === "error") {
            setError(data.error);
            setProgress(null);
          }
        } catch {
          // ignore parse errors
        }
      };

      es.onerror = () => {
        es.close();
        setIsRunning(false);
        if (!result && !error) {
          setError("Connection lost. Please try again.");
        }
      };
    },
    [url, isRunning, result, error],
  );

  return {
    url,
    setUrl,
    result,
    progress,
    error,
    isRunning,
    handleSubmit,
  };
}
