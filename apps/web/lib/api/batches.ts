import type { BatchDetail, BatchSummary, CreateBatchInput, ProjectSummary } from '../types';
import { apiFetch } from './client';
import { getProjects } from './projects';

export interface WorkflowBatchRecord {
  project: ProjectSummary;
  batch: BatchSummary;
}

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

export async function getAllWorkflowBatches(): Promise<WorkflowBatchRecord[]> {
  const projects = await getProjects();
  const projectBatches = await Promise.all(
    projects.map(async (project) => ({
      project,
      batches: await getProjectBatches(project.id)
    }))
  );

  return projectBatches.flatMap(({ project, batches }) =>
    batches.map((batch) => ({
      project,
      batch
    }))
  );
}
