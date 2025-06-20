import { useEffect, useState } from "react";

export default function useDebounce(
  value: string,
  onValueChange: (value: string) => void,
) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const [isDebouncing, setIsDebouncing] = useState(false);

  useEffect(() => {
    if (value == null) {
      setDebouncedValue(value);
      setIsDebouncing(false);
      return;
    }

    setIsDebouncing(true);
    const handler = setTimeout(() => {
      setDebouncedValue(value);
      onValueChange(value);
      setIsDebouncing(false);
    }, 1000);

    return () => {
      clearTimeout(handler);
    };
  }, [value, onValueChange]);

  return { debouncedValue, isDebouncing };
}
