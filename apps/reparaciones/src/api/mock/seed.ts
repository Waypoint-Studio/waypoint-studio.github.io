import type { OrderStatus, Part, PartUsed, RepairOrder, StatusEvent } from '@/domain/types';

interface SeedStep {
  readonly status: OrderStatus;
  readonly hoursAgo: number;
  readonly note?: string;
}

interface SeedOrder {
  readonly code: string;
  readonly name: string;
  readonly phone: string;
  readonly brand: string;
  readonly model: string;
  readonly color: string;
  readonly issue: string;
  readonly conditions: readonly string[];
  readonly estimate: number;
  readonly deposit: number;
  readonly quote?: number;
  readonly finalPrice?: number;
  readonly parts?: readonly PartUsed[];
  readonly technician: string;
  readonly warrantyDays?: number;
  readonly reminderHoursAgo?: number;
  readonly steps: readonly SeedStep[];
}

const HOUR = 3_600_000;
const DAY = 24;

const CLOSING_HOUR = 18;
const BUSINESS_HOURS = 10;

const RECENT_HOURS = 6;

const isoHoursAgo = (now: number, hours: number): string => {
  if (hours < RECENT_HOURS) {
    return new Date(now - hours * HOUR).toISOString();
  }
  const fullDays = Math.floor(hours / DAY);
  const rest = hours - fullDays * DAY;
  const date = new Date(now - (fullDays + 1) * DAY * HOUR);
  date.setHours(0, 0, 0, 0);
  date.setTime(date.getTime() + (CLOSING_HOUR - (rest / DAY) * BUSINESS_HOURS) * HOUR);
  return date.toISOString();
};

const SEED_PARTS: readonly Part[] = [
  { id: 'p-a54-lcd', name: 'Pantalla Samsung A54', compatibleWith: 'Galaxy A54', stock: 2, minStock: 1, cost: 210_000, price: 320_000 },
  { id: 'p-a14-lcd', name: 'Pantalla Samsung A14', compatibleWith: 'Galaxy A14', stock: 1, minStock: 2, cost: 95_000, price: 160_000 },
  { id: 'p-ip12-bat', name: 'Batería iPhone 12', compatibleWith: 'iPhone 12 / 12 Pro', stock: 3, minStock: 1, cost: 85_000, price: 150_000 },
  { id: 'p-usbc-pin', name: 'Pin de carga tipo C', compatibleWith: 'Genérico', stock: 12, minStock: 5, cost: 6_000, price: 25_000 },
  { id: 'p-micro-pin', name: 'Pin de carga micro USB', compatibleWith: 'Genérico', stock: 1, minStock: 3, cost: 4_000, price: 20_000 },
  { id: 'p-ip13-back', name: 'Vidrio trasero iPhone 13', compatibleWith: 'iPhone 13', stock: 2, minStock: 1, cost: 60_000, price: 130_000 },
  { id: 'p-sam-spk', name: 'Altavoz Samsung serie A', compatibleWith: 'Galaxy A14 / A34 / A54', stock: 4, minStock: 2, cost: 18_000, price: 45_000 },
  { id: 'p-xi-flex', name: 'Flex de encendido Xiaomi', compatibleWith: 'Redmi Note 11 / 12', stock: 0, minStock: 1, cost: 12_000, price: 35_000 },
];

const SEED_ORDERS: readonly SeedOrder[] = [
  {
    code: 'RC-1046', name: 'Esteban Mercado', phone: '+57 301 555 0146', brand: 'Samsung', model: 'Galaxy A34', color: 'Negro',
    issue: 'No se escucha el altavoz en llamadas', conditions: ['Enciende', 'Con forro'], estimate: 60_000, deposit: 20_000, technician: 'Kelly',
    steps: [{ status: 'recibido', hoursAgo: 0.5 }],
  },
  {
    code: 'RC-1045', name: 'María José Charris', phone: '+57 300 555 0145', brand: 'Samsung', model: 'Galaxy A14', color: 'Plateado',
    issue: 'Pantalla rota después de una caída', conditions: ['Enciende', 'Pantalla rota'], estimate: 180_000, deposit: 50_000, quote: 160_000,
    parts: [{ partId: 'p-a14-lcd', name: 'Pantalla Samsung A14', qty: 1, unitPrice: 160_000 }], technician: 'Andrés',
    steps: [
      { status: 'recibido', hoursAgo: 5 * DAY },
      { status: 'diagnostico', hoursAgo: 5 * DAY - 2 },
      { status: 'esperando_aprobacion', hoursAgo: 5 * DAY - 4, note: 'Cambio de pantalla completa con marco.' },
      { status: 'en_reparacion', hoursAgo: 4 * DAY, note: 'Cliente aprobó por WhatsApp.' },
      { status: 'listo', hoursAgo: 3 * DAY },
    ],
  },
  {
    code: 'RC-1044', name: 'Jhon Barrios', phone: '+57 312 555 0144', brand: 'Motorola', model: 'Moto G54', color: 'Azul',
    issue: 'Se mojó y no enciende', conditions: ['Señales de humedad', 'Sin SIM'], estimate: 120_000, deposit: 30_000, technician: 'Yesid',
    steps: [{ status: 'recibido', hoursAgo: 1 }],
  },
  {
    code: 'RC-1043', name: 'Yulieth Rodríguez', phone: '+57 315 555 0143', brand: 'Xiaomi', model: 'Redmi Note 12', color: 'Verde',
    issue: 'No carga, hay que mover el cable', conditions: ['Enciende', 'Carcasa golpeada'], estimate: 50_000, deposit: 20_000, quote: 55_000, technician: 'Kelly',
    steps: [
      { status: 'recibido', hoursAgo: 2 * DAY },
      { status: 'diagnostico', hoursAgo: 2 * DAY - 3 },
      { status: 'esperando_aprobacion', hoursAgo: DAY + 20, note: 'Cambio de pin de carga tipo C y limpieza.' },
    ],
  },
  {
    code: 'RC-1042', name: 'Carlos Mendoza', phone: '+57 304 555 0142', brand: 'Apple', model: 'iPhone 12', color: 'Blanco',
    issue: 'La batería se descarga antes del mediodía', conditions: ['Enciende', 'Con forro'], estimate: 150_000, deposit: 50_000, technician: 'Andrés',
    steps: [
      { status: 'recibido', hoursAgo: DAY },
      { status: 'diagnostico', hoursAgo: 20 },
    ],
  },
  {
    code: 'RC-1041', name: 'Laura Pérez', phone: '+57 300 555 0141', brand: 'Samsung', model: 'Galaxy A54', color: 'Lila',
    issue: 'Pantalla rota y táctil no responde', conditions: ['Enciende', 'Pantalla rota'], estimate: 350_000, deposit: 100_000, quote: 320_000,
    parts: [{ partId: 'p-a54-lcd', name: 'Pantalla Samsung A54', qty: 1, unitPrice: 320_000 }], technician: 'Andrés',
    steps: [
      { status: 'recibido', hoursAgo: 2 * DAY + 5 },
      { status: 'diagnostico', hoursAgo: 2 * DAY + 3 },
      { status: 'esperando_aprobacion', hoursAgo: 2 * DAY, note: 'Pantalla original con marco.' },
      { status: 'en_reparacion', hoursAgo: DAY + 18, note: 'Cliente aprobó por WhatsApp.' },
    ],
  },
  {
    code: 'RC-1039', name: 'Valentina Sarmiento', phone: '+57 318 555 0139', brand: 'Apple', model: 'iPhone 13', color: 'Rosado',
    issue: 'Vidrio trasero quebrado', conditions: ['Enciende', 'Carcasa golpeada'], estimate: 140_000, deposit: 40_000, quote: 130_000,
    parts: [{ partId: 'p-ip13-back', name: 'Vidrio trasero iPhone 13', qty: 1, unitPrice: 130_000 }], technician: 'Yesid',
    steps: [
      { status: 'recibido', hoursAgo: 3 * DAY },
      { status: 'diagnostico', hoursAgo: 3 * DAY - 1 },
      { status: 'esperando_aprobacion', hoursAgo: 3 * DAY - 2 },
      { status: 'en_reparacion', hoursAgo: 2 * DAY + 2, note: 'Cliente aprobó por WhatsApp.' },
    ],
  },
  {
    code: 'RC-1029', name: 'Luis Fernando Orozco', phone: '+57 302 555 0129', brand: 'Tecno', model: 'Spark 10', color: 'Negro',
    issue: 'No carga', conditions: ['Enciende'], estimate: 40_000, deposit: 10_000, quote: 45_000,
    parts: [{ partId: 'p-usbc-pin', name: 'Pin de carga tipo C', qty: 1, unitPrice: 25_000 }], technician: 'Kelly',
    steps: [
      { status: 'recibido', hoursAgo: 25 * DAY },
      { status: 'diagnostico', hoursAgo: 25 * DAY - 2 },
      { status: 'esperando_aprobacion', hoursAgo: 25 * DAY - 3 },
      { status: 'en_reparacion', hoursAgo: 24 * DAY },
      { status: 'listo', hoursAgo: 22 * DAY },
    ],
  },
  {
    code: 'RC-1018', name: 'Daniela Gómez', phone: '+57 310 555 0118', brand: 'Apple', model: 'iPhone 11', color: 'Negro',
    issue: 'Face ID dejó de funcionar', conditions: ['Enciende', 'Pantalla rayada'], estimate: 200_000, deposit: 60_000, quote: 220_000, technician: 'Andrés',
    reminderHoursAgo: 10 * DAY,
    steps: [
      { status: 'recibido', hoursAgo: 42 * DAY },
      { status: 'diagnostico', hoursAgo: 41 * DAY },
      { status: 'esperando_aprobacion', hoursAgo: 40 * DAY },
      { status: 'en_reparacion', hoursAgo: 39 * DAY },
      { status: 'listo', hoursAgo: 37 * DAY },
    ],
  },
  {
    code: 'RC-1012', name: 'Ricardo Polo', phone: '+57 305 555 0112', brand: 'Oppo', model: 'A78', color: 'Gris',
    issue: 'No enciende', conditions: ['Carcasa golpeada'], estimate: 90_000, deposit: 30_000, quote: 0, technician: 'Yesid',
    steps: [
      { status: 'recibido', hoursAgo: 52 * DAY },
      { status: 'diagnostico', hoursAgo: 51 * DAY },
      { status: 'esperando_aprobacion', hoursAgo: 50 * DAY, note: 'Daño en placa, reparación de $280.000.' },
      { status: 'listo', hoursAgo: 48 * DAY, note: 'Cliente no aprobó: se devuelve sin reparar.' },
    ],
  },
  {
    code: 'RC-1040', name: 'Katherine Ospino', phone: '+57 311 555 0140', brand: 'Honor', model: 'X8', color: 'Azul',
    issue: 'Cámara trasera borrosa', conditions: ['Enciende'], estimate: 90_000, deposit: 30_000, quote: 95_000, finalPrice: 95_000, technician: 'Kelly', warrantyDays: 30,
    steps: [
      { status: 'recibido', hoursAgo: 7 * DAY },
      { status: 'diagnostico', hoursAgo: 7 * DAY - 2 },
      { status: 'esperando_aprobacion', hoursAgo: 6 * DAY },
      { status: 'en_reparacion', hoursAgo: 6 * DAY - 4 },
      { status: 'listo', hoursAgo: 5 * DAY },
      { status: 'entregado', hoursAgo: 4 * DAY },
    ],
  },
  {
    code: 'RC-1038', name: 'Jorge Ariza', phone: '+57 300 555 0138', brand: 'Samsung', model: 'Galaxy S21 FE', color: 'Oliva',
    issue: 'Líneas verdes en la pantalla', conditions: ['Enciende'], estimate: 450_000, deposit: 150_000, quote: 480_000, finalPrice: 480_000, technician: 'Andrés', warrantyDays: 60,
    steps: [
      { status: 'recibido', hoursAgo: 13 * DAY },
      { status: 'diagnostico', hoursAgo: 13 * DAY - 2 },
      { status: 'esperando_aprobacion', hoursAgo: 12 * DAY },
      { status: 'en_reparacion', hoursAgo: 11 * DAY },
      { status: 'listo', hoursAgo: 9 * DAY },
      { status: 'entregado', hoursAgo: 8 * DAY },
    ],
  },
  {
    code: 'RC-1036', name: 'Natalia De la Hoz', phone: '+57 316 555 0136', brand: 'Xiaomi', model: 'Poco X5', color: 'Amarillo',
    issue: 'Se reinicia solo', conditions: ['Enciende'], estimate: 60_000, deposit: 20_000, quote: 60_000, finalPrice: 60_000, technician: 'Yesid', warrantyDays: 15,
    steps: [
      { status: 'recibido', hoursAgo: 15 * DAY },
      { status: 'diagnostico', hoursAgo: 15 * DAY - 1 },
      { status: 'esperando_aprobacion', hoursAgo: 14 * DAY },
      { status: 'en_reparacion', hoursAgo: 14 * DAY - 3 },
      { status: 'listo', hoursAgo: 13 * DAY },
      { status: 'entregado', hoursAgo: 12 * DAY },
    ],
  },
  {
    code: 'RC-1037', name: 'Sergio Cantillo', phone: '+57 313 555 0137', brand: 'Motorola', model: 'Moto E13', color: 'Negro',
    issue: 'Pantalla rota', conditions: ['Pantalla rota'], estimate: 120_000, deposit: 0, quote: 140_000, technician: 'Kelly',
    steps: [
      { status: 'recibido', hoursAgo: 14 * DAY },
      { status: 'diagnostico', hoursAgo: 14 * DAY - 1 },
      { status: 'esperando_aprobacion', hoursAgo: 13 * DAY },
      { status: 'cancelado', hoursAgo: 12 * DAY, note: 'Cliente retiró el equipo sin reparar.' },
    ],
  },
];

const buildHistory = (steps: readonly SeedStep[], now: number): StatusEvent[] =>
  steps.map((step) => ({ status: step.status, at: isoHoursAgo(now, step.hoursAgo), note: step.note ?? '' }));

const timeOf = (steps: readonly SeedStep[], status: OrderStatus, now: number): string | null => {
  const step = steps.find((item) => item.status === status);
  return step ? isoHoursAgo(now, step.hoursAgo) : null;
};

const toOrder = (seed: SeedOrder, index: number, now: number): RepairOrder => {
  const history = buildHistory(seed.steps, now);
  const last = history.at(-1);
  const first = history[0];
  return {
    id: `o-${index + 1}`,
    code: seed.code,
    customer: { name: seed.name, phone: seed.phone },
    device: { brand: seed.brand, model: seed.model, color: seed.color },
    issue: seed.issue,
    conditions: seed.conditions,
    photos: [],
    estimate: seed.estimate,
    deposit: seed.deposit,
    quote: seed.quote ?? null,
    finalPrice: seed.finalPrice ?? null,
    parts: seed.parts ?? [],
    status: last?.status ?? 'recibido',
    history,
    technician: seed.technician,
    warrantyDays: seed.warrantyDays ?? 30,
    createdAt: first?.at ?? new Date(now).toISOString(),
    readyAt: timeOf(seed.steps, 'listo', now),
    deliveredAt: timeOf(seed.steps, 'entregado', now),
    lastReminderAt: seed.reminderHoursAgo === undefined ? null : isoHoursAgo(now, seed.reminderHoursAgo),
  };
};

export const createSeed = (now: number = Date.now()): { orders: RepairOrder[]; parts: Part[] } => ({
  orders: SEED_ORDERS.map((seed, index) => toOrder(seed, index, now)),
  parts: SEED_PARTS.map((part) => ({ ...part })),
});
