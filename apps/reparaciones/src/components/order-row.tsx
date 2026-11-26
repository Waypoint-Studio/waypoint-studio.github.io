import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { daysSince, deviceLabel } from '@/domain/labels';
import type { RepairOrder } from '@/domain/types';
import { StatusPill } from '@/components/ui';

const ageLabel = (order: RepairOrder): string => {
  const days = daysSince(order.history.at(-1)?.at ?? order.createdAt);
  if (days === 0) {
    return 'Hoy';
  }
  return days === 1 ? 'Ayer' : `Hace ${days} días`;
};

export const OrderRow = ({ order }: { readonly order: RepairOrder }): ReactElement => (
  <Link to={`/ordenes/${order.id}`} className="order-row">
    <div className="order-row__main">
      <p className="order-row__title">
        <span className="order-row__code">{order.code}</span>
        {deviceLabel(order)}
      </p>
      <p className="order-row__meta">
        {order.customer.name} · {order.issue}
      </p>
    </div>
    <div className="order-row__side">
      <StatusPill status={order.status} />
      <span className="order-row__age">{ageLabel(order)}</span>
    </div>
  </Link>
);
