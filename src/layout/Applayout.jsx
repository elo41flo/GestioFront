import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/', label: 'Tableau de bord', end: true },
  { to: '/clients', label: 'Clients' },
  { to: '/devis', label: 'Devis' },
  { to: '/factures', label: 'Factures' },
  { to: '/parametres', label: 'Paramètres' },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const initial = (user?.nom_entreprise || 'G').trim()[0]?.toUpperCase() || 'G';

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">{initial}</div>
          <div>
            <div className="brand-name">{user?.nom_entreprise || 'Gestio'}</div>
            <div className="brand-sub">Micro-entreprise</div>
          </div>
        </div>
        <nav className="nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-foot">
          {user?.email}
          <br />
          <button onClick={logout}>Se déconnecter</button>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}