import type { ReactNode } from 'react';

export function ActionCard({
  title,
  description,
  children
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-panel border border-panelLine bg-white p-6 shadow-panel">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slateDeep">{title}</h3>
        {description ? <p className="mt-2 text-sm text-slate-500">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
