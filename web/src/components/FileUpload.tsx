import { useRef, useState } from 'react';

interface FileUploadProps {
  onArquivo: (arquivo: File) => void;
  /** MIME types aceitos (espelha o backend). */
  tiposPermitidos?: string[];
  maxMB?: number;
  label?: string;
}

const PADRAO_TIPOS = ['image/jpeg', 'image/png', 'application/pdf'];

/**
 * Seleção de arquivo com validação cliente (tipo + tamanho) espelhando o backend
 * (NFR5). Mostra erro amigável no próprio componente; só chama onArquivo se válido.
 */
export function FileUpload({
  onArquivo,
  tiposPermitidos = PADRAO_TIPOS,
  maxMB = 5,
  label = 'Selecionar arquivo',
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [nomeArquivo, setNomeArquivo] = useState<string | null>(null);

  function aoSelecionar(arquivo?: File) {
    if (!arquivo) return;
    if (!tiposPermitidos.includes(arquivo.type)) {
      setErro('Tipo de arquivo não permitido. Envie jpg, png ou pdf.');
      setNomeArquivo(null);
      return;
    }
    if (arquivo.size > maxMB * 1024 * 1024) {
      setErro(`Arquivo muito grande. Tamanho máximo: ${maxMB}MB.`);
      setNomeArquivo(null);
      return;
    }
    setErro(null);
    setNomeArquivo(arquivo.name);
    onArquivo(arquivo);
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={tiposPermitidos.join(',')}
        className="hidden"
        onChange={(e) => aoSelecionar(e.target.files?.[0])}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
      >
        {label}
      </button>
      {nomeArquivo && <span className="ml-3 text-xs text-slate-500">{nomeArquivo}</span>}
      {erro && (
        <p role="alert" className="mt-1 text-xs text-[var(--color-erro)]">
          {erro}
        </p>
      )}
    </div>
  );
}
