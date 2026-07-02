import type { BatchDetail, BatchSummary, CreateBatchInput } from '../types';
import { apiFetch } from './client';

export function getProjectBatches(projectId: string) {
  return apiFetch<BatchSummary[]>(`/projects/${projectId}/batches`);
}

export function getBatch(batchId: string) {
  return apiFetch<BatchDetail>(`/batches/${batchId}`);
}

export function createBatch(projectId: string, body: CreateBatchInput) {
  return apiFetch<BatchDetail>(`/projects/${projectId}/batches`, {
    method: 'POST',
    body: JSON.stringify(body)
  });
}
