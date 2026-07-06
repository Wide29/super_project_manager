import { apiFetch } from './client';
import type { AiChatResponse, TaskSuggestionResponse } from '../types';

export function chatWithAssistant(message: string, context?: string) {
  return apiFetch<AiChatResponse>('/ai/chat', {
    method: 'POST',
    body: JSON.stringify({ message, context })
  });
}

export function getDeliverySuggestion(message: string, context: string) {
  return chatWithAssistant(message, context);
}

export function getTaskSuggestion(taskId: string, prompt?: string) {
  return apiFetch<TaskSuggestionResponse>('/ai/task-suggestion', {
    method: 'POST',
    body: JSON.stringify({ taskId, prompt })
  });
}
