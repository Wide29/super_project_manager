import { BatchList } from '../../../components/batches/batch-list';
import { AppShell } from '../../../components/layout/app-shell';
import { getBatch } from '../../../lib/api/batches';
import { getBatchTasks } from '../../../lib/api/tasks';

export const dynamic = 'force-dynamic';

export default async function BatchDetailPage({
  params
}: {
  params: Promise<{ batchId: string }>;
}) {
  const { batchId } = await params;
  const [batch, tasks] = await Promise.all([getBatch(batchId), getBatchTasks(batchId)]);

  return (
    <AppShell title="批次详情" description="查看批次题量、提交进度与任务列表。">
      <BatchList batch={batch} tasks={tasks} />
    </AppShell>
  );
}
