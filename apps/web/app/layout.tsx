import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '超级项目管理台',
  description: '数据生产平台前端管理台'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
