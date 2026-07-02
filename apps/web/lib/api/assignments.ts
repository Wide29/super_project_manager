import { apiFetch } from './client';
import type { TaskAssignment } from '../types';

export function getTaskAssignments(taskId: string) {
  return apiFetch<TaskAssignment[]>(`/tasks/${taskId}/assignments`);
}
