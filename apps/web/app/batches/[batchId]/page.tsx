import { BatchOperationsPanel } from '../../../components/batches/batch-operations-panel';
import { BatchList } from '../../../components/batches/batch-list';
import { AppShell } from '../../../components/layout/app-shell';
import { getBatchAcceptances } from '../../../lib/api/acceptances';
import { getBatch } from '../../../lib/api/batches';
import { getBatchDeliveries } from '../../../lib/api/deliveries';
import { getBatchTasks } from '../../../lib/api/tasks';

export const dynamic = 'force-dynamic';

export default async function BatchDetailPage({
  params
}: {
  params: Promise<{ batchId: string }>;
}) {
  const { batchId } = await params;
  const [batch, tasks, deliveries, acceptances] = await Promise.all([
    getBatch(batchId),
    getBatchTasks(batchId),
    getBatchDeliveries(batchId),
    getBatchAcceptances(batchId)
  ]);

  return (
    <AppShell
      title="批次详情"
      description="查看批次题量、提交进度与任务列表。"
      rightSlot={
        <BatchOperationsPanel
          batchId={batch.id}
          tasks={tasks}
          initialDeliveries={deliveries}
          initialAcceptances={acceptances}
        />
      }
    >
      <BatchList batch={batch} tasks={tasks} />
    </AppShell>
  );
}
