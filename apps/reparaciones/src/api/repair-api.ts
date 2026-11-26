import type {
  ActionResult,
  DashboardSummary,
  NewOrderInput,
  OrderFilter,
  Part,
  PublicTracking,
  RepairOrder,
  WhatsAppMessage,
} from '@/domain/types';

export interface RepairApi {
  getSummary(): Promise<DashboardSummary>;
  listOrders(filter?: OrderFilter): Promise<readonly RepairOrder[]>;
  getOrder(id: string): Promise<RepairOrder>;
  createOrder(input: NewOrderInput): Promise<ActionResult>;
  startDiagnosis(id: string): Promise<ActionResult>;
  sendQuote(id: string, amount: number, note: string): Promise<ActionResult>;
  answerQuote(id: string, approved: boolean): Promise<ActionResult>;
  addPart(id: string, partId: string, qty: number): Promise<ActionResult>;
  markReady(id: string): Promise<ActionResult>;
  sendReminder(id: string): Promise<ActionResult>;
  deliver(id: string, finalPrice: number, warrantyDays: number): Promise<ActionResult>;
  listParts(): Promise<readonly Part[]>;
  listMessages(orderId?: string): Promise<readonly WhatsAppMessage[]>;
  track(code: string): Promise<PublicTracking>;
  reset(): Promise<void>;
}

export class ApiError extends Error {
  readonly #status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.#status = status;
  }

  get status(): number {
    return this.#status;
  }
}
