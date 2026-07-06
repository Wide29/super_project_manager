import { apiFetch } from './client';
import type {
  BatchAcceptance,
  BatchDelivery,
  BatchSummary,
  CreateBatchAcceptanceInput,
  ProjectSummary
} from '../types';
import { getAllWorkflowBatches } from './batches';
import { getBatchDeliveries } from './deliveries';

export interface WorkflowDeliveryRecord {
  project: ProjectSummary;
  batch: BatchSummary;
  delivery: BatchDelivery;
  acceptance: BatchAcceptance | null;
}

export function getBatchAcceptances(batchId: string) {
  return apiFetch<BatchAcceptance[]>(`/batches/${batchId}/acceptances`);
}

export function createBatchAcceptance(
  deliveryId: string,
  body: CreateBatchAcceptanceInput
) {
  return apiFetch<BatchAcceptance>(`/deliveries/${deliveryId}/acceptances`, {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

export async function getWorkflowDeliveriesAndAcceptances(): Promise<WorkflowDeliveryRecord[]> {
  const workflowBatches = await getAllWorkflowBatches();
  const batchResults = await Promise.all(
    workflowBatches.map(async ({ project, batch }) => {
      const [deliveries, acceptances] = await Promise.all([
        getBatchDeliveries(batch.id),
        getBatchAcceptances(batch.id)
      ]);

      return {
        project,
        batch,
        deliveries,
        acceptances
      };
    })
  );

  return batchResults.flatMap(({ project, batch, deliveries, acceptances }) =>
    deliveries.map((delivery) => ({
      project,
      batch,
      delivery,
      acceptance: acceptances.find((acceptance) => acceptance.deliveryId === delivery.id) ?? null
    }))
  );
}
