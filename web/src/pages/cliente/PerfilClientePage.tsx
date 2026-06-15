import { useEffect, useState } from 'react';
import { clientesService, midiaService } from '../../services/api';
import { Navbar } from '../../components/Navbar';
import { useAuth } from '../../contexts/AuthContext';
import { FormField, PrivacyField } from '../../components/FormField';
import { Avatar } from '../../components/Avatar';
import { FileUpload } from '../../components/FileUpload';
import { useToast } from '../../components/Toast';

const NAV = [
  { label: 'Meus Casos', to: '/' },
  { label: 'Encontrar Advogado', to: '/buscar' },
  { label: 'Vinculados', to: '/minhas-conexoes' },
  { label: 'Minha Conta', to: '/perfil' },
];

const INP = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800';
const CAMPOS = ['nome', 'email', 'documento', 'dataNascimento', 'telefone', 'enderecoLogradouro', 'enderecoNumero', 'enderecoBairro', 'enderecoCidade', 'enderecoEstado', 'enderecoCep'] as const;
type Campo = (typeof CAMPOS)[number];

export function PerfilClientePage() {
  const [perfil, setPerfil] = useState<any>(null);
  const [form, setForm] = useState<Record<Campo, string>>({} as Record<Campo, string>);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const { logout } = useAuth();
  const { mostrar } = useToast();

  function aplicar(p: any) {
    setPerfil(p);
    const f = {} as Record<Campo, string>;
    CAMPOS.forEach((c) => (f[c] = c === 'dataNascimento' && p[c] ? String(p[c]).slice(0, 10) : (p[c] ?? '')));
    setForm(f);
  }

  useEffect(() => {
    clientesService.meuPerfil().then(({ data }) => aplicar(data)).finally(() => setLoading(false));
  }, []);

  async function salvar() {
    setSalvando(true);
    try {
      const { data } = await clientesService.atualizarPerfil(form);
      aplicar(data);
      mostrar('Perfil atualizado', 'sucesso');
    } catch (e: any) {
      mostrar(e.response?.data?.message ?? 'Falha ao salvar', 'erro');
    } finally {
      setSalvando(false);
    }
  }

  async function enviarFoto(arquivo: File) {
    try {
      await midiaService.enviarFoto(arquivo);
      const { data } = await clientesService.meuPerfil();
      aplicar(data);
      mostrar('Foto atualizada', 'sucesso');
    } catch {
      mostrar('Falha ao enviar foto', 'erro');
    }
  }

  async function enviarDocumento(arquivo: File) {
    try {
      await midiaService.enviarDocumento(arquivo);
      const { data } = await clientesService.meuPerfil();
      aplicar(data);
      mostrar('Documento enviado (privado)', 'sucesso');
    } catch {
      mostrar('Falha ao enviar documento', 'erro');
    }
  }

  const set = (c: Campo) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [c]: e.target.value });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar items={NAV} />
        <div className="flex justify-center py-24"><div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar items={NAV} />

      <div className="bg-primary">
        <div className="mx-auto flex max-w-3xl items-center gap-5 px-6 py-8">
          <Avatar nome={perfil?.nome ?? '?'} fotoPath={perfil?.fotoPath} tamanho={72} />
          <div>
            <h1 className="text-2xl font-extrabold text-white">{perfil?.nome}</h1>
            <p className="mt-1 text-sm text-blue-200">{perfil?.email}</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-8">
        {/* Foto */}
        <div className="mb-6 rounded-2xl border border-slate-100 bg-white p-6">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Foto de perfil <span className="font-normal text-slate-400">(pública)</span></p>
          <FileUpload onArquivo={enviarFoto} tiposPermitidos={['image/jpeg', 'image/png']} label="Alterar foto" />
        </div>

        {/* Dados públicos */}
        <div className="mb-6 rounded-2xl border border-slate-100 bg-white p-6">
          <p className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400">Dados básicos</p>
          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
            <FormField label="Nome completo">{(p) => <input {...p} className={INP} value={form.nome} onChange={set('nome')} />}</FormField>
            <FormField label="E-mail">{(p) => <input {...p} type="email" className={INP} value={form.email} onChange={set('email')} />}</FormField>
            <FormField label="CPF / CNPJ">{(p) => <input {...p} className={INP} value={form.documento} onChange={set('documento')} />}</FormField>
            <FormField label="Data de nascimento">{(p) => <input {...p} type="date" className={INP} value={form.dataNascimento} onChange={set('dataNascimento')} />}</FormField>
          </div>
        </div>

        {/* Dados privados */}
        <div className="mb-6 rounded-2xl border border-slate-100 bg-white p-6">
          <div className="mb-2 flex items-center gap-2">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Dados privados</p>
            <span className="text-xs text-slate-400">🔒 só você e a plataforma</span>
          </div>
          <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            🔒 Seus documentos e contatos privados <b>nunca são compartilhados</b> com advogados.
          </p>
          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
            <PrivacyField label="Telefone">{(p) => <input {...p} className={INP} value={form.telefone} onChange={set('telefone')} />}</PrivacyField>
            <PrivacyField label="Logradouro">{(p) => <input {...p} className={INP} value={form.enderecoLogradouro} onChange={set('enderecoLogradouro')} />}</PrivacyField>
            <PrivacyField label="Número">{(p) => <input {...p} className={INP} value={form.enderecoNumero} onChange={set('enderecoNumero')} />}</PrivacyField>
            <PrivacyField label="Bairro">{(p) => <input {...p} className={INP} value={form.enderecoBairro} onChange={set('enderecoBairro')} />}</PrivacyField>
            <PrivacyField label="Cidade">{(p) => <input {...p} className={INP} value={form.enderecoCidade} onChange={set('enderecoCidade')} />}</PrivacyField>
            <PrivacyField label="UF">{(p) => <input {...p} maxLength={2} className={INP} value={form.enderecoEstado} onChange={(e) => setForm({ ...form, enderecoEstado: e.target.value.toUpperCase() })} />}</PrivacyField>
            <PrivacyField label="CEP">{(p) => <input {...p} className={INP} value={form.enderecoCep} onChange={set('enderecoCep')} />}</PrivacyField>
          </div>
          <div className="mt-2">
            <p className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">Documento (RG/CPF) <span className="text-xs font-normal text-slate-400">🔒 privado · acesso autenticado</span></p>
            <FileUpload onArquivo={enviarDocumento} label="Enviar documento" />
            {perfil?.temDocumento && <p className="mt-1 text-xs text-emerald-600">✓ Documento enviado (privado).</p>}
          </div>
        </div>

        <button type="button" onClick={salvar} disabled={salvando} className="rounded-lg bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-60">
          {salvando ? 'Salvando...' : 'Salvar alterações'}
        </button>

        <button type="button" onClick={logout} className="mt-6 w-full rounded-xl border border-red-100 bg-red-50 py-4 font-bold text-red-600 hover:bg-red-100">
          Sair da conta
        </button>
      </div>
    </div>
  );
}
