import { apiFetch } from './client';
import type { CreateTaskReviewInput, TaskReview } from '../types';

export function getTaskReviews(taskId: string) {
  return apiFetch<TaskReview[]>(`/tasks/${taskId}/reviews`);
}

export function createTaskReview(taskId: string, body: CreateTaskReviewInput) {
  return apiFetch<TaskReview>(`/tasks/${taskId}/reviews`, {
    method: 'POST',
    body: JSON.stringify(body)
  });
}
