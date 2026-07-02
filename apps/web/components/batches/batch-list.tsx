import Link from 'next/link';
import type { BatchDetail, TaskSummary } from '../../lib/types';

export function BatchList({
  batch,
  tasks
}: {
  batch: BatchDetail;
  tasks: TaskSummary[];
}) {
  const submittedCount = tasks.filter((task) => task.status === 'submitted').length;

  return (
    <div className="space-y-6">
      <section className="rounded-panel border border-panelLine bg-white p-6 shadow-panel">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-slateDeep">{batch.name}</h2>
            <p className="mt-2 text-sm text-slate-500">批次 ID：{batch.id}</p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <span className="rounded-full bg-skySoft px-3 py-1 text-skyStrong">
              状态：{batch.status}
            </span>
            <span className="rounded-full bg-skySoft px-3 py-1 text-skyStrong">
              计划题量：{batch.plannedTaskCount ?? '未设置'}
            </span>
            <span className="rounded-full bg-skySoft px-3 py-1 text-skyStrong">
              已提交：{submittedCount}/{tasks.length}
            </span>
          </div>
        </div>
      </section>

      <section className="rounded-panel border border-panelLine bg-white p-6 shadow-panel">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slateDeep">任务清单</h3>
          <p className="text-sm text-slate-500">按题目粒度核算与追踪</p>
        </div>

        <div className="space-y-4">
          {tasks.map((task) => (
            <Link
              key={task.id}
              href={`/tasks/${task.id}`}
              className="block rounded-2xl border border-panelLine bg-cloud px-4 py-4 transition hover:border-skyBrand"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-slateDeep">{task.title}</p>
                  <p className="mt-2 text-sm text-slate-500">
                    题面：{JSON.stringify(task.inputPayload)}
                  </p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs text-skyStrong">
                  {task.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
