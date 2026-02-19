import type { SortingState } from "@tanstack/react-table";
import { useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import type { KeywordFilters } from "@/lib/types";
import { buildSearchParams } from "@/lib/utils";

function downloadFiles(urls: string[]) {
  // https://stackoverflow.com/questions/50694881/how-to-download-file-in-react-js
  // Stagger clicks so the browser doesn't suppress all but the last download
  urls.forEach((url, i) => {
    setTimeout(() => {
      console.log("Downloading", i);
      const link = document.createElement("a");
      link.href = url;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        try {
          document.body.removeChild(link);
        } catch {
          // Happens sometimes, it's not critical
        }
      }, 1000);
    }, i * 500);
  });
}

async function fetchPresignedUrls({
  filters,
  sorting,
  format,
  isSample,
}: {
  filters: KeywordFilters;
  sorting: SortingState;
  format: "parquet" | "csv";
  isSample: boolean;
}) {
  const params = buildSearchParams({ filters, sorting, isSample });
  params.append("format", format);
  const url = `/api/keywords/download?${params.toString()}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to fetch download URLs");
  }
  return await res.json();
}

export function useDownloadModal({
  filters,
  sorting,
  isSample,
}: {
  filters: KeywordFilters;
  sorting: SortingState;
  isSample: boolean;
}) {
  const [shouldFetchFormat, setShouldFetchFormat] = useState<
    "parquet" | "csv" | null
  >(null);

  const { isLoading } = useSWR(
    shouldFetchFormat ? [filters, sorting, isSample, shouldFetchFormat] : null,
    ([filters, sorting, isSample, format]) =>
      fetchPresignedUrls({ filters, sorting, isSample, format }),
    {
      onSuccess(data) {
        downloadFiles(data.urls);
        setShouldFetchFormat(null);
        toast.dismiss("download");
      },
      onError() {
        setShouldFetchFormat(null);
        toast.dismiss("download");
        toast.error("Download failed. Please try again.", {
          id: "download-err",
        });
      },
    },
  );

  const handleDownload = (format: "parquet" | "csv") => {
    setShouldFetchFormat(format);
    toast.loading(
      "Preparing your download... This could take a few minutes, time to grab a coffee!",
      {
        id: "download",
        duration: Number.POSITIVE_INFINITY,
      },
    );
  };

  return { handleDownload, isLoading };
}
