import { apiFetch } from './client';
import type { BatchAcceptance, CreateBatchAcceptanceInput } from '../types';

export function getBatchAcceptances(batchId: string) {
  return apiFetch<BatchAcceptance[]>(`/batches/${batchId}/acceptances`);
}

export function createBatchAcceptance(
  deliveryId: string,
  body: CreateBatchAcceptanceInput
) {
  return apiFetch<BatchAcceptance>(`/deliveries/${deliveryId}/acceptances`, {
    method: 'POST',
    body: JSON.stringify(body)
  });
}
