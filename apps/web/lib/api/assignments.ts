import { apiFetch } from './client';
import type { CreateAssignmentInput, TaskAssignment } from '../types';

export function getTaskAssignments(taskId: string) {
  return apiFetch<TaskAssignment[]>(`/tasks/${taskId}/assignments`);
}

export function createAssignment(taskId: string, body: CreateAssignmentInput) {
  return apiFetch<TaskAssignment>(`/tasks/${taskId}/assignments`, {
    method: 'POST',
    body: JSON.stringify(body)
  });
}
