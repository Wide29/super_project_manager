import { AppShell } from '../components/layout/app-shell';

export default function HomePage() {
  return (
    <AppShell title="总览" description="查看项目进度、快速进入管理与标注流程。">
      <div className="grid gap-6 md:grid-cols-3">
        {[
          ['项目总数', '4'],
          ['进行中批次', '12'],
          ['待领取任务', '128']
        ].map(([label, value]) => (
          <article
            key={label}
            className="rounded-panel border border-panelLine bg-white p-6 shadow-panel"
          >
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-3 text-3xl font-semibold text-slateDeep">{value}</p>
          </article>
        ))}
      </div>
    </AppShell>
  );
}
