import { ApiError, type RepairApi } from '@/api/repair-api';
import {
  SHOP_NAME,
  SHOP_PHONE,
  approvedText,
  deliveredText,
  diagnosisText,
  quoteText,
  readyText,
  receivedText,
  rejectedText,
  reminderText,
} from '@/api/mock/messages';
import { createSeed } from '@/api/mock/seed';
import { ACTIVE_STATUSES, UNCLAIMED_AFTER_DAYS, daysSince, deviceLabel } from '@/domain/labels';
import {
  ORDER_STATUSES,
  type ActionResult,
  type DashboardSummary,
  type NewOrderInput,
  type OrderFilter,
  type OrderStatus,
  type Part,
  type PublicTracking,
  type RepairOrder,
  type WhatsAppMessage,
} from '@/domain/types';

interface Snapshot {
  readonly orders: RepairOrder[];
  readonly parts: Part[];
  readonly messages: WhatsAppMessage[];
}

const STORAGE_KEY = 'reparo-demo-v1';

const normalize = (value: string): string =>
  value.normalize('NFD').replaceAll(/\p{Diacritic}/gu, '').toLowerCase();

const balanceOf = (order: RepairOrder): number =>
  Math.max(0, (order.quote ?? order.estimate) - order.deposit);

export class MockBackend implements RepairApi {
  #orders: RepairOrder[] = [];
  #parts: Part[] = [];
  #messages: WhatsAppMessage[] = [];
  readonly #minLatency: number;
  readonly #maxLatency: number;

  constructor(minLatency = 180, maxLatency = 520) {
    this.#minLatency = minLatency;
    this.#maxLatency = maxLatency;
    this.#load();
  }

  async getSummary(): Promise<DashboardSummary> {
    await this.#delay();
    const now = Date.now();
    const monthStart = new Date(new Date(now).getFullYear(), new Date(now).getMonth(), 1).getTime();
    const byStatus = Object.fromEntries(
      ORDER_STATUSES.map((status) => [status, this.#orders.filter((order) => order.status === status).length]),
    ) as Record<OrderStatus, number>;
    const delivered = this.#orders.filter((order) => order.deliveredAt !== null);
    const deliveredThisMonth = delivered.filter((order) => new Date(order.deliveredAt ?? 0).getTime() >= monthStart);
    const repairDays = delivered
      .filter((order) => order.readyAt !== null)
      .map((order) => (new Date(order.readyAt ?? 0).getTime() - new Date(order.createdAt).getTime()) / 86_400_000);
    return {
      byStatus,
      unclaimed: this.#orders
        .filter((order) => order.status === 'listo' && daysSince(order.readyAt ?? order.createdAt, now) >= UNCLAIMED_AFTER_DAYS)
        .sort((a, b) => (a.readyAt ?? '').localeCompare(b.readyAt ?? '')),
      lowStock: this.#parts.filter((part) => part.stock <= part.minStock),
      deliveredThisMonth: deliveredThisMonth.length,
      revenueThisMonth: deliveredThisMonth.reduce((sum, order) => sum + (order.finalPrice ?? 0), 0),
      avgRepairDays: repairDays.length === 0 ? 0 : repairDays.reduce((a, b) => a + b, 0) / repairDays.length,
      messagesThisWeek: this.#messages.filter((message) => daysSince(message.at, now) < 7).length,
    };
  }

  async listOrders(filter: OrderFilter = {}): Promise<readonly RepairOrder[]> {
    await this.#delay();
    const term = normalize(filter.search?.trim() ?? '');
    return this.#orders
      .filter((order) => this.#matchesStatus(order, filter.status))
      .filter((order) => term === '' || this.#matchesTerm(order, term))
      .sort((a, b) => this.#lastActivity(b).localeCompare(this.#lastActivity(a)));
  }

  async getOrder(id: string): Promise<RepairOrder> {
    await this.#delay();
    return this.#find(id);
  }

  async createOrder(input: NewOrderInput): Promise<ActionResult> {
    await this.#delay();
    if (input.customer.name.trim() === '' || input.customer.phone.trim() === '') {
      throw new ApiError('El nombre y el WhatsApp del cliente son obligatorios.', 422);
    }
    const now = new Date().toISOString();
    const order: RepairOrder = {
      id: `o-${crypto.randomUUID()}`,
      code: this.#nextCode(),
      customer: { name: input.customer.name.trim(), phone: input.customer.phone.trim() },
      device: input.device,
      issue: input.issue.trim(),
      conditions: input.conditions,
      photos: input.photos,
      estimate: input.estimate,
      deposit: input.deposit,
      quote: null,
      finalPrice: null,
      parts: [],
      status: 'recibido',
      history: [{ status: 'recibido', at: now, note: '' }],
      technician: input.technician,
      warrantyDays: 30,
      createdAt: now,
      readyAt: null,
      deliveredAt: null,
      lastReminderAt: null,
    };
    this.#orders.unshift(order);
    return this.#commit(order, receivedText(order));
  }

  async startDiagnosis(id: string): Promise<ActionResult> {
    await this.#delay();
    const order = this.#transition(this.#find(id), ['recibido'], 'diagnostico', '');
    return this.#commit(order, diagnosisText(order));
  }

  async sendQuote(id: string, amount: number, note: string): Promise<ActionResult> {
    await this.#delay();
    if (amount <= 0) {
      throw new ApiError('El presupuesto debe ser mayor a cero.', 422);
    }
    const order = this.#transition(
      { ...this.#find(id), quote: amount },
      ['diagnostico'],
      'esperando_aprobacion',
      note.trim(),
    );
    return this.#commit(order, quoteText(order, amount, note.trim()));
  }

  async answerQuote(id: string, approved: boolean): Promise<ActionResult> {
    await this.#delay();
    const current = this.#find(id);
    if (approved) {
      const order = this.#transition(current, ['esperando_aprobacion'], 'en_reparacion', 'Cliente aprobó el presupuesto.');
      return this.#commit(order, approvedText(order));
    }
    const order = this.#transition(
      { ...current, quote: 0, readyAt: new Date().toISOString() },
      ['esperando_aprobacion'],
      'listo',
      'Cliente no aprobó: se devuelve sin reparar.',
    );
    return this.#commit(order, rejectedText(order));
  }

  async addPart(id: string, partId: string, qty: number): Promise<ActionResult> {
    await this.#delay();
    const order = this.#find(id);
    if (order.status !== 'en_reparacion') {
      throw new ApiError('Solo se agregan repuestos a órdenes en reparación.', 409);
    }
    const part = this.#parts.find((item) => item.id === partId);
    if (part === undefined) {
      throw new ApiError('Repuesto no encontrado.', 404);
    }
    if (part.stock < qty) {
      throw new ApiError(`Solo quedan ${part.stock} unidades de ${part.name}.`, 409);
    }
    this.#parts = this.#parts.map((item) => (item.id === partId ? { ...item, stock: item.stock - qty } : item));
    const updated: RepairOrder = {
      ...order,
      parts: [...order.parts, { partId, name: part.name, qty, unitPrice: part.price }],
    };
    return this.#commit(updated, null);
  }

  async markReady(id: string): Promise<ActionResult> {
    await this.#delay();
    const order = this.#transition(
      { ...this.#find(id), readyAt: new Date().toISOString() },
      ['en_reparacion'],
      'listo',
      '',
    );
    return this.#commit(order, readyText(order, balanceOf(order)));
  }

  async sendReminder(id: string): Promise<ActionResult> {
    await this.#delay();
    const current = this.#find(id);
    if (current.status !== 'listo') {
      throw new ApiError('Solo se recuerdan equipos listos para recoger.', 409);
    }
    const order: RepairOrder = { ...current, lastReminderAt: new Date().toISOString() };
    return this.#commit(order, reminderText(order, daysSince(order.readyAt ?? order.createdAt)));
  }

  async deliver(id: string, finalPrice: number, warrantyDays: number): Promise<ActionResult> {
    await this.#delay();
    const order = this.#transition(
      { ...this.#find(id), finalPrice, warrantyDays, deliveredAt: new Date().toISOString() },
      ['listo'],
      'entregado',
      '',
    );
    return this.#commit(order, deliveredText(order, warrantyDays));
  }

  async listParts(): Promise<readonly Part[]> {
    await this.#delay();
    return [...this.#parts].sort((a, b) => a.stock - a.minStock - (b.stock - b.minStock));
  }

  async listMessages(orderId?: string): Promise<readonly WhatsAppMessage[]> {
    await this.#delay();
    return this.#messages
      .filter((message) => orderId === undefined || message.orderId === orderId)
      .sort((a, b) => b.at.localeCompare(a.at));
  }

  async track(code: string): Promise<PublicTracking> {
    await this.#delay();
    const order = this.#orders.find((item) => item.code.toLowerCase() === code.trim().toLowerCase());
    if (order === undefined) {
      throw new ApiError('No encontramos una orden con ese código.', 404);
    }
    const warrantyUntil =
      order.deliveredAt === null
        ? null
        : new Date(new Date(order.deliveredAt).getTime() + order.warrantyDays * 86_400_000).toISOString();
    return {
      code: order.code,
      shopName: SHOP_NAME,
      shopPhone: SHOP_PHONE,
      deviceLabel: deviceLabel(order),
      status: order.status,
      history: order.history,
      quote: order.quote,
      balance: order.status === 'entregado' ? null : balanceOf(order),
      warrantyUntil,
    };
  }

  async reset(): Promise<void> {
    await this.#delay();
    this.#seed();
    this.#persist();
  }

  #matchesStatus(order: RepairOrder, status: OrderFilter['status']): boolean {
    if (status === undefined) {
      return true;
    }
    if (status === 'activos') {
      return ACTIVE_STATUSES.includes(order.status);
    }
    return order.status === status;
  }

  #matchesTerm(order: RepairOrder, term: string): boolean {
    const haystack = normalize(
      [order.code, order.customer.name, order.customer.phone, order.device.brand, order.device.model, order.issue].join(' '),
    );
    return haystack.includes(term);
  }

  #lastActivity(order: RepairOrder): string {
    return order.history.at(-1)?.at ?? order.createdAt;
  }

  #find(id: string): RepairOrder {
    const order = this.#orders.find((item) => item.id === id);
    if (order === undefined) {
      throw new ApiError('Orden no encontrada.', 404);
    }
    return order;
  }

  #transition(order: RepairOrder, from: readonly OrderStatus[], to: OrderStatus, note: string): RepairOrder {
    if (!from.includes(order.status)) {
      throw new ApiError('La orden cambió de estado. Recarga e intenta de nuevo.', 409);
    }
    return {
      ...order,
      status: to,
      history: [...order.history, { status: to, at: new Date().toISOString(), note }],
    };
  }

  #commit(order: RepairOrder, text: string | null): ActionResult {
    this.#orders = this.#orders.map((item) => (item.id === order.id ? order : item));
    const message = text === null ? null : this.#record(order, text);
    this.#persist();
    return { order, message };
  }

  #record(order: RepairOrder, text: string, at: string = new Date().toISOString()): WhatsAppMessage {
    const message: WhatsAppMessage = {
      id: `m-${crypto.randomUUID()}`,
      orderId: order.id,
      orderCode: order.code,
      to: order.customer.phone,
      customerName: order.customer.name,
      text,
      at,
    };
    this.#messages.unshift(message);
    return message;
  }

  #nextCode(): string {
    const highest = this.#orders.reduce((max, order) => Math.max(max, Number(order.code.replace('RC-', '')) || 0), 1000);
    return `RC-${highest + 1}`;
  }

  #seed(): void {
    const { orders, parts } = createSeed();
    this.#orders = orders;
    this.#parts = parts;
    this.#messages = [];
    for (const order of orders) {
      this.#seedMessages(order);
    }
  }

  #seedMessages(order: RepairOrder): void {
    for (const event of order.history) {
      const text = this.#seedText(order, event.status);
      if (text !== null) {
        this.#record(order, text, event.at);
      }
    }
    if (order.lastReminderAt !== null) {
      this.#record(order, reminderText(order, daysSince(order.readyAt ?? order.createdAt, new Date(order.lastReminderAt).getTime())), order.lastReminderAt);
    }
  }

  #seedText(order: RepairOrder, status: OrderStatus): string | null {
    const texts: Partial<Record<OrderStatus, () => string>> = {
      recibido: () => receivedText(order),
      esperando_aprobacion: () => quoteText(order, order.quote ?? order.estimate, ''),
      listo: () => readyText(order, balanceOf(order)),
      entregado: () => deliveredText(order, order.warrantyDays),
    };
    return texts[status]?.() ?? null;
  }

  #load(): void {
    try {
      const raw = globalThis.localStorage.getItem(STORAGE_KEY);
      if (raw !== null) {
        const snapshot = JSON.parse(raw) as Snapshot;
        this.#orders = snapshot.orders;
        this.#parts = snapshot.parts;
        this.#messages = snapshot.messages;
        return;
      }
    } catch {
      this.#orders = [];
    }
    this.#seed();
    this.#persist();
  }

  #persist(): void {
    try {
      const snapshot: Snapshot = { orders: this.#orders, parts: this.#parts, messages: this.#messages };
      globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    } catch {
      this.#messages = [...this.#messages];
    }
  }

  async #delay(): Promise<void> {
    const ms = this.#minLatency + Math.random() * (this.#maxLatency - this.#minLatency);
    await new Promise((resolve) => setTimeout(resolve, ms));
  }
}
