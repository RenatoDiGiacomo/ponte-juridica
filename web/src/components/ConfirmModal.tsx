import { type ReactNode } from 'react';
import { Modal } from './Modal';

interface ConfirmModalProps {
  aberto: boolean;
  titulo: string;
  mensagem: ReactNode;
  textoConfirmar?: string;
  textoCancelar?: string;
  /** 'reforcado' = ação destrutiva (ex.: encerrar caso). */
  variante?: 'padrao' | 'reforcado';
  carregando?: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}

/** Diálogo de confirmação sobre o <Modal> base — substitui o diálogo nativo do navegador. */
export function ConfirmModal({
  aberto,
  titulo,
  mensagem,
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',
  variante = 'padrao',
  carregando = false,
  onConfirmar,
  onCancelar,
}: ConfirmModalProps) {
  return (
    <Modal aberto={aberto} onFechar={onCancelar} titulo={titulo} variante={variante}>
      <div className="text-sm text-slate-600">{mensagem}</div>
      <div className="mt-5 flex gap-2">
        <button
          type="button"
          onClick={onConfirmar}
          disabled={carregando}
          className={`flex-1 rounded-lg py-2 text-sm font-bold text-white disabled:opacity-60 ${
            variante === 'reforcado'
              ? 'bg-erro hover:opacity-90'
              : 'bg-primary hover:bg-primary/90'
          }`}
        >
          {carregando ? 'Aguarde...' : textoConfirmar}
        </button>
        <button
          type="button"
          onClick={onCancelar}
          className="flex-1 rounded-lg border border-slate-200 bg-white py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          {textoCancelar}
        </button>
      </div>
    </Modal>
  );
}
