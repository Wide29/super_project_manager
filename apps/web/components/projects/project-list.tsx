import Link from 'next/link';
import type { ProjectSummary } from '../../lib/types';

export function ProjectList({ projects }: { projects: ProjectSummary[] }) {
  if (projects.length === 0) {
    return (
      <section className="rounded-panel border border-dashed border-panelLine bg-white p-10 text-center shadow-panel">
        <h2 className="text-xl font-semibold text-slateDeep">还没有项目</h2>
        <p className="mt-3 text-sm text-slate-500">
          可以先在右侧创建首个项目，随后在这里查看进度与题型分布。
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      {projects.map((project) => (
        <Link
          key={project.id}
          href={`/projects/${project.id}`}
          className="block rounded-panel border border-panelLine bg-white p-6 shadow-panel transition hover:-translate-y-0.5"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold text-slateDeep">{project.name}</h3>
              <p className="mt-2 text-sm text-slate-500">
                {project.description || '暂无项目描述'}
              </p>
            </div>
            <span className="rounded-full bg-skySoft px-3 py-1 text-xs text-skyStrong">
              {project.status}
            </span>
          </div>
          <div className="mt-4 text-sm text-slate-500">题型：{project.taskType}</div>
        </Link>
      ))}
    </div>
  );
}
