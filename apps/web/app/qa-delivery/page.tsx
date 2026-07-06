import Link from 'next/link';
import { AppShell } from '../../components/layout/app-shell';
import { ActionCard } from '../../components/ui/action-card';
import { getAllWorkflowBatches } from '../../lib/api/batches';
import { getTasksForBatches } from '../../lib/api/tasks';

export const dynamic = 'force-dynamic';

export default async function QaDeliveryPage() {
  const workflowBatches = await getAllWorkflowBatches();
  const workflowTasks = await getTasksForBatches(workflowBatches.map(({ batch }) => batch.id));
  const batchContext = new Map(
    workflowBatches.map((entry) => [entry.batch.id, entry] as const)
  );

  const pendingQaTasks = workflowTasks
    .filter(({ task }) => task.status === 'submitted')
    .map((entry) => ({
      ...entry,
      context: batchContext.get(entry.batchId)
    }))
    .filter((entry) => entry.context);

  const reworkTasks = workflowTasks
    .filter(({ task }) => ['qa_rejected', 'sampling_rejected'].includes(task.status))
    .map((entry) => ({
      ...entry,
      context: batchContext.get(entry.batchId)
    }))
    .filter((entry) => entry.context);

  const deliverableBatches = workflowBatches.filter(({ batch }) => {
    const batchTasks = workflowTasks
      .filter((entry) => entry.batchId === batch.id)
      .map((entry) => entry.task);

    const hasDeliverableTasks = batchTasks.some((task) =>
      ['qa_passed', 'sampling_passed'].includes(task.status)
    );
    const hasPendingQa = batchTasks.some((task) => task.status === 'submitted');

    return hasDeliverableTasks && !hasPendingQa && batch.status !== 'delivered';
  });

  return (
    <AppShell
      title="质检交付台"
      description="集中处理待质检题目、返修题目与可发起交付的批次。"
      rightSlot={
        <div className="space-y-6">
          <ActionCard title="今日视图" description="快速查看当前角色待办量。">
            <div className="space-y-3 text-sm text-slate-500">
              <p>待质检题目：{pendingQaTasks.length}</p>
              <p>返修题目：{reworkTasks.length}</p>
              <p>可交付批次：{deliverableBatches.length}</p>
            </div>
          </ActionCard>
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <ActionCard title="待质检题目" description="标注员已提交，等待质检/交付人员审核。">
          <div className="space-y-3">
            {pendingQaTasks.length === 0 ? (
              <p className="text-sm text-slate-500">当前没有待质检题目。</p>
            ) : (
              pendingQaTasks.map(({ task, context }) => (
                <Link
                  key={task.id}
                  href={`/tasks/${task.id}`}
                  className="block rounded-2xl bg-cloud px-4 py-4 transition hover:bg-skySoft"
                >
                  <p className="font-medium text-slateDeep">{task.title}</p>
                  <p className="mt-2 text-sm text-slate-500">
                    {context?.project.name} / {context?.batch.name}
                  </p>
                </Link>
              ))
            )}
          </div>
        </ActionCard>

        <ActionCard title="返修题目" description="聚合质检打回与抽检打回的题目。">
          <div className="space-y-3">
            {reworkTasks.length === 0 ? (
              <p className="text-sm text-slate-500">当前没有返修题目。</p>
            ) : (
              reworkTasks.map(({ task, context }) => (
                <Link
                  key={task.id}
                  href={`/tasks/${task.id}`}
                  className="block rounded-2xl bg-cloud px-4 py-4 transition hover:bg-skySoft"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-slateDeep">{task.title}</p>
                    <span className="rounded-full bg-white px-3 py-1 text-xs text-skyStrong">
                      {task.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">
                    {context?.project.name} / {context?.batch.name}
                  </p>
                </Link>
              ))
            )}
          </div>
        </ActionCard>

        <ActionCard title="可交付批次" description="题目质检通过后，可进入批次页发起交付。">
          <div className="space-y-3">
            {deliverableBatches.length === 0 ? (
              <p className="text-sm text-slate-500">当前没有可交付批次。</p>
            ) : (
              deliverableBatches.map(({ project, batch }) => (
                <Link
                  key={batch.id}
                  href={`/batches/${batch.id}`}
                  className="block rounded-2xl bg-cloud px-4 py-4 transition hover:bg-skySoft"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-slateDeep">{batch.name}</p>
                    <span className="rounded-full bg-white px-3 py-1 text-xs text-skyStrong">
                      {batch.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">{project.name}</p>
                </Link>
              ))
            )}
          </div>
        </ActionCard>
      </div>
    </AppShell>
  );
}
