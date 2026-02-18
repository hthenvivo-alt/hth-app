import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Obras from './pages/Obras';
import Funciones from './pages/Funciones';
import LogisticaDetail from './pages/LogisticaDetail';
import Settings from './pages/Settings';
import Documentos from './pages/Documentos';
import Liquidacion from './pages/Liquidacion';
import LiquidacionDetalle from './pages/LiquidacionDetalle';
import LiquidacionGrupalDetalle from './pages/LiquidacionGrupalDetalle';
import Usuarios from './pages/Usuarios';
import ArtistReports from './pages/ArtistReports';
import Sidebar from './components/Sidebar';

const App: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="flex min-h-screen bg-[#0f0f0f] text-white">
        {user && <Sidebar />}
        <main className={`flex-1 ${user ? 'pl-64' : ''}`}>
          <Routes>
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/" element={user ? (user.rol === 'Artista' ? <Navigate to="/reportes" /> : <Dashboard />) : <Navigate to="/login" />} />
            <Route path="/reportes" element={(user?.rol === 'Artista' || user?.rol === 'Administrador' || user?.rol === 'Admin') ? <ArtistReports /> : <Navigate to="/" />} />
            <Route path="/obras" element={(user?.rol === 'Administrador' || user?.rol === 'Admin') ? <Obras /> : <Navigate to="/" />} />
            <Route path="/funciones" element={user ? <Funciones /> : <Navigate to="/login" />} />
            <Route path="/logistica/:id" element={user ? <LogisticaDetail /> : <Navigate to="/login" />} />
            <Route path="/documentos" element={user ? <Documentos /> : <Navigate to="/login" />} />
            <Route path="/liquidacion" element={(user?.rol === 'Administrador' || user?.rol === 'Admin') ? <Liquidacion /> : <Navigate to="/" />} />
            <Route path="/liquidacion/:funcionId" element={(user?.rol === 'Administrador' || user?.rol === 'Admin') ? <LiquidacionDetalle /> : <Navigate to="/" />} />
            <Route path="/liquidacion/grupal/:id" element={(user?.rol === 'Administrador' || user?.rol === 'Admin') ? <LiquidacionGrupalDetalle /> : <Navigate to="/" />} />
            <Route path="/usuarios" element={(user?.rol === 'Administrador' || user?.rol === 'Admin') ? <Usuarios /> : <Navigate to="/" />} />
            <Route path="/settings" element={(user?.rol === 'Administrador' || user?.rol === 'Admin') ? <Settings /> : <Navigate to="/" />} />
            {/* Add more routes here */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
