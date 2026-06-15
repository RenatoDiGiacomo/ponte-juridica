import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginPage } from './pages/auth/LoginPage';
import { RegistroPage } from './pages/auth/RegistroPage';
import { BuscarAdvogadosPage } from './pages/cliente/BuscarAdvogadosPage';
import { MinhasConexoesPage } from './pages/cliente/MinhasConexoesPage';
import { MeusCasosPage } from './pages/cliente/MeusCasosPage';
import { CriarCasoPage } from './pages/cliente/CriarCasoPage';
import { PerfilClientePage } from './pages/cliente/PerfilClientePage';
import { OportunidadesPage } from './pages/advogado/OportunidadesPage';
import { MeusClientesPage } from './pages/advogado/MeusClientesPage';
import { PerfilAdvogadoPage } from './pages/advogado/PerfilAdvogadoPage';
import { MeusCasosAdvogadoPage } from './pages/advogado/MeusCasosAdvogadoPage';

function AppRoutes() {
  const { token, tipo, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">Carregando...</div>;
  }

  if (!token) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registro" element={<RegistroPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  if (tipo === 'cliente') {
    return (
      <Routes>
        <Route path="/" element={<MeusCasosPage />} />
        <Route path="/casos/novo" element={<CriarCasoPage />} />
        <Route path="/buscar" element={<BuscarAdvogadosPage />} />
        <Route path="/minhas-conexoes" element={<MinhasConexoesPage />} />
        <Route path="/perfil" element={<PerfilClientePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  if (tipo === 'advogado') {
    return (
      <Routes>
        <Route path="/" element={<OportunidadesPage />} />
        <Route path="/meus-casos" element={<MeusCasosAdvogadoPage />} />
        <Route path="/meus-clientes" element={<MeusClientesPage />} />
        <Route path="/perfil" element={<PerfilAdvogadoPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
