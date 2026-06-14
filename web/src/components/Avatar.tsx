interface AvatarProps {
  nome: string;
  fotoPath?: string | null;
  /** diâmetro em px */
  tamanho?: number;
}

function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter((p) => !/^(dr|dra|sr|sra)\.?$/i.test(p));
  const base = partes.length ? partes : nome.trim().split(/\s+/);
  return base.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('');
}

/** Foto de perfil com fallback para as iniciais do nome. */
export function Avatar({ nome, fotoPath, tamanho = 40 }: AvatarProps) {
  const estilo = { width: tamanho, height: tamanho, fontSize: tamanho * 0.4 };

  if (fotoPath) {
    return (
      <img
        src={fotoPath}
        alt={`Foto de ${nome}`}
        style={estilo}
        className="rounded-full object-cover"
      />
    );
  }

  return (
    <div
      style={estilo}
      className="flex items-center justify-center rounded-full bg-primary-light font-bold text-white"
      aria-label={`Avatar de ${nome}`}
    >
      {iniciais(nome)}
    </div>
  );
}
