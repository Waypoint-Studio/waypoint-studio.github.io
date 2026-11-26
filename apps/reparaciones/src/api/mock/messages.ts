import { formatMoney, deviceLabel } from '@/domain/labels';
import type { RepairOrder } from '@/domain/types';

export const SHOP_NAME = 'TecniCel La 72';
export const SHOP_PHONE = '+57 300 000 0072';

const trackingUrl = (order: RepairOrder): string =>
  `${globalThis.location.origin}${globalThis.location.pathname}#/seguimiento/${order.code}`;

const firstName = (order: RepairOrder): string => order.customer.name.split(' ')[0] ?? '';

export const receivedText = (order: RepairOrder): string =>
  `Hola ${firstName(order)}, recibimos tu ${deviceLabel(order)} en ${SHOP_NAME}. ` +
  `Tu orden es ${order.code}. Abono: ${formatMoney(order.deposit)}. ` +
  `Sigue el estado aquí: ${trackingUrl(order)}`;

export const diagnosisText = (order: RepairOrder): string =>
  `Hola ${firstName(order)}, tu ${deviceLabel(order)} ya está en diagnóstico. Te avisamos apenas tengamos el presupuesto.`;

export const quoteText = (order: RepairOrder, amount: number, note: string): string =>
  `Hola ${firstName(order)}, el presupuesto para tu ${deviceLabel(order)} es ${formatMoney(amount)}. ` +
  `${note} Responde SÍ para aprobar o NO para retirarlo sin reparar.`;

export const approvedText = (order: RepairOrder): string =>
  `Listo ${firstName(order)}, empezamos la reparación de tu ${deviceLabel(order)}.`;

export const rejectedText = (order: RepairOrder): string =>
  `Entendido ${firstName(order)}. Tu ${deviceLabel(order)} queda listo para retirar sin reparar.`;

export const readyText = (order: RepairOrder, balance: number): string =>
  `¡Buenas noticias ${firstName(order)}! Tu ${deviceLabel(order)} está listo para recoger en ${SHOP_NAME}. ` +
  `Saldo pendiente: ${formatMoney(balance)}.`;

export const reminderText = (order: RepairOrder, days: number): string =>
  `Hola ${firstName(order)}, te recordamos que tu ${deviceLabel(order)} lleva ${days} días listo para recoger en ${SHOP_NAME}. ` +
  'Te esperamos de lunes a sábado de 8:00 a. m. a 7:00 p. m.';

export const deliveredText = (order: RepairOrder, warrantyDays: number): string =>
  `Gracias ${firstName(order)}. Entregamos tu ${deviceLabel(order)} con ${warrantyDays} días de garantía sobre la reparación. ` +
  `Consulta tu garantía aquí: ${trackingUrl(order)}`;
