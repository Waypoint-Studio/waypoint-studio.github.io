import type { ReactElement, ReactNode } from 'react';
import { STATUS_LABEL, STATUS_TONE } from '@/domain/labels';
import type { OrderStatus } from '@/domain/types';
import { Icon } from '@/components/icons';

export const StatusPill = ({ status }: { readonly status: OrderStatus }): ReactElement => (
  <span className={`pill pill--${STATUS_TONE[status]}`}>{STATUS_LABEL[status]}</span>
);

export const Card = ({ children, className = '' }: { readonly children: ReactNode; readonly className?: string }): ReactElement => (
  <section className={`card ${className}`.trim()}>{children}</section>
);

export const Spinner = ({ label = 'Cargando' }: { readonly label?: string }): ReactElement => (
  <div className="spinner" role="status">
    <span className="spinner__dot" />
    <span className="spinner__label">{label}…</span>
  </div>
);

export const ErrorBox = ({ message, onRetry }: { readonly message: string; readonly onRetry?: () => void }): ReactElement => (
  <div className="error-box" role="alert">
    <Icon name="alert" />
    <p>{message}</p>
    {onRetry === undefined ? null : (
      <button type="button" className="btn btn--ghost" onClick={onRetry}>
        Reintentar
      </button>
    )}
  </div>
);

export const Empty = ({ title, children }: { readonly title: string; readonly children?: ReactNode }): ReactElement => (
  <div className="empty">
    <p className="empty__title">{title}</p>
    {children}
  </div>
);

export const PageHeader = ({
  title,
  subtitle,
  action,
}: {
  readonly title: string;
  readonly subtitle?: string;
  readonly action?: ReactNode;
}): ReactElement => (
  <header className="page-header">
    <div>
      <h1>{title}</h1>
      {subtitle === undefined ? null : <p className="page-header__subtitle">{subtitle}</p>}
    </div>
    {action}
  </header>
);
