import { AppShell } from '../../components/layout/app-shell';
import {
  DeliverableBatchRecord,
  QaDeliveryWorkbench,
  QaTaskRecord
} from '../../components/workbench/qa-delivery-workbench';
import { getAllWorkflowBatches } from '../../lib/api/batches';
import { getTasksForBatches } from '../../lib/api/tasks';

export const dynamic = 'force-dynamic';

export default async function QaDeliveryPage() {
  const workflowBatches = await getAllWorkflowBatches();
  const workflowTasks = await getTasksForBatches(workflowBatches.map(({ batch }) => batch.id));
  const batchContext = new Map(
    workflowBatches.map((entry) => [entry.batch.id, entry] as const)
  );

  const pendingQaTasks: QaTaskRecord[] = workflowTasks
    .filter(({ task }) => task.status === 'submitted')
    .map((entry) => ({
      taskId: entry.task.id,
      batchId: entry.batchId,
      title: entry.task.title,
      status: entry.task.status,
      inputPayload: entry.task.inputPayload,
      projectName: batchContext.get(entry.batchId)?.project.name ?? '',
      batchName: batchContext.get(entry.batchId)?.batch.name ?? ''
    }))
    .filter((entry) => entry.projectName && entry.batchName);

  const reworkTasks: QaTaskRecord[] = workflowTasks
    .filter(({ task }) => ['qa_rejected', 'sampling_rejected'].includes(task.status))
    .map((entry) => ({
      taskId: entry.task.id,
      batchId: entry.batchId,
      title: entry.task.title,
      status: entry.task.status,
      inputPayload: entry.task.inputPayload,
      projectName: batchContext.get(entry.batchId)?.project.name ?? '',
      batchName: batchContext.get(entry.batchId)?.batch.name ?? ''
    }))
    .filter((entry) => entry.projectName && entry.batchName);

  const deliverableBatches: DeliverableBatchRecord[] = workflowBatches
    .map(({ project, batch }) => {
      const batchTasks = workflowTasks
        .filter((entry) => entry.batchId === batch.id)
        .map((entry) => entry.task);
      const readyTaskCount = batchTasks.filter((task) =>
        ['qa_passed', 'sampling_passed'].includes(task.status)
      ).length;
      const hasPendingQa = batchTasks.some((task) => task.status === 'submitted');

      return {
        batchId: batch.id,
        batchName: batch.name,
        batchStatus: batch.status,
        projectName: project.name,
        readyTaskCount,
        visible: readyTaskCount > 0 && !hasPendingQa && batch.status !== 'delivered'
      };
    })
    .filter((batch) => batch.visible)
    .map((batch) => ({
      batchId: batch.batchId,
      batchName: batch.batchName,
      batchStatus: batch.batchStatus,
      projectName: batch.projectName,
      readyTaskCount: batch.readyTaskCount
    }));

  return (
    <AppShell title="质检交付台" description="集中处理待质检题目、返修题目与可发起交付的批次。">
      <QaDeliveryWorkbench
        pendingQaTasks={pendingQaTasks}
        reworkTasks={reworkTasks}
        deliverableBatches={deliverableBatches}
      />
    </AppShell>
  );
}
