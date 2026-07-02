import { AppShell } from '../../components/layout/app-shell';
import { ProjectCreateForm } from '../../components/forms/project-create-form';
import { ProjectList } from '../../components/projects/project-list';
import { getProjects } from '../../lib/api/projects';

export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <AppShell
      title="项目管理"
      description="查看项目进度、状态和题型分布。"
      rightSlot={<ProjectCreateForm />}
    >
      <ProjectList projects={projects} />
    </AppShell>
  );
}
