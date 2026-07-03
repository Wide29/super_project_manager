import { apiFetch } from './client';
import type { BatchDelivery, CreateBatchDeliveryInput } from '../types';

export function getBatchDeliveries(batchId: string) {
  return apiFetch<BatchDelivery[]>(`/batches/${batchId}/deliveries`);
}

export function createBatchDelivery(batchId: string, body: CreateBatchDeliveryInput) {
  return apiFetch<BatchDelivery>(`/batches/${batchId}/deliveries`, {
    method: 'POST',
    body: JSON.stringify(body)
  });
}
