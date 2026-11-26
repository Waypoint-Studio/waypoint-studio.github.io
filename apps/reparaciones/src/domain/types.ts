export const ORDER_STATUSES = [
  'recibido',
  'diagnostico',
  'esperando_aprobacion',
  'en_reparacion',
  'listo',
  'entregado',
  'cancelado',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export interface Customer {
  readonly name: string;
  readonly phone: string;
}

export interface Device {
  readonly brand: string;
  readonly model: string;
  readonly color: string;
}

export interface StatusEvent {
  readonly status: OrderStatus;
  readonly at: string;
  readonly note: string;
}

export interface PartUsed {
  readonly partId: string;
  readonly name: string;
  readonly qty: number;
  readonly unitPrice: number;
}

export interface RepairOrder {
  readonly id: string;
  readonly code: string;
  readonly customer: Customer;
  readonly device: Device;
  readonly issue: string;
  readonly conditions: readonly string[];
  readonly photos: readonly string[];
  readonly estimate: number;
  readonly deposit: number;
  readonly quote: number | null;
  readonly finalPrice: number | null;
  readonly parts: readonly PartUsed[];
  readonly status: OrderStatus;
  readonly history: readonly StatusEvent[];
  readonly technician: string;
  readonly warrantyDays: number;
  readonly createdAt: string;
  readonly readyAt: string | null;
  readonly deliveredAt: string | null;
  readonly lastReminderAt: string | null;
}

export interface Part {
  readonly id: string;
  readonly name: string;
  readonly compatibleWith: string;
  readonly stock: number;
  readonly minStock: number;
  readonly cost: number;
  readonly price: number;
}

export interface WhatsAppMessage {
  readonly id: string;
  readonly orderId: string;
  readonly orderCode: string;
  readonly to: string;
  readonly customerName: string;
  readonly text: string;
  readonly at: string;
}

export interface DashboardSummary {
  readonly byStatus: Readonly<Record<OrderStatus, number>>;
  readonly unclaimed: readonly RepairOrder[];
  readonly lowStock: readonly Part[];
  readonly deliveredThisMonth: number;
  readonly revenueThisMonth: number;
  readonly avgRepairDays: number;
  readonly messagesThisWeek: number;
}

export interface NewOrderInput {
  readonly customer: Customer;
  readonly device: Device;
  readonly issue: string;
  readonly conditions: readonly string[];
  readonly photos: readonly string[];
  readonly estimate: number;
  readonly deposit: number;
  readonly technician: string;
}

export interface OrderFilter {
  readonly status?: OrderStatus | 'activos';
  readonly search?: string;
}

export interface PublicTracking {
  readonly code: string;
  readonly shopName: string;
  readonly shopPhone: string;
  readonly deviceLabel: string;
  readonly status: OrderStatus;
  readonly history: readonly StatusEvent[];
  readonly quote: number | null;
  readonly balance: number | null;
  readonly warrantyUntil: string | null;
}

export interface ActionResult {
  readonly order: RepairOrder;
  readonly message: WhatsAppMessage | null;
}
