import useSWR from "swr";
import { pingClickhouse } from "@/lib/clickhouse-utils";

const useClickhouseReady = () => {
  const {
    data: isReady,
    error,
    isLoading,
  } = useSWR("clickhouse-ping", pingClickhouse, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    errorRetryCount: 3,
    errorRetryInterval: 2000,
  });

  return Boolean(isReady) && !isLoading && !error;
};

export default useClickhouseReady;
