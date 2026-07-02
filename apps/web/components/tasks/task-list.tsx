import type { TaskAssignment, TaskDetail } from '../../lib/types';

export function TaskList({
  task,
  assignments
}: {
  task: TaskDetail;
  assignments: TaskAssignment[];
}) {
  return (
    <div className="space-y-6">
      <section className="rounded-panel border border-panelLine bg-white p-6 shadow-panel">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-slateDeep">{task.title}</h2>
            <p className="mt-2 text-sm text-slate-500">任务 ID：{task.id}</p>
          </div>
          <div className="flex gap-3 text-sm">
            <span className="rounded-full bg-skySoft px-3 py-1 text-skyStrong">
              状态：{task.status}
            </span>
            <span className="rounded-full bg-skySoft px-3 py-1 text-skyStrong">
              优先级：{task.priority}
            </span>
          </div>
        </div>
      </section>

      <section className="rounded-panel border border-panelLine bg-white p-6 shadow-panel">
        <h3 className="text-lg font-semibold text-slateDeep">题目内容</h3>
        <pre className="mt-4 overflow-x-auto rounded-2xl bg-cloud p-4 text-sm leading-7 text-slate-600">
          {JSON.stringify(task.inputPayload, null, 2)}
        </pre>
      </section>

      <section className="rounded-panel border border-panelLine bg-white p-6 shadow-panel">
        <h3 className="text-lg font-semibold text-slateDeep">分配与质检记录</h3>
        <div className="mt-4 space-y-3">
          {assignments.map((assignment) => (
            <div
              key={assignment.id}
              className="rounded-2xl border border-panelLine bg-cloud px-4 py-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-slateDeep">{assignment.assigneeId}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    分配时间：{new Date(assignment.assignedAt).toLocaleString('zh-CN')}
                  </p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs text-skyStrong">
                  {assignment.status}
                </span>
              </div>
              {assignment.notes ? (
                <p className="mt-3 text-sm text-slate-500">备注：{assignment.notes}</p>
              ) : null}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
