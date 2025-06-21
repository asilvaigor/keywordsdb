import { useEffect, useState } from "react";

export default function useDebounce<T>(
  value: T,
  onValueChange: (value: T) => void,
) {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const [isDebouncing, setIsDebouncing] = useState(false);

  useEffect(() => {
    if (Array.isArray(value) && Array.isArray(debouncedValue)) {
      if (
        value.length === debouncedValue.length &&
        value.every((item, index) => item === debouncedValue[index])
      ) {
        return;
      }
    } else if (value === debouncedValue) {
      return;
    }
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
  }, [value, debouncedValue, onValueChange]);

  return { debouncedValue, isDebouncing };
}
