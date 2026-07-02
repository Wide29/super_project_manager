import { AppShell } from '../../components/layout/app-shell';
import { AssistantDrawer } from '../../components/ai/assistant-drawer';

export default function AssistantPage() {
  return (
    <AppShell title="智能助手" description="这里将承接中文 AI 助手对话与任务建议。">
      <div className="rounded-panel border border-panelLine bg-[linear-gradient(180deg,#edf7ff_0%,#ffffff_100%)] p-6 shadow-panel">
        <h2 className="text-2xl font-semibold text-slateDeep">项目协同助手</h2>
        <p className="mt-3 text-sm leading-7 text-slate-500">
          可用于整理 SOP、提炼验收标准、识别交付风险，或对某道题生成中文作答建议。
        </p>
      </div>
      <AssistantDrawer context="当前页面为超级项目管理台的通用助手页。" />
    </AppShell>
  );
}
