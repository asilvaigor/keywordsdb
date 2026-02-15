import useSWR from "swr";
import { pingClickhouse } from "@/lib/clickhouse-utils";

const useClickhouseReady = (shouldFetch: boolean) => {
  const {
    data: isReady,
    error,
    isLoading,
  } = useSWR(shouldFetch ? "clickhouse-ping" : null, pingClickhouse, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    errorRetryCount: 3,
    errorRetryInterval: 2000,
  });

  if (!shouldFetch) {
    return true;
  }
  return Boolean(isReady) && !isLoading && !error;
};

export default useClickhouseReady;
