import { useState, type ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/api/client';
import { Icon } from '@/components/icons';
import { useToast } from '@/components/toast';
import { Card, ErrorBox, PageHeader, Spinner } from '@/components/ui';
import { ACTIVE_STATUSES, STATUS_LABEL, UNCLAIMED_AFTER_DAYS, daysSince, deviceLabel, formatMoney } from '@/domain/labels';
import type { DashboardSummary } from '@/domain/types';
import { errorMessage, useQuery } from '@/hooks/use-query';

const Kpi = ({ label, value, hint }: { readonly label: string; readonly value: string; readonly hint: string }): ReactElement => (
  <div className="kpi">
    <p className="kpi__label">{label}</p>
    <p className="kpi__value">{value}</p>
    <p className="kpi__hint">{hint}</p>
  </div>
);

const Unclaimed = ({ summary, onChange }: { readonly summary: DashboardSummary; readonly onChange: () => void }): ReactElement => {
  const toast = useToast();
  const [sending, setSending] = useState<string | null>(null);

  const remind = (id: string): void => {
    setSending(id);
    api
      .sendReminder(id)
      .then((result) => {
        toast.whatsapp(result.message);
        onChange();
      })
      .catch((error: unknown) => toast.fail(errorMessage(error)))
      .finally(() => setSending(null));
  };

  if (summary.unclaimed.length === 0) {
    return <p className="muted">No hay equipos con más de {UNCLAIMED_AFTER_DAYS} días sin recoger.</p>;
  }

  return (
    <ul className="stack-list">
      {summary.unclaimed.map((order) => {
        const days = daysSince(order.readyAt ?? order.createdAt);
        const lastReminder = order.lastReminderAt === null ? 'Sin recordatorios' : `Último aviso hace ${daysSince(order.lastReminderAt)} días`;
        return (
          <li key={order.id} className="unclaimed">
            <Link to={`/ordenes/${order.id}`} className="unclaimed__info">
              <span className="unclaimed__days">{days} días</span>
              <span>
                <strong>{deviceLabel(order)}</strong> · {order.customer.name}
                <span className="unclaimed__meta">{lastReminder}</span>
              </span>
            </Link>
            <button type="button" className="btn btn--whatsapp btn--small" onClick={() => remind(order.id)} disabled={sending === order.id}>
              <Icon name="whatsapp" size={16} />
              {sending === order.id ? 'Enviando…' : 'Recordar'}
            </button>
          </li>
        );
      })}
    </ul>
  );
};

export const DashboardPage = (): ReactElement => {
  const { data, error, loading, reload } = useQuery('summary', () => api.getSummary());

  if (error !== null) {
    return <ErrorBox message={error} onRetry={reload} />;
  }
  if (data === null) {
    return <Spinner />;
  }

  const active = ACTIVE_STATUSES.reduce((sum, status) => sum + data.byStatus[status], 0);

  return (
    <div className={`page${loading ? ' page--refreshing' : ''}`}>
      <PageHeader
        title="Tablero"
        subtitle="Lo que pasa hoy en el local"
        action={
          <Link to="/ordenes/nueva" className="btn btn--primary">
            <Icon name="plus" size={18} />
            Recibir equipo
          </Link>
        }
      />

      <div className="kpis">
        <Kpi label="Equipos en el local" value={String(active)} hint="Sin entregar" />
        <Kpi label="Listos para recoger" value={String(data.byStatus.listo)} hint={`${data.unclaimed.length} con más de ${UNCLAIMED_AFTER_DAYS} días`} />
        <Kpi label="Ingresos del mes" value={formatMoney(data.revenueThisMonth)} hint={`${data.deliveredThisMonth} equipos entregados`} />
        <Kpi label="Tiempo de reparación" value={`${data.avgRepairDays.toFixed(1)} días`} hint={`${data.messagesThisWeek} avisos enviados esta semana`} />
      </div>

      <Card>
        <h2 className="card__title">Por estado</h2>
        <div className="pipeline">
          {ACTIVE_STATUSES.map((status) => (
            <Link key={status} to={`/ordenes?estado=${status}`} className={`pipeline__step pipeline__step--${status}`}>
              <span className="pipeline__count">{data.byStatus[status]}</span>
              <span className="pipeline__label">{STATUS_LABEL[status]}</span>
            </Link>
          ))}
        </div>
      </Card>

      <div className="grid-2">
        <Card className="card--alert">
          <h2 className="card__title">
            <Icon name="clock" /> Equipos sin recoger
          </h2>
          <Unclaimed summary={data} onChange={reload} />
        </Card>
        <Card>
          <h2 className="card__title">
            <Icon name="box" /> Repuestos por agotarse
          </h2>
          {data.lowStock.length === 0 ? (
            <p className="muted">Todo el inventario está por encima del mínimo.</p>
          ) : (
            <ul className="stack-list">
              {data.lowStock.map((part) => (
                <li key={part.id} className="stock-line">
                  <span>{part.name}</span>
                  <span className={part.stock === 0 ? 'stock-badge stock-badge--out' : 'stock-badge'}>
                    {part.stock === 0 ? 'Agotado' : `Quedan ${part.stock}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link to="/repuestos" className="link-more">
            Ver inventario
          </Link>
        </Card>
      </div>
    </div>
  );
};
