'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { theme } from '../../lib/theme';

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-panelLine bg-white/90 p-6">
      <div className="mb-10">
        <div className="inline-flex items-center rounded-full bg-skySoft px-3 py-1 text-xs font-medium text-skyStrong">
          数据生产平台
        </div>
        <h2 className="mt-4 text-2xl font-semibold text-slateDeep">超级项目管理台</h2>
      </div>

      <nav className="space-y-2">
        {theme.navItems.map((item) => {
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-2xl px-4 py-3 text-sm transition ${
                active
                  ? 'bg-skyStrong text-white shadow-panel'
                  : 'text-slate-600 hover:bg-skySoft hover:text-slateDeep'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
