'use client';

import { useState } from 'react';
import type { TaskDetail } from '../../lib/types';
import { submitTask } from '../../lib/api/tasks';

export function TaskWorkbench({
  assigneeId,
  task
}: {
  assigneeId: string;
  task: TaskDetail | null;
}) {
  const [answer, setAnswer] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState(task?.status ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  if (!task) {
    return (
      <div className="rounded-panel border border-panelLine bg-white p-6 shadow-panel">
        <h2 className="text-xl font-semibold text-slateDeep">当前无可领取题目</h2>
        <p className="mt-3 text-sm text-slate-500">
          请让运营商继续分配任务，或切换其他标注员 ID 查看队列。
        </p>
      </div>
    );
  }

  async function handleSubmit() {
    if (!answer.trim()) {
      setMessage('请先填写标注结果。');
      return;
    }

    if (!task) {
      setMessage('当前没有可提交的任务。');
      return;
    }

    setSubmitting(true);
    setMessage('');

    try {
      const result = await submitTask({
        taskId: task.id,
        assigneeId,
        outputPayload: {
          answer,
          submittedBy: assigneeId
        },
        notes
      });

      setStatus(result.status);
      setMessage('任务已提交，刷新页面后可查看下一题。');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '提交失败');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-panel border border-panelLine bg-white p-6 shadow-panel">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-skyStrong">当前执行人：{assigneeId}</p>
            <h2 className="mt-2 text-2xl font-semibold text-slateDeep">{task.title}</h2>
          </div>
          <span className="rounded-full bg-skySoft px-3 py-1 text-sm text-skyStrong">
            {status}
          </span>
        </div>
      </section>

      <section className="rounded-panel border border-panelLine bg-white p-6 shadow-panel">
        <h3 className="text-lg font-semibold text-slateDeep">题目内容</h3>
        <pre className="mt-4 overflow-x-auto rounded-2xl bg-cloud p-4 text-sm leading-7 text-slate-600">
          {JSON.stringify(task.inputPayload, null, 2)}
        </pre>
      </section>

      <section className="rounded-panel border border-panelLine bg-white p-6 shadow-panel">
        <h3 className="text-lg font-semibold text-slateDeep">标注结果</h3>
        <textarea
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          placeholder="请输入当前题目的作答或标注结果"
          className="mt-4 min-h-40 w-full rounded-2xl border border-panelLine bg-cloud px-4 py-3 text-sm outline-none"
        />
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="可选备注，例如质检风险、异常说明"
          className="mt-4 min-h-24 w-full rounded-2xl border border-panelLine bg-cloud px-4 py-3 text-sm outline-none"
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="mt-4 rounded-full bg-skyStrong px-5 py-2.5 text-sm text-white disabled:opacity-60"
        >
          {submitting ? '提交中...' : '提交并进入下一题'}
        </button>
        {message ? <p className="mt-4 text-sm text-slate-500">{message}</p> : null}
      </section>
    </div>
  );
}
