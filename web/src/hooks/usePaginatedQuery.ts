import { useCallback, useEffect, useRef, useState } from 'react';

/** Envelope de resposta paginada — espelha o PaginatedDTO do backend. */
export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

type Fetcher<T> = (params: {
  page: number;
  pageSize: number;
  signal: AbortSignal;
}) => Promise<Paginated<T>>;

interface Options {
  pageSize?: number;
  /** Quando estas dependências (filtros) mudam, volta para a página 1 e recarrega. */
  deps?: unknown[];
}

/**
 * Consome um endpoint paginado (envelope {data,total,page,pageSize}).
 * Cancela a requisição anterior ao refazer (evita respostas fora de ordem) e
 * reseta para a página 1 quando os filtros mudam.
 */
export function usePaginatedQuery<T>(fetcher: Fetcher<T>, opts: Options = {}) {
  const pageSize = opts.pageSize ?? 20;
  const deps = opts.deps ?? [];

  const [page, setPage] = useState(1);
  const [data, setData] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const carregar = useCallback(async () => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    setError(null);
    try {
      const res = await fetcher({ page, pageSize, signal: ctrl.signal });
      setData(res.data);
      setTotal(res.total);
    } catch (e: unknown) {
      const err = e as { name?: string; code?: string };
      if (err?.name !== 'AbortError' && err?.code !== 'ERR_CANCELED') {
        setError('Falha ao carregar');
      }
    } finally {
      if (!ctrl.signal.aborted) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, ...deps]);

  useEffect(() => {
    carregar();
    return () => abortRef.current?.abort();
  }, [carregar]);

  // Filtros mudaram → volta para a página 1.
  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return { data, total, page, setPage, pageSize, totalPages, loading, error, recarregar: carregar };
}
