import { useEffect, useState } from 'react';
import { authService } from '../../services/api';
import { Navbar } from '../../components/Navbar';
import { useAuth } from '../../contexts/AuthContext';

const NAV = [
  { label: 'Meus Casos', to: '/' },
  { label: 'Encontrar Advogado', to: '/buscar' },
  { label: 'Vinculados', to: '/minhas-conexoes' },
  { label: 'Minha Conta', to: '/perfil' },
];

type Perfil = {
  id: number;
  nome: string;
  email: string;
  documento: string;
  dataCadastro: string;
};

export function PerfilClientePage() {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [loading, setLoading] = useState(true);
  const { logout } = useAuth();

  useEffect(() => {
    authService.me()
      .then(({ data }) => setPerfil(data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar items={NAV} />

      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-extrabold text-slate-800 mb-8">Minha Conta</h1>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : perfil ? (
          <>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="bg-primary px-8 py-8 flex items-center gap-5">
                <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center text-white font-black text-3xl">
                  {perfil.nome[0]?.toUpperCase()}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{perfil.nome}</h2>
                  <p className="text-blue-200 mt-1">{perfil.email}</p>
                </div>
              </div>

              <div className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Documento</p>
                  <p className="text-slate-800 font-medium">{perfil.documento}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Cliente desde</p>
                  <p className="text-slate-800 font-medium">
                    {new Date(perfil.dataCadastro).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={logout}
              className="mt-6 w-full bg-red-50 border border-red-100 text-red-600 font-bold py-4 rounded-xl hover:bg-red-100 transition-colors"
            >
              Sair da conta
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
