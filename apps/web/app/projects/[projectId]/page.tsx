import { AppShell } from '../../../components/layout/app-shell';
import { ProjectDetailView } from '../../../components/projects/project-detail';
import { getProjectBatches } from '../../../lib/api/batches';
import { getProject } from '../../../lib/api/projects';

export const dynamic = 'force-dynamic';

export default async function ProjectDetailPage({
  params
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const [project, batches] = await Promise.all([
    getProject(projectId),
    getProjectBatches(projectId)
  ]);

  return (
    <AppShell title="项目详情" description="查看项目信息、SOP、验收标准与批次状态。">
      <ProjectDetailView project={project} batches={batches} />
    </AppShell>
  );
}
