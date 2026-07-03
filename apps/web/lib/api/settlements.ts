import { apiFetch } from './client';
import type { CreateTaskSettlementInput, TaskSettlement } from '../types';

export function getTaskSettlement(taskId: string) {
  return apiFetch<TaskSettlement | null>(`/tasks/${taskId}/settlement`);
}

export function createTaskSettlement(taskId: string, body: CreateTaskSettlementInput) {
  return apiFetch<TaskSettlement>(`/tasks/${taskId}/settlement`, {
    method: 'POST',
    body: JSON.stringify(body)
  });
}
