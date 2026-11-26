import type { OrderStatus, RepairOrder } from '@/domain/types';

export const STATUS_LABEL: Readonly<Record<OrderStatus, string>> = {
  recibido: 'Recibido',
  diagnostico: 'En diagnóstico',
  esperando_aprobacion: 'Esperando aprobación',
  en_reparacion: 'En reparación',
  listo: 'Listo para recoger',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
};

export const STATUS_TONE: Readonly<Record<OrderStatus, string>> = {
  recibido: 'neutral',
  diagnostico: 'info',
  esperando_aprobacion: 'warn',
  en_reparacion: 'info',
  listo: 'good',
  entregado: 'muted',
  cancelado: 'muted',
};

export const ACTIVE_STATUSES: readonly OrderStatus[] = [
  'recibido',
  'diagnostico',
  'esperando_aprobacion',
  'en_reparacion',
  'listo',
];

export const RECEPTION_CONDITIONS: readonly string[] = [
  'Enciende',
  'Pantalla rayada',
  'Pantalla rota',
  'Carcasa golpeada',
  'Señales de humedad',
  'Sin SIM',
  'Con forro',
  'Botones dañados',
];

export const TECHNICIANS: readonly string[] = ['Andrés', 'Kelly', 'Yesid'];

export const UNCLAIMED_AFTER_DAYS = 15;

const currency = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

const dateFormat = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short' });

const dateTimeFormat = new Intl.DateTimeFormat('es-CO', {
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit',
});

export const formatMoney = (value: number): string => currency.format(value);

export const formatDate = (iso: string): string => dateFormat.format(new Date(iso));

export const formatDateTime = (iso: string): string => dateTimeFormat.format(new Date(iso));

export const daysSince = (iso: string, now: number = Date.now()): number =>
  Math.floor((now - new Date(iso).getTime()) / 86_400_000);

export const deviceLabel = (order: RepairOrder): string =>
  `${order.device.brand} ${order.device.model}`;

export const partsTotal = (order: RepairOrder): number =>
  order.parts.reduce((sum, part) => sum + part.qty * part.unitPrice, 0);
