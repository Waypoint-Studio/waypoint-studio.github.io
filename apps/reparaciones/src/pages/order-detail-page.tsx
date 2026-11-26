import { useState, type ReactElement } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '@/api/client';
import { Icon } from '@/components/icons';
import { Card, ErrorBox, Spinner, StatusPill } from '@/components/ui';
import { STATUS_LABEL, deviceLabel, formatDateTime, formatMoney, partsTotal } from '@/domain/labels';
import type { ActionResult, RepairOrder } from '@/domain/types';
import { useQuery } from '@/hooks/use-query';
import { OrderActions } from '@/pages/order-actions';

const whatsappLink = (phone: string): string => `https://wa.me/${phone.replaceAll(/\D/g, '')}`;

const Money = ({ order }: { readonly order: RepairOrder }): ReactElement => {
  const total = order.finalPrice ?? order.quote ?? order.estimate;
  return (
    <dl className="facts">
      <div>
        <dt>Estimado al recibir</dt>
        <dd>{formatMoney(order.estimate)}</dd>
      </div>
      <div>
        <dt>Presupuesto</dt>
        <dd>{order.quote === null ? 'Pendiente' : formatMoney(order.quote)}</dd>
      </div>
      <div>
        <dt>Abono</dt>
        <dd>{formatMoney(order.deposit)}</dd>
      </div>
      <div>
        <dt>Repuestos usados</dt>
        <dd>{order.parts.length === 0 ? 'Ninguno' : formatMoney(partsTotal(order))}</dd>
      </div>
      <div>
        <dt>{order.status === 'entregado' ? 'Cobrado' : 'Saldo'}</dt>
        <dd>
          <strong>{formatMoney(order.status === 'entregado' ? total : Math.max(0, total - order.deposit))}</strong>
        </dd>
      </div>
    </dl>
  );
};

const Messages = ({ orderId, version }: { readonly orderId: string; readonly version: number }): ReactElement => {
  const { data } = useQuery(`messages:${orderId}:${version}`, () => api.listMessages(orderId));
  if (data === null) {
    return <Spinner label="Cargando mensajes" />;
  }
  if (data.length === 0) {
    return <p className="muted">Aún no se han enviado mensajes.</p>;
  }
  return (
    <ul className="bubbles">
      {data.map((message) => (
        <li key={message.id} className="bubble">
          <p>{message.text}</p>
          <span className="bubble__time">
            {formatDateTime(message.at)} <Icon name="check" size={14} />
          </span>
        </li>
      ))}
    </ul>
  );
};

export const OrderDetailPage = (): ReactElement => {
  const { id = '' } = useParams();
  const { data, error, reload } = useQuery(`order:${id}`, () => api.getOrder(id));
  const [current, setCurrent] = useState<RepairOrder | null>(null);
  const [version, setVersion] = useState(0);

  if (error !== null) {
    return <ErrorBox message={error} onRetry={reload} />;
  }
  const fetched = data?.id === id ? data : null;
  const order = current?.id === id ? current : fetched;
  if (order === null) {
    return <Spinner />;
  }

  const handleDone = (result: ActionResult): void => {
    setCurrent(result.order);
    setVersion((value) => value + 1);
  };

  return (
    <div className="page">
      <Link to="/ordenes" className="back">
        <Icon name="back" size={18} /> Órdenes
      </Link>

      <header className="detail-header">
        <div>
          <p className="detail-header__code">{order.code}</p>
          <h1>{deviceLabel(order)}</h1>
          <p className="muted">{order.issue}</p>
        </div>
        <StatusPill status={order.status} />
      </header>

      <Card className="card--action">
        <h2 className="card__title">{order.status === 'entregado' || order.status === 'cancelado' ? 'Resumen' : 'Siguiente paso'}</h2>
        <OrderActions order={order} onDone={handleDone} />
      </Card>

      <div className="grid-2">
        <Card>
          <h2 className="card__title">Cliente</h2>
          <p className="strong">{order.customer.name}</p>
          <p className="muted">{order.customer.phone}</p>
          <div className="action__buttons">
            <a className="btn btn--ghost btn--small" href={whatsappLink(order.customer.phone)} target="_blank" rel="noreferrer">
              <Icon name="whatsapp" size={16} /> Abrir chat
            </a>
            <a className="btn btn--ghost btn--small" href={`#/seguimiento/${order.code}`} target="_blank" rel="noreferrer">
              <Icon name="link" size={16} /> Ver como el cliente
            </a>
          </div>
        </Card>
        <Card>
          <h2 className="card__title">Valores</h2>
          <Money order={order} />
        </Card>
      </div>

      <Card>
        <h2 className="card__title">Equipo al recibir</h2>
        <p className="muted">
          Color {order.device.color || 'sin registrar'} · Técnico {order.technician}
        </p>
        <div className="tags">
          {order.conditions.map((condition) => (
            <span key={condition} className="tag">
              {condition}
            </span>
          ))}
        </div>
        {order.photos.length > 0 ? (
          <div className="photos">
            {order.photos.map((photo, index) => (
              <a key={photo.slice(-24)} className="photo" href={photo} target="_blank" rel="noreferrer">
                <img src={photo} alt={`Foto ${index + 1} al recibir`} />
              </a>
            ))}
          </div>
        ) : (
          <p className="muted small">Sin fotos de recepción.</p>
        )}
      </Card>

      <div className="grid-2">
        <Card>
          <h2 className="card__title">Historial</h2>
          <ol className="timeline">
            {[...order.history].reverse().map((event) => (
              <li key={`${event.status}-${event.at}`}>
                <p className="strong">{STATUS_LABEL[event.status]}</p>
                <p className="muted small">{formatDateTime(event.at)}</p>
                {event.note === '' ? null : <p className="small">{event.note}</p>}
              </li>
            ))}
          </ol>
        </Card>
        <Card>
          <h2 className="card__title">
            <Icon name="whatsapp" /> Mensajes al cliente
          </h2>
          <Messages orderId={order.id} version={version} />
        </Card>
      </div>
    </div>
  );
};
