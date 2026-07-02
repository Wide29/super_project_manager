import Link from 'next/link';
import type { DashboardOverview, ProjectSummary } from '../../lib/types';

const cardConfig = [
  { key: 'projectCount', label: '项目总数', href: '/projects' },
  { key: 'batchCount', label: '批次数量', href: '/projects' },
  { key: 'taskCount', label: '任务总量', href: '/workbench' },
  { key: 'assignmentCount', label: '分配记录', href: '/workbench' }
] as const;

export function OverviewCards({
  overview,
  projects
}: {
  overview: DashboardOverview;
  projects: ProjectSummary[];
}) {
  return (
    <div className="space-y-6">
      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {cardConfig.map((card) => (
          <Link
            key={card.key}
            href={card.href}
            className="group rounded-panel border border-panelLine bg-white p-6 shadow-panel transition hover:-translate-y-1"
          >
            <p className="text-sm text-slate-500">{card.label}</p>
            <p className="mt-3 text-3xl font-semibold text-slateDeep">
              {overview[card.key]}
            </p>
            <p className="mt-4 text-sm text-skyStrong transition group-hover:translate-x-1">
              查看详情
            </p>
          </Link>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <article className="rounded-panel border border-panelLine bg-white p-6 shadow-panel">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slateDeep">近期项目</h2>
              <p className="mt-2 text-sm text-slate-500">直接查看项目说明、SOP 与批次状态。</p>
            </div>
            <Link href="/projects" className="text-sm text-skyStrong">
              全部项目
            </Link>
          </div>

          <div className="mt-6 space-y-4">
            {projects.slice(0, 4).map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="block rounded-2xl border border-panelLine bg-cloud px-4 py-4 transition hover:border-skyBrand"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-slateDeep">{project.name}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {project.description || '暂无项目描述'}
                    </p>
                  </div>
                  <span className="rounded-full bg-skySoft px-3 py-1 text-xs text-skyStrong">
                    {project.taskType}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </article>

        <article className="rounded-panel border border-panelLine bg-[linear-gradient(180deg,#edf7ff_0%,#ffffff_100%)] p-6 shadow-panel">
          <h2 className="text-xl font-semibold text-slateDeep">流程提醒</h2>
          <div className="mt-5 space-y-4">
            {[
              '项目经理创建项目并配置题型、产能、角色分工',
              '运营/交付补齐 SOP、验收标准、交付节奏',
              '运营商分发任务，标注员连续领取并提交题目',
              '质检与算法抽检后完成批次验收'
            ].map((item, index) => (
              <div key={item} className="flex gap-3">
                <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-white text-sm font-semibold text-skyStrong shadow-panel">
                  {index + 1}
                </div>
                <p className="text-sm leading-7 text-slate-600">{item}</p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
