import { useState, type FormEvent, type ReactElement } from 'react';
import { api } from '@/api/client';
import { Icon } from '@/components/icons';
import { useToast } from '@/components/toast';
import { daysSince, formatDate, formatMoney, partsTotal } from '@/domain/labels';
import type { ActionResult, Part, RepairOrder } from '@/domain/types';
import { errorMessage, useQuery } from '@/hooks/use-query';

interface ActionProps {
  readonly order: RepairOrder;
  readonly onDone: (result: ActionResult) => void;
}

const WARRANTY_OPTIONS: readonly number[] = [15, 30, 60, 90];

const useAction = (onDone: (result: ActionResult) => void) => {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const run = (action: () => Promise<ActionResult>): void => {
    setBusy(true);
    action()
      .then((result) => {
        if (result.message === null) {
          toast.notify('Cambios guardados');
        } else {
          toast.whatsapp(result.message);
        }
        onDone(result);
      })
      .catch((error: unknown) => toast.fail(errorMessage(error)))
      .finally(() => setBusy(false));
  };
  return { busy, run };
};

const toAmount = (value: string): number => Number(value.replaceAll(/\D/g, '')) || 0;

const Diagnose = ({ order, onDone }: ActionProps): ReactElement => {
  const { busy, run } = useAction(onDone);
  return (
    <div className="action">
      <p>El equipo está en la vitrina de recibidos. Cuando el técnico lo tome, el cliente recibe un aviso.</p>
      <button type="button" className="btn btn--primary" disabled={busy} onClick={() => run(() => api.startDiagnosis(order.id))}>
        <Icon name="whatsapp" size={18} />
        Empezar diagnóstico y avisar
      </button>
    </div>
  );
};

const Quote = ({ order, onDone }: ActionProps): ReactElement => {
  const { busy, run } = useAction(onDone);
  const [amount, setAmount] = useState(String(order.estimate || ''));
  const [note, setNote] = useState('');
  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    run(() => api.sendQuote(order.id, toAmount(amount), note));
  };
  return (
    <form className="action" onSubmit={submit}>
      <p>Escribe el presupuesto. El cliente lo recibe por WhatsApp y responde si aprueba.</p>
      <div className="fields">
        <label className="field">
          <span>Presupuesto</span>
          <input required inputMode="numeric" value={amount} onChange={(event) => setAmount(event.target.value)} />
        </label>
        <label className="field">
          <span>Detalle para el cliente</span>
          <input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Ej: Cambio de pantalla original." />
        </label>
      </div>
      <button type="submit" className="btn btn--whatsapp" disabled={busy}>
        <Icon name="whatsapp" size={18} />
        Enviar presupuesto
      </button>
    </form>
  );
};

const Approval = ({ order, onDone }: ActionProps): ReactElement => {
  const { busy, run } = useAction(onDone);
  return (
    <div className="action">
      <p>
        Presupuesto enviado: <strong>{formatMoney(order.quote ?? 0)}</strong>. Cuando el cliente responda, registra su decisión.
      </p>
      <div className="action__buttons">
        <button type="button" className="btn btn--primary" disabled={busy} onClick={() => run(() => api.answerQuote(order.id, true))}>
          <Icon name="check" size={18} />
          Cliente aprobó
        </button>
        <button type="button" className="btn btn--ghost" disabled={busy} onClick={() => run(() => api.answerQuote(order.id, false))}>
          No aprobó, devolver sin reparar
        </button>
      </div>
    </div>
  );
};

const Repair = ({ order, onDone }: ActionProps): ReactElement => {
  const { busy, run } = useAction(onDone);
  const { data: parts } = useQuery<readonly Part[]>(`parts:${order.parts.length}`, () => api.listParts());
  const [partId, setPartId] = useState('');
  const available = (parts ?? []).filter((part) => part.stock > 0);
  const selected = partId === '' ? available[0]?.id ?? '' : partId;
  return (
    <div className="action">
      <p>Registra los repuestos usados para saber cuánto deja la reparación y descontarlos del inventario.</p>
      <div className="inline-form">
        <select value={selected} onChange={(event) => setPartId(event.target.value)} aria-label="Repuesto">
          {available.map((part) => (
            <option key={part.id} value={part.id}>
              {part.name} · {formatMoney(part.price)} · quedan {part.stock}
            </option>
          ))}
        </select>
        <button type="button" className="btn btn--ghost" disabled={busy || selected === ''} onClick={() => run(() => api.addPart(order.id, selected, 1))}>
          <Icon name="plus" size={16} />
          Agregar
        </button>
      </div>
      <button type="button" className="btn btn--whatsapp" disabled={busy} onClick={() => run(() => api.markReady(order.id))}>
        <Icon name="whatsapp" size={18} />
        Marcar listo y avisar al cliente
      </button>
    </div>
  );
};

const Deliver = ({ order, onDone }: ActionProps): ReactElement => {
  const { busy, run } = useAction(onDone);
  const suggested = order.quote ?? order.estimate;
  const [price, setPrice] = useState(String(suggested));
  const [warranty, setWarranty] = useState(order.quote === 0 ? 0 : 30);
  const days = daysSince(order.readyAt ?? order.createdAt);
  const balance = Math.max(0, toAmount(price) - order.deposit);
  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    run(() => api.deliver(order.id, toAmount(price), warranty));
  };
  return (
    <form className="action" onSubmit={submit}>
      <p className={days >= 15 ? 'action__warning' : ''}>
        Listo desde hace {days} {days === 1 ? 'día' : 'días'}.
        {order.lastReminderAt === null ? ' No se ha enviado recordatorio.' : ` Último recordatorio: ${formatDate(order.lastReminderAt)}.`}
      </p>
      <div className="fields">
        <label className="field">
          <span>Valor final</span>
          <input inputMode="numeric" value={price} onChange={(event) => setPrice(event.target.value)} />
        </label>
        <label className="field">
          <span>Garantía de la reparación</span>
          <select value={warranty} onChange={(event) => setWarranty(Number(event.target.value))}>
            <option value={0}>Sin garantía</option>
            {WARRANTY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option} días
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="muted">
        Abono {formatMoney(order.deposit)} · Cobrar al entregar: <strong>{formatMoney(balance)}</strong>
      </p>
      <div className="action__buttons">
        <button type="submit" className="btn btn--primary" disabled={busy}>
          <Icon name="check" size={18} />
          Entregar al cliente
        </button>
        <button type="button" className="btn btn--whatsapp" disabled={busy} onClick={() => run(() => api.sendReminder(order.id))}>
          <Icon name="whatsapp" size={18} />
          Enviar recordatorio
        </button>
      </div>
    </form>
  );
};

const warrantyText = (order: RepairOrder, untilIso: string, active: boolean): string => {
  if (order.warrantyDays === 0) {
    return 'Sin garantía.';
  }
  const state = active ? 'vigente' : 'vencida';
  return `Garantía de ${order.warrantyDays} días ${state} hasta el ${formatDate(untilIso)}.`;
};

const Delivered = ({ order }: { readonly order: RepairOrder }): ReactElement => {
  const until = new Date(new Date(order.deliveredAt ?? order.createdAt).getTime() + order.warrantyDays * 86_400_000).toISOString();
  const active = daysSince(until) < 0;
  return (
    <div className="action">
      <p>
        Entregado el {formatDate(order.deliveredAt ?? order.createdAt)} por {formatMoney(order.finalPrice ?? 0)}.
        {order.parts.length > 0 ? ` Repuestos: ${formatMoney(partsTotal(order))}.` : ''}
      </p>
      <p className={active ? 'warranty warranty--on' : 'warranty'}>
        <Icon name="shield" size={18} />
        {warrantyText(order, until, active)}
      </p>
    </div>
  );
};

export const OrderActions = ({ order, onDone }: ActionProps): ReactElement => {
  switch (order.status) {
    case 'recibido':
      return <Diagnose order={order} onDone={onDone} />;
    case 'diagnostico':
      return <Quote order={order} onDone={onDone} />;
    case 'esperando_aprobacion':
      return <Approval order={order} onDone={onDone} />;
    case 'en_reparacion':
      return <Repair order={order} onDone={onDone} />;
    case 'listo':
      return <Deliver order={order} onDone={onDone} />;
    case 'entregado':
      return <Delivered order={order} />;
    case 'cancelado':
      return (
        <div className="action">
          <p>Orden cancelada. {order.history.at(-1)?.note}</p>
        </div>
      );
  }
};
