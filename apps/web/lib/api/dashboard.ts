import { apiFetch } from './client';
import type { DashboardOverview } from '../types';

export function getDashboardOverview() {
  return apiFetch<DashboardOverview>('/dashboard/overview');
}
