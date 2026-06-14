import { useEffect, useRef, type ReactNode } from 'react';

interface ModalProps {
  aberto: boolean;
  onFechar: () => void;
  titulo: string;
  children: ReactNode;
  /** 'reforcado' = ação destrutiva (ex.: encerrar caso), com destaque de aviso. */
  variante?: 'padrao' | 'reforcado';
}

/**
 * Modal acessível sobre o elemento nativo <dialog> (NFR9): foco preso, Esc e
 * backdrop "de graça" do browser. Transição suave via @starting-style (index.css).
 * Encapsula showModal()/close() num único componente (não espalhar pelas telas).
 */
export function Modal({ aberto, onFechar, titulo, children, variante = 'padrao' }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dlg = ref.current;
    if (!dlg) return;
    if (aberto && !dlg.open) dlg.showModal();
    else if (!aberto && dlg.open) dlg.close();
  }, [aberto]);

  return (
    <dialog
      ref={ref}
      className="modal-dialog w-full max-w-md rounded-2xl border border-slate-100 p-0 shadow-2xl backdrop:bg-slate-900/50"
      aria-labelledby="modal-titulo"
      onClose={onFechar}
      onClick={(e) => {
        // clique no backdrop (alvo é o próprio <dialog>, não o conteúdo) fecha
        if (e.target === ref.current) onFechar();
      }}
    >
      <div className="p-6">
        <h2
          id="modal-titulo"
          className={`text-lg font-bold ${variante === 'reforcado' ? 'text-erro' : 'text-slate-800'}`}
        >
          {titulo}
        </h2>
        <div className="mt-3 text-sm text-slate-600">{children}</div>
      </div>
    </dialog>
  );
}
