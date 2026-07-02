'use client';

import { useState } from 'react';
import { chatWithAssistant, getTaskSuggestion } from '../../lib/api/ai';

export function AssistantDrawer({
  taskId,
  context
}: {
  taskId?: string;
  context?: string;
}) {
  const [message, setMessage] = useState('');
  const [reply, setReply] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleChat() {
    if (!message.trim()) return;

    setLoading(true);
    setError('');

    try {
      const result = await chatWithAssistant(message, context);
      setReply(result.answer);
    } catch (err) {
      setError(err instanceof Error ? err.message : '助手调用失败');
    } finally {
      setLoading(false);
    }
  }

  async function handleSuggestion() {
    if (!taskId) return;

    setLoading(true);
    setError('');

    try {
      const result = await getTaskSuggestion(taskId);
      setSuggestion(result.suggestion);
    } catch (err) {
      setError(err instanceof Error ? err.message : '建议生成失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-panel border border-panelLine bg-white p-6 shadow-panel">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slateDeep">智能助手</h3>
          <p className="mt-2 text-sm text-slate-500">对接 DeepSeek，经由后端统一代理。</p>
        </div>
        {taskId ? (
          <button
            type="button"
            onClick={handleSuggestion}
            disabled={loading}
            className="rounded-full bg-skyStrong px-4 py-2 text-sm text-white disabled:opacity-60"
          >
            生成作答建议
          </button>
        ) : null}
      </div>

      <textarea
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        placeholder="输入你的问题，例如：请总结这个项目的执行风险。"
        className="mt-5 min-h-32 w-full rounded-2xl border border-panelLine bg-cloud px-4 py-3 text-sm outline-none"
      />

      <button
        type="button"
        onClick={handleChat}
        disabled={loading}
        className="mt-4 rounded-full bg-slateDeep px-5 py-2.5 text-sm text-white disabled:opacity-60"
      >
        {loading ? '处理中...' : '发送给助手'}
      </button>

      {error ? <p className="mt-4 text-sm text-rose-500">{error}</p> : null}
      {reply ? <p className="mt-4 rounded-2xl bg-cloud p-4 text-sm leading-7">{reply}</p> : null}
      {suggestion ? (
        <div className="mt-4 rounded-2xl bg-skySoft p-4 text-sm leading-7 text-slateDeep">
          {suggestion}
        </div>
      ) : null}
    </div>
  );
}
