import { PageReveal } from '../motion/page-reveal';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';

export function AppShell({
  children,
  title,
  description,
  rightSlot
}: {
  children: React.ReactNode;
  title: string;
  description?: string;
  rightSlot?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-cloud text-slateDeep">
      <Sidebar />
      <main className="flex-1 px-8 py-8">
        <PageReveal>
          <Topbar title={title} description={description} />
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <section>{children}</section>
            {rightSlot ? <aside>{rightSlot}</aside> : null}
          </div>
        </PageReveal>
      </main>
    </div>
  );
}
