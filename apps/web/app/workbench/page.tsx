import { AssistantDrawer } from '../../components/ai/assistant-drawer';
import { AppShell } from '../../components/layout/app-shell';
import { TaskWorkbench } from '../../components/workbench/task-workbench';
import { getNextTask } from '../../lib/api/tasks';

export const dynamic = 'force-dynamic';

export default async function WorkbenchPage({
  searchParams
}: {
  searchParams?: Promise<{ assigneeId?: string }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const assigneeId =
    resolvedSearchParams?.assigneeId ||
    process.env.NEXT_PUBLIC_DEFAULT_ASSIGNEE_ID ||
    'annotator-demo';
  const task = await getNextTask(assigneeId);

  return (
    <AppShell
      title="标注工作台"
      description="标注员连续领取题目，提交后进入下一题。"
      rightSlot={
        <AssistantDrawer
          taskId={task?.id}
          context={`当前工作台执行人：${assigneeId}${task ? `，当前任务：${task.title}` : ''}`}
        />
      }
    >
      <TaskWorkbench assigneeId={assigneeId} task={task} />
    </AppShell>
  );
}
