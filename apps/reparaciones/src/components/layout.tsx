import { useState, type ReactElement } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { api } from '@/api/client';
import { SHOP_NAME } from '@/api/mock/messages';
import { Icon, type IconName } from '@/components/icons';
import { useToast } from '@/components/toast';

interface NavItem {
  readonly to: string;
  readonly label: string;
  readonly icon: IconName;
  readonly end?: boolean;
}

const NAV: readonly NavItem[] = [
  { to: '/', label: 'Tablero', icon: 'home', end: true },
  { to: '/ordenes', label: 'Órdenes', icon: 'list', end: true },
  { to: '/ordenes/nueva', label: 'Recibir', icon: 'plus' },
  { to: '/repuestos', label: 'Repuestos', icon: 'box' },
  { to: '/mensajes', label: 'Mensajes', icon: 'chat' },
];

export const Layout = (): ReactElement => {
  const toast = useToast();
  const navigate = useNavigate();
  const [resetting, setResetting] = useState(false);

  const resetDemo = (): void => {
    setResetting(true);
    api
      .reset()
      .then(() => {
        toast.notify('Demo reiniciada', 'Se restauraron los datos de ejemplo.');
        navigate('/');
        globalThis.location.reload();
      })
      .catch(() => toast.fail('No se pudo reiniciar la demo.'))
      .finally(() => setResetting(false));
  };

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand__mark">
            <Icon name="check" size={18} />
          </span>
          <div>
            <p className="brand__name">Reparo</p>
            <p className="brand__shop">{SHOP_NAME}</p>
          </div>
        </div>
        <nav className="nav" aria-label="Principal">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end ?? false}
              className={({ isActive }) => `nav__item${isActive ? ' nav__item--active' : ''}${item.icon === 'plus' ? ' nav__item--primary' : ''}`}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="demo-note">
          <p>
            <strong>Demo:</strong> los datos son de ejemplo y los mensajes de WhatsApp son simulados. Todo se guarda solo en este navegador.
          </p>
          <button type="button" className="btn btn--ghost btn--small" onClick={resetDemo} disabled={resetting}>
            <Icon name="refresh" size={16} />
            {resetting ? 'Reiniciando…' : 'Reiniciar datos'}
          </button>
        </div>
      </aside>
      <div className="topbar">
        <span className="brand__name">Reparo</span>
        <span className="topbar__badge">Demo</span>
      </div>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
};
