import { useEffect, useState } from 'react';
import { processosService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const INTERVALO_MS = 20_000;

export function usePropostasPendentes() {
  const { tipo, token } = useAuth();
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!token || tipo !== 'cliente') return;
    let ativo = true;

    async function buscar() {
      try {
        const { data } = await processosService.pendentes();
        if (ativo) setTotal(data.total);
      } catch {
        // silencioso
      }
    }

    buscar();
    const id = setInterval(buscar, INTERVALO_MS);
    return () => {
      ativo = false;
      clearInterval(id);
    };
  }, [tipo, token]);

  return total;
}
