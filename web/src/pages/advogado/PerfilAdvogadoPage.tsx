import { useEffect, useState } from 'react';
import { advogadosService, areasService, processosService } from '../../services/api';
import { Navbar } from '../../components/Navbar';
import { FormField } from '../../components/FormField';
import { TrocarPlanoModal } from '../../components/TrocarPlanoModal';
import { useToast } from '../../components/Toast';

const NAV = [
  { label: 'Oportunidades', to: '/' },
  { label: 'Meus Casos', to: '/meus-casos' },
  { label: 'Meus Clientes', to: '/meus-clientes' },
  { label: 'Meu Perfil', to: '/perfil' },
];

type Quota = { plano: string; limite: number | null; usadas: number; restantes: number | null };
type Area = { id: number; nome: string };

const INP = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800';

export function PerfilAdvogadoPage() {
  const [perfil, setPerfil] = useState<any>(null);
  const [todasAreas, setTodasAreas] = useState<Area[]>([]);
  const [quota, setQuota] = useState<Quota | null>(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [modalPlano, setModalPlano] = useState(false);
  const [form, setForm] = useState({ nome: '', oab: '', estadoAtuacao: '', cidadeAtuacao: '' });
  const { mostrar } = useToast();

  function aplicarPerfil(p: any) {
    setPerfil(p);
    setForm({
      nome: p.nome ?? '',
      oab: p.oab ?? '',
      estadoAtuacao: p.estadoAtuacao ?? '',
      cidadeAtuacao: p.cidadeAtuacao ?? '',
    });
  }

  useEffect(() => {
    Promise.all([advogadosService.meuPerfil(), processosService.quota(), areasService.listar()])
      .then(([{ data: p }, { data: q }, { data: a }]) => {
        aplicarPerfil(p);
        setQuota(q);
        setTodasAreas(a);
      })
      .finally(() => setLoading(false));
  }, []);

  async function salvarDados() {
    setSalvando(true);
    try {
      const { data } = await advogadosService.atualizarPerfil(form);
      aplicarPerfil(data);
      mostrar('Perfil atualizado', 'sucesso');
    } catch (e: any) {
      mostrar(e.response?.data?.message ?? 'Falha ao salvar', 'erro');
    } finally {
      setSalvando(false);
    }
  }

  async function adicionarArea(areaId: number) {
    try {
      const { data } = await advogadosService.adicionarArea(areaId);
      aplicarPerfil(data);
    } catch (e: any) {
      mostrar(e.response?.data?.message ?? 'Falha ao adicionar área', 'erro');
    }
  }

  async function removerArea(nome: string) {
    const area = todasAreas.find((a) => a.nome === nome);
    if (!area) return;
    try {
      const { data } = await advogadosService.removerArea(area.id);
      aplicarPerfil(data);
    } catch (e: any) {
      mostrar(e.response?.data?.message ?? 'Falha ao remover área', 'erro');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar items={NAV} />
        <div className="flex justify-center py-24">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  const areas: string[] = perfil?.areas ?? [];
  const disponiveis = todasAreas.filter((a) => !areas.includes(a.nome));
  const ini = perfil?.nome?.split(' ').filter(Boolean).map((n: string) => n[0]).slice(0, 2).join('') ?? '?';

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar items={NAV} />

      <div className="bg-primary">
        <div className="mx-auto flex max-w-5xl items-center gap-5 px-6 py-8">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-white/20 bg-white/15 text-2xl font-black text-white">
            {ini}
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-blue-300">Portal do Advogado</p>
            <h1 className="text-2xl font-extrabold text-white">{perfil?.nome}</h1>
            <p className="mt-1 text-sm text-blue-200">OAB {perfil?.oab} · ⭐ {perfil?.nota ?? '—'}</p>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 px-6 py-8 md:grid-cols-2">
        {/* Editar dados */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 md:col-span-2">
          <p className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400">Dados do perfil</p>
          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
            <FormField label="Nome">
              {(p) => <input {...p} className={INP} value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />}
            </FormField>
            <FormField label="OAB">
              {(p) => <input {...p} className={INP} value={form.oab} onChange={(e) => setForm({ ...form, oab: e.target.value })} />}
            </FormField>
            <FormField label="Estado de atuação (UF)">
              {(p) => <input {...p} className={INP} maxLength={2} value={form.estadoAtuacao} onChange={(e) => setForm({ ...form, estadoAtuacao: e.target.value.toUpperCase() })} />}
            </FormField>
            <FormField label="Cidade de atuação">
              {(p) => <input {...p} className={INP} value={form.cidadeAtuacao} onChange={(e) => setForm({ ...form, cidadeAtuacao: e.target.value })} />}
            </FormField>
          </div>
          <button
            type="button"
            onClick={salvarDados}
            disabled={salvando}
            className="mt-2 rounded-lg bg-primary px-5 py-2 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-60"
          >
            {salvando ? 'Salvando...' : 'Salvar'}
          </button>
        </div>

        {/* Áreas de atuação (N:N) */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 md:col-span-2">
          <p className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400">Áreas de atuação</p>
          <div className="flex flex-wrap gap-2">
            {areas.map((nome) => (
              <span key={nome} className="flex items-center gap-2 rounded-full bg-primary/8 px-3 py-1.5 text-sm font-semibold text-primary">
                {nome}
                <button
                  type="button"
                  onClick={() => removerArea(nome)}
                  aria-label={`Remover ${nome}`}
                  className="text-slate-400 hover:text-erro"
                >
                  ✕
                </button>
              </span>
            ))}
            {areas.length === 0 && <span className="text-sm text-slate-400">Nenhuma área cadastrada.</span>}
          </div>
          {disponiveis.length > 0 && (
            <div className="mt-4 flex items-center gap-2">
              <select
                aria-label="Adicionar área"
                defaultValue=""
                onChange={(e) => { if (e.target.value) { adicionarArea(Number(e.target.value)); e.target.value = ''; } }}
                className="rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-500"
              >
                <option value="" disabled>+ Adicionar área…</option>
                {disponiveis.map((a) => (
                  <option key={a.id} value={a.id}>{a.nome}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Plano */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Plano atual</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-800">{perfil?.plano?.nome}</p>
          {perfil?.plano && (
            <p className="mt-1 text-sm text-slate-500">
              R$ {Number(perfil.plano.valorMensal).toFixed(2)}/mês · R$ {Number(perfil.plano.valorAnual).toFixed(2)}/ano
            </p>
          )}
          <button type="button" onClick={() => setModalPlano(true)} className="mt-4 rounded-lg bg-secondary px-4 py-2 text-sm font-bold text-primary hover:bg-secondary/90">
            Trocar plano
          </button>
        </div>

        {/* Quota */}
        {quota && (
          <div className="rounded-2xl border border-slate-100 bg-white p-6">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Propostas neste mês</p>
            {quota.limite === null ? (
              <p className="text-3xl font-extrabold text-emerald-600">{quota.usadas} <span className="text-base font-medium text-slate-400">ilimitado</span></p>
            ) : (
              <>
                <p className="text-3xl font-extrabold text-slate-800">
                  {quota.usadas}<span className="text-xl text-slate-400"> / {quota.limite}</span>
                </p>
                <p className="mt-1 text-sm text-slate-500">{quota.restantes} restantes · {perfil?.clientesVinculados ?? 0} clientes vinculados</p>
              </>
            )}
          </div>
        )}
      </div>

      <TrocarPlanoModal
        aberto={modalPlano}
        onFechar={() => setModalPlano(false)}
        planoAtualNome={perfil?.plano?.nome}
        consumo={quota ? { ...quota } : null}
        onTrocado={() => {
          Promise.all([advogadosService.meuPerfil(), processosService.quota()]).then(([{ data: p }, { data: q }]) => {
            aplicarPerfil(p);
            setQuota(q);
          });
        }}
      />
    </div>
  );
}
