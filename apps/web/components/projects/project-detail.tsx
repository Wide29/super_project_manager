import Link from 'next/link';
import type { BatchSummary, ProjectDetail } from '../../lib/types';

export function ProjectDetailView({
  project,
  batches
}: {
  project: ProjectDetail;
  batches: BatchSummary[];
}) {
  return (
    <div className="space-y-6">
      <section className="rounded-panel border border-panelLine bg-white p-6 shadow-panel">
        <h2 className="text-2xl font-semibold">{project.name}</h2>
        <p className="mt-2 text-sm text-slate-500">{project.description || '暂无项目说明'}</p>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <span className="rounded-full bg-skySoft px-3 py-1 text-skyStrong">
            状态：{project.status}
          </span>
          <span className="rounded-full bg-skySoft px-3 py-1 text-skyStrong">
            题型：{project.taskType}
          </span>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-panel border border-panelLine bg-white p-6 shadow-panel">
          <h3 className="text-lg font-semibold">SOP 摘要</h3>
          <p className="mt-3 text-sm text-slate-500">
            {project.sopDocument || '暂无 SOP 内容'}
          </p>
        </article>
        <article className="rounded-panel border border-panelLine bg-white p-6 shadow-panel">
          <h3 className="text-lg font-semibold">验收标准</h3>
          <p className="mt-3 text-sm text-slate-500">
            {project.acceptanceCriteria || '暂无验收标准说明'}
          </p>
        </article>
      </section>

      <section className="rounded-panel border border-panelLine bg-white p-6 shadow-panel">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h3 className="text-lg font-semibold">批次概览</h3>
          <span className="text-sm text-slate-500">共 {batches.length} 个批次</span>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {batches.map((batch) => (
            <Link
              key={batch.id}
              href={`/batches/${batch.id}`}
              className="rounded-2xl border border-panelLine bg-cloud p-4 transition hover:-translate-y-0.5"
            >
              <p className="font-medium">{batch.name}</p>
              <p className="mt-2 text-sm text-slate-500">状态：{batch.status}</p>
              <p className="mt-1 text-sm text-slate-500">
                计划题量：{batch.plannedTaskCount ?? '未设置'}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
