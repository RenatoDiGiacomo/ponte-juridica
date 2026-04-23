import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginPage } from './pages/auth/LoginPage';
import { RegistroPage } from './pages/auth/RegistroPage';
import { BuscarAdvogadosPage } from './pages/cliente/BuscarAdvogadosPage';
import { MinhasConexoesPage } from './pages/cliente/MinhasConexoesPage';
import { DashboardAdvogadoPage } from './pages/advogado/DashboardAdvogadoPage';

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
        <Route path="/" element={<BuscarAdvogadosPage />} />
        <Route path="/minhas-conexoes" element={<MinhasConexoesPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  if (tipo === 'advogado') {
    return (
      <Routes>
        <Route path="/" element={<DashboardAdvogadoPage />} />
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
