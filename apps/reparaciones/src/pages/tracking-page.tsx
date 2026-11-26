import type { ReactElement } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '@/api/client';
import { Icon } from '@/components/icons';
import { ErrorBox, Spinner } from '@/components/ui';
import { STATUS_LABEL, formatDate, formatDateTime, formatMoney } from '@/domain/labels';
import type { OrderStatus, PublicTracking } from '@/domain/types';
import { useQuery } from '@/hooks/use-query';

const STEPS: readonly OrderStatus[] = ['recibido', 'diagnostico', 'esperando_aprobacion', 'en_reparacion', 'listo', 'entregado'];

const HEADLINE: Readonly<Record<OrderStatus, string>> = {
  recibido: 'Recibimos tu equipo',
  diagnostico: 'Estamos revisando tu equipo',
  esperando_aprobacion: 'Tu presupuesto está listo',
  en_reparacion: 'Estamos reparando tu equipo',
  listo: '¡Tu equipo está listo para recoger!',
  entregado: 'Equipo entregado',
  cancelado: 'Orden cerrada',
};

const Progress = ({ tracking }: { readonly tracking: PublicTracking }): ReactElement => {
  const currentIndex = STEPS.indexOf(tracking.status);
  return (
    <ol className="progress">
      {STEPS.map((step, index) => {
        const event = tracking.history.findLast((item) => item.status === step);
        const state = index <= currentIndex ? 'done' : 'todo';
        return (
          <li key={step} className={`progress__step progress__step--${state}${index === currentIndex ? ' progress__step--current' : ''}`}>
            <span className="progress__dot">{index < currentIndex ? <Icon name="check" size={14} /> : null}</span>
            <span className="progress__label">{STATUS_LABEL[step]}</span>
            {event === undefined ? null : <span className="progress__time">{formatDateTime(event.at)}</span>}
          </li>
        );
      })}
    </ol>
  );
};

export const TrackingPage = (): ReactElement => {
  const { code = '' } = useParams();
  const { data, error } = useQuery(`track:${code}`, () => api.track(code));

  return (
    <div className="tracking">
      <div className="tracking__card">
        {error === null ? null : <ErrorBox message={error} />}
        {data === null && error === null ? <Spinner /> : null}
        {data === null ? null : (
          <>
            <p className="tracking__shop">{data.shopName}</p>
            <h1 className="tracking__title">{HEADLINE[data.status]}</h1>
            <p className="muted">
              {data.deviceLabel} · Orden {data.code}
            </p>
            {data.status === 'cancelado' ? null : <Progress tracking={data} />}
            <div className="tracking__facts">
              {data.quote !== null && data.quote > 0 ? (
                <p>
                  Presupuesto: <strong>{formatMoney(data.quote)}</strong>
                </p>
              ) : null}
              {data.balance === null ? null : (
                <p>
                  Saldo a pagar al recoger: <strong>{formatMoney(data.balance)}</strong>
                </p>
              )}
              {data.warrantyUntil === null ? null : (
                <p className="warranty warranty--on">
                  <Icon name="shield" size={18} /> Garantía de la reparación hasta el {formatDate(data.warrantyUntil)}
                </p>
              )}
            </div>
            <a className="btn btn--whatsapp btn--block" href={`https://wa.me/${data.shopPhone.replaceAll(/\D/g, '')}`} target="_blank" rel="noreferrer">
              <Icon name="whatsapp" size={18} /> Escribir al local
            </a>
          </>
        )}
      </div>
      <p className="tracking__footer">
        Seguimiento con <strong>Reparo</strong> · Demo
      </p>
    </div>
  );
};
