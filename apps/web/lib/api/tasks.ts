import { apiFetch } from './client';
import type {
  CreateTaskInput,
  ImportTasksInput,
  ImportTasksResponse,
  TaskDetail,
  TaskSummary
} from '../types';

export interface WorkflowTaskRecord {
  batchId: string;
  task: TaskSummary;
}

export function getBatchTasks(batchId: string) {
  return apiFetch<TaskSummary[]>(`/batches/${batchId}/tasks`);
}

export function getTask(taskId: string) {
  return apiFetch<TaskDetail>(`/tasks/${taskId}`);
}

export function getNextTask(assigneeId: string) {
  return apiFetch<TaskDetail | null>(
    `/tasks/queue/next?assigneeId=${encodeURIComponent(assigneeId)}`
  );
}

export function submitTask(input: {
  taskId: string;
  assigneeId: string;
  outputPayload: Record<string, unknown>;
  notes?: string;
}) {
  return apiFetch<TaskDetail>(`/tasks/${input.taskId}/submit`, {
    method: 'POST',
    body: JSON.stringify({
      assigneeId: input.assigneeId,
      outputPayload: input.outputPayload,
      notes: input.notes
    })
  });
}

export function createTask(batchId: string, body: CreateTaskInput) {
  return apiFetch<TaskDetail>(`/batches/${batchId}/tasks`, {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

export function importTasks(batchId: string, body: ImportTasksInput) {
  return apiFetch<ImportTasksResponse>(`/batches/${batchId}/tasks/import`, {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

export async function getTasksForBatches(batchIds: string[]): Promise<WorkflowTaskRecord[]> {
  const taskGroups = await Promise.all(
    batchIds.map(async (batchId) => ({
      batchId,
      tasks: await getBatchTasks(batchId)
    }))
  );

  return taskGroups.flatMap(({ batchId, tasks }) =>
    tasks.map((task) => ({
      batchId,
      task
    }))
  );
}
