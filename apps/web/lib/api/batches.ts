import type { BatchDetail, BatchSummary } from '../types';
import { apiFetch } from './client';

export function getProjectBatches(projectId: string) {
  return apiFetch<BatchSummary[]>(`/projects/${projectId}/batches`);
}

export function getBatch(batchId: string) {
  return apiFetch<BatchDetail>(`/batches/${batchId}`);
}
