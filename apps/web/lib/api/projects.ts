import type { CreateProjectInput, ProjectDetail, ProjectSummary } from '../types';
import { apiFetch } from './client';

export function getProjects() {
  return apiFetch<ProjectSummary[]>('/projects');
}

export function getProject(projectId: string) {
  return apiFetch<ProjectDetail>(`/projects/${projectId}`);
}

export function createProject(body: CreateProjectInput) {
  return apiFetch<ProjectDetail>('/projects', {
    method: 'POST',
    body: JSON.stringify(body)
  });
}
