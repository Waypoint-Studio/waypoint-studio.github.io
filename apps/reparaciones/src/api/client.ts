import { MockBackend } from '@/api/mock/mock-backend';
import type { RepairApi } from '@/api/repair-api';

export const api: RepairApi = new MockBackend();
