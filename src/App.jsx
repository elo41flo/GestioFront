import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AppLayout from './layout/AppLayout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Clients from './pages/Clients.jsx';
import Devis from './pages/Devis.jsx';
import Factures from './pages/Factures.jsx';
import Parametres from './pages/Parametres.jsx';
import Welcome from './pages/Welcome.jsx';
import './App.css';
import './styles.css';

export default function App() {
  return (
    <Routes>
      <Route path="/welcome" element={<Welcome />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="clients" element={<Clients />} />
        <Route path="devis" element={<Devis />} />
        <Route path="factures" element={<Factures />} />
        <Route path="parametres" element={<Parametres />} />
      </Route>
    </Routes>
  );
}