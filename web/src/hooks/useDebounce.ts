import { useEffect, useState } from 'react';

/** Atrasa a propagação de um valor (ex.: busca textual) para evitar requisição por tecla. */
export function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return debounced;
}
