import { AssistantDrawer } from '../../../components/ai/assistant-drawer';
import { AssignmentCreateForm } from '../../../components/forms/assignment-create-form';
import { AssignmentPanel } from '../../../components/assignments/assignment-panel';
import { AppShell } from '../../../components/layout/app-shell';
import { TaskList } from '../../../components/tasks/task-list';
import { getTaskAssignments } from '../../../lib/api/assignments';
import { getTask } from '../../../lib/api/tasks';

export const dynamic = 'force-dynamic';

export default async function TaskDetailPage({
  params
}: {
  params: Promise<{ taskId: string }>;
}) {
  const { taskId } = await params;
  const [task, assignments] = await Promise.all([
    getTask(taskId),
    getTaskAssignments(taskId)
  ]);

  return (
    <AppShell
      title="任务详情"
      description="围绕单题查看内容、分配记录与 AI 建议。"
      rightSlot={
        <div className="space-y-6">
          <AssignmentCreateForm taskId={task.id} />
          <AssignmentPanel assignments={assignments} />
          <AssistantDrawer
            taskId={task.id}
            context={`当前任务标题：${task.title}。当前状态：${task.status}。`}
          />
        </div>
      }
    >
      <TaskList task={task} assignments={assignments} />
    </AppShell>
  );
}
