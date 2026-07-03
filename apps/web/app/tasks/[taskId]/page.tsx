import { AssistantDrawer } from '../../../components/ai/assistant-drawer';
import { AssignmentCreateForm } from '../../../components/forms/assignment-create-form';
import { AssignmentTransferForm } from '../../../components/forms/assignment-transfer-form';
import { TaskReviewForm } from '../../../components/forms/task-review-form';
import { TaskSettlementForm } from '../../../components/forms/task-settlement-form';
import { AssignmentPanel } from '../../../components/assignments/assignment-panel';
import { AppShell } from '../../../components/layout/app-shell';
import { ReviewPanel } from '../../../components/reviews/review-panel';
import { SettlementPanel } from '../../../components/settlements/settlement-panel';
import { TaskList } from '../../../components/tasks/task-list';
import { getTaskAssignments } from '../../../lib/api/assignments';
import { getTaskReviews } from '../../../lib/api/reviews';
import { getTaskSettlement } from '../../../lib/api/settlements';
import { getTask } from '../../../lib/api/tasks';

export const dynamic = 'force-dynamic';

export default async function TaskDetailPage({
  params
}: {
  params: Promise<{ taskId: string }>;
}) {
  const { taskId } = await params;
  const [task, assignments, reviews, settlement] = await Promise.all([
    getTask(taskId),
    getTaskAssignments(taskId),
    getTaskReviews(taskId),
    getTaskSettlement(taskId)
  ]);

  return (
    <AppShell
      title="任务详情"
      description="围绕单题查看内容、分配记录与 AI 建议。"
      rightSlot={
        <div className="space-y-6">
          <AssignmentCreateForm taskId={task.id} />
          <AssignmentTransferForm assignments={assignments} />
          <TaskReviewForm taskId={task.id} />
          <TaskSettlementForm taskId={task.id} assignments={assignments} />
          <AssignmentPanel assignments={assignments} />
          <ReviewPanel reviews={reviews} />
          <SettlementPanel settlement={settlement} assignments={assignments} />
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
