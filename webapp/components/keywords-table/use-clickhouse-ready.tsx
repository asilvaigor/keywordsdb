import useSWR from "swr";

const fetchClickhousePing = async () => {
  const response = await fetch("/api/db/pingClickhouse");
  if (!response.ok) {
    throw new Error("Failed to ping ClickHouse");
  }
  const data = await response.json();
  return data.success as boolean;
};

const useClickhouseReady = (shouldFetch: boolean) => {
  const {
    data: isReady,
    error,
    isLoading,
  } = useSWR(shouldFetch ? "clickhouse-ping" : null, fetchClickhousePing, {
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
