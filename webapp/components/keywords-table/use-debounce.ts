import { useEffect, useState } from "react";

export default function useDebounce(
  value: string,
  onValueChange: (value: string) => void,
) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    if (value == null) {
      setDebouncedValue(value);
      return;
    }
    const handler = setTimeout(() => {
      setDebouncedValue(value);
      onValueChange(value);
    }, 1000);

    return () => {
      clearTimeout(handler);
    };
  }, [value, onValueChange]);

  return debouncedValue;
}
