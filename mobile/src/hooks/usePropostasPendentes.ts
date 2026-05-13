import { useEffect, useState } from 'react';
import { processosService } from '../services/api';

const INTERVALO_MS = 20_000;

export function usePropostasPendentes() {
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let ativo = true;
    async function buscar() {
      try {
        const { data } = await processosService.pendentes();
        if (ativo) setTotal(data.total);
      } catch {
        // silencioso — sem propostas pendentes não é crítico
      }
    }
    buscar();
    const id = setInterval(buscar, INTERVALO_MS);
    return () => {
      ativo = false;
      clearInterval(id);
    };
  }, []);

  return total;
}
