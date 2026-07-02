'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createBatch } from '../../lib/api/batches';
import type { CreateBatchInput } from '../../lib/types';
import { ActionCard } from '../ui/action-card';

type BatchFormState = {
  name: CreateBatchInput['name'];
  plannedTaskCount: string;
};

const INITIAL_FORM: BatchFormState = {
  name: '',
  plannedTaskCount: ''
};

export function BatchCreateForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [form, setForm] = useState<BatchFormState>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  function updateField<K extends keyof BatchFormState>(key: K, value: BatchFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.name.trim()) {
      setError('请先填写批次名称。');
      setMessage('');
      return;
    }

    const trimmedTaskCount = form.plannedTaskCount.trim();
    const parsedTaskCount = trimmedTaskCount ? Number(trimmedTaskCount) : undefined;

    if (
      parsedTaskCount !== undefined &&
      (!Number.isInteger(parsedTaskCount) || parsedTaskCount < 0)
    ) {
      setError('计划题量需为大于等于 0 的整数。');
      setMessage('');
      return;
    }

    setSubmitting(true);
    setError('');
    setMessage('');

    const payload: CreateBatchInput = {
      name: form.name.trim(),
      plannedTaskCount: parsedTaskCount
    };

    try {
      await createBatch(projectId, payload);
      setForm(INITIAL_FORM);
      setMessage('批次已创建，列表已刷新。');
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '创建批次失败');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ActionCard title="新建批次" description="在当前项目下增加一个批次。">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="batch-name" className="text-sm font-medium text-slateDeep">
            批次名称
          </label>
          <input
            id="batch-name"
            value={form.name}
            onChange={(event) => updateField('name', event.target.value)}
            placeholder="例如：第一轮交付批次"
            className="mt-2 h-11 w-full rounded-2xl border border-panelLine bg-cloud px-4 text-sm text-slateDeep outline-none transition focus:border-skyStrong"
          />
        </div>

        <div>
          <label htmlFor="batch-task-count" className="text-sm font-medium text-slateDeep">
            计划题量
          </label>
          <input
            id="batch-task-count"
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            value={form.plannedTaskCount}
            onChange={(event) => updateField('plannedTaskCount', event.target.value)}
            placeholder="可选，留空表示暂未设置"
            className="mt-2 h-11 w-full rounded-2xl border border-panelLine bg-cloud px-4 text-sm text-slateDeep outline-none transition focus:border-skyStrong"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-slateDeep px-5 py-3 text-sm font-medium text-white disabled:opacity-60"
        >
          {submitting ? '创建中...' : '保存批次'}
        </button>

        {error ? <p className="text-sm text-rose-500">{error}</p> : null}
        {message ? <p className="text-sm text-slate-500">{message}</p> : null}
      </form>
    </ActionCard>
  );
}
