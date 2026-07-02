export function Topbar({
  title,
  description
}: {
  title: string;
  description?: string;
}) {
  return (
    <header className="mb-8 flex items-start justify-between gap-4">
      <div>
        <p className="text-sm text-skyStrong">中文管理台</p>
        <h1 className="mt-2 text-3xl font-semibold text-slateDeep">{title}</h1>
        {description ? <p className="mt-2 text-sm text-slate-500">{description}</p> : null}
      </div>

      <div className="rounded-2xl border border-panelLine bg-white px-4 py-3 text-sm text-slate-500 shadow-panel">
        实时连接后端 API
      </div>
    </header>
  );
}
