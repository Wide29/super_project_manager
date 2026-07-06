import { AppShell } from '../../components/layout/app-shell';
import { getWorkflowDeliveriesAndAcceptances } from '../../lib/api/acceptances';
import { getTasksForBatches } from '../../lib/api/tasks';
import {
  AlgorithmAcceptanceRecord,
  AlgorithmDeliveryRecord,
  AlgorithmWorkbench
} from '../../components/workbench/algorithm-workbench';

export const dynamic = 'force-dynamic';

export default async function AlgorithmPage() {
  const records = await getWorkflowDeliveriesAndAcceptances();
  const workflowTasks = await getTasksForBatches(
    Array.from(new Set(records.map((record) => record.batch.id)))
  );

  const pendingDeliveries: AlgorithmDeliveryRecord[] = records
    .filter((record) => record.delivery.status === 'submitted' && !record.acceptance)
    .sort((left, right) => right.delivery.submittedAt.localeCompare(left.delivery.submittedAt))
    .map((record) => ({
      projectName: record.project.name,
      batchId: record.batch.id,
      batchName: record.batch.name,
      delivery: record.delivery,
      tasks: workflowTasks
        .filter((entry) => entry.batchId === record.batch.id)
        .map((entry) => entry.task)
    }));

  const recentAcceptances: AlgorithmAcceptanceRecord[] = records
    .filter((record): record is typeof record & { acceptance: NonNullable<typeof record.acceptance> } => Boolean(record.acceptance))
    .sort((left, right) =>
      right.acceptance.reviewedAt.localeCompare(left.acceptance.reviewedAt)
    )
    .map((record) => ({
      projectName: record.project.name,
      batchId: record.batch.id,
      batchName: record.batch.name,
      acceptance: record.acceptance
    }));

  return (
    <AppShell title="算法验收台" description="查看待验收交付、抽检入口与最近的验收结论。">
      <AlgorithmWorkbench
        pendingDeliveries={pendingDeliveries}
        recentAcceptances={recentAcceptances}
      />
    </AppShell>
  );
}
