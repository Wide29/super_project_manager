import { AppShell } from '../components/layout/app-shell';
import { OverviewCards } from '../components/dashboard/overview-cards';
import { getDashboardOverview } from '../lib/api/dashboard';
import { getProjects } from '../lib/api/projects';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [overview, projects] = await Promise.all([
    getDashboardOverview(),
    getProjects()
  ]);

  return (
    <AppShell title="总览" description="查看项目进度、快速进入管理与标注流程。">
      <OverviewCards overview={overview} projects={projects} />
    </AppShell>
  );
}
