import type { TaskAssignment } from '../../lib/types';

export function AssignmentPanel({ assignments }: { assignments: TaskAssignment[] }) {
  return (
    <div className="rounded-panel border border-panelLine bg-white p-6 shadow-panel">
      <h3 className="text-lg font-semibold text-slateDeep">当前任务流转</h3>
      <div className="mt-5 space-y-4">
        {assignments.length === 0 ? (
          <p className="text-sm text-slate-500">暂未分配给标注或质检角色。</p>
        ) : null}
        {assignments.map((assignment) => (
          <div key={assignment.id} className="rounded-2xl bg-cloud px-4 py-4">
            <p className="text-sm text-slate-500">执行人</p>
            <p className="mt-1 font-medium text-slateDeep">{assignment.assigneeId}</p>
            <p className="mt-3 text-sm text-slate-500">状态：{assignment.status}</p>
            {assignment.transferReason ? (
              <p className="mt-1 text-sm text-slate-500">转交原因：{assignment.transferReason}</p>
            ) : null}
            {assignment.sourceAssignmentId ? (
              <p className="mt-1 text-sm text-slate-500">
                来源执行记录：{assignment.sourceAssignmentId}
              </p>
            ) : null}
            <p className="mt-1 text-sm text-slate-500">
              时间：{new Date(assignment.assignedAt).toLocaleString('zh-CN')}
            </p>
            {assignment.notes ? (
              <p className="mt-3 text-sm text-slate-500">备注：{assignment.notes}</p>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
