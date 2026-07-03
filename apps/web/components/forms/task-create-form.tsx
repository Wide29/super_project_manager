'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createTask } from '../../lib/api/tasks';
import type { CreateTaskInput } from '../../lib/types';
import { ActionCard } from '../ui/action-card';

const INITIAL_PAYLOAD = '{\n  "question": ""\n}';

type TaskFormState = {
  title: string;
  externalRef: string;
  priority: string;
  inputPayloadText: string;
};

const INITIAL_FORM: TaskFormState = {
  title: '',
  externalRef: '',
  priority: '0',
  inputPayloadText: INITIAL_PAYLOAD
};

export function TaskCreateForm({ batchId }: { batchId: string }) {
  const router = useRouter();
  const [form, setForm] = useState<TaskFormState>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  function updateField<K extends keyof TaskFormState>(key: K, value: TaskFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    if (error) {
      setError('');
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.title.trim()) {
      setError('请先填写任务标题。');
      setMessage('');
      return;
    }

    const parsedPriority = Number(form.priority.trim() || '0');
    if (!Number.isInteger(parsedPriority) || parsedPriority < 0) {
      setError('优先级需为大于等于 0 的整数。');
      setMessage('');
      return;
    }

    let inputPayload: Record<string, unknown>;
    try {
      const parsed = JSON.parse(form.inputPayloadText) as unknown;
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('题目 JSON 必须是对象。');
      }
      inputPayload = parsed as Record<string, unknown>;
    } catch (parseError) {
      setError(parseError instanceof Error ? parseError.message : '题目 JSON 解析失败。');
      setMessage('');
      return;
    }

    setSubmitting(true);
    setError('');
    setMessage('');

    const payload: CreateTaskInput = {
      title: form.title.trim(),
      externalRef: form.externalRef.trim() || undefined,
      priority: parsedPriority,
      inputPayload
    };

    try {
      await createTask(batchId, payload);
      setForm(INITIAL_FORM);
      setMessage('任务已创建，可在下方任务清单中查看。');
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '创建任务失败');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ActionCard title="新建任务" description="手工录入单道题目。">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="task-title" className="text-sm font-medium text-slateDeep">
            任务标题
          </label>
          <input
            id="task-title"
            value={form.title}
            onChange={(event) => updateField('title', event.target.value)}
            placeholder="例如：第 1 题解析标注"
            className="mt-2 h-11 w-full rounded-2xl border border-panelLine bg-cloud px-4 text-sm text-slateDeep outline-none transition focus:border-skyStrong"
          />
        </div>

        <div>
          <label htmlFor="task-external-ref" className="text-sm font-medium text-slateDeep">
            外部引用
          </label>
          <input
            id="task-external-ref"
            value={form.externalRef}
            onChange={(event) => updateField('externalRef', event.target.value)}
            placeholder="可选，例如：A-001"
            className="mt-2 h-11 w-full rounded-2xl border border-panelLine bg-cloud px-4 text-sm text-slateDeep outline-none transition focus:border-skyStrong"
          />
        </div>

        <div>
          <label htmlFor="task-priority" className="text-sm font-medium text-slateDeep">
            优先级
          </label>
          <input
            id="task-priority"
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            value={form.priority}
            onChange={(event) => updateField('priority', event.target.value)}
            className="mt-2 h-11 w-full rounded-2xl border border-panelLine bg-cloud px-4 text-sm text-slateDeep outline-none transition focus:border-skyStrong"
          />
        </div>

        <div>
          <label htmlFor="task-input-payload" className="text-sm font-medium text-slateDeep">
            题目 JSON
          </label>
          <textarea
            id="task-input-payload"
            value={form.inputPayloadText}
            onChange={(event) => updateField('inputPayloadText', event.target.value)}
            className="mt-2 min-h-40 w-full rounded-2xl border border-panelLine bg-cloud px-4 py-3 font-mono text-sm text-slateDeep outline-none transition focus:border-skyStrong"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-skyStrong px-5 py-3 text-sm font-medium text-white disabled:opacity-60"
        >
          {submitting ? '创建中...' : '保存任务'}
        </button>

        {error ? <p className="text-sm text-rose-500">{error}</p> : null}
        {message ? <p className="text-sm text-slate-500">{message}</p> : null}
      </form>
    </ActionCard>
  );
}
