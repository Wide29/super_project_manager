'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createAssignment } from '../../lib/api/assignments';
import type { CreateAssignmentInput } from '../../lib/types';
import { ActionCard } from '../ui/action-card';

type AssignmentFormState = {
  assigneeId: string;
  operatorId: string;
  notes: string;
};

const INITIAL_FORM: AssignmentFormState = {
  assigneeId: '',
  operatorId: '',
  notes: ''
};

export function AssignmentCreateForm({ taskId }: { taskId: string }) {
  const router = useRouter();
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  function updateField<K extends keyof AssignmentFormState>(
    key: K,
    value: AssignmentFormState[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
    if (error) {
      setError('');
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.assigneeId.trim()) {
      setError('请先填写标注员 ID。');
      setMessage('');
      return;
    }

    setSubmitting(true);
    setError('');
    setMessage('');

    const payload: CreateAssignmentInput = {
      assigneeId: form.assigneeId.trim(),
      operatorId: form.operatorId.trim() || undefined,
      notes: form.notes.trim() || undefined
    };

    try {
      await createAssignment(taskId, payload);
      setForm(INITIAL_FORM);
      setMessage('任务已分配，右侧记录已刷新。');
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '分配任务失败');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ActionCard title="分配给标注员" description="为当前任务创建一条执行记录。">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="assignment-assignee-id" className="text-sm font-medium text-slateDeep">
            标注员 ID
          </label>
          <input
            id="assignment-assignee-id"
            value={form.assigneeId}
            onChange={(event) => updateField('assigneeId', event.target.value)}
            placeholder="例如：annotator-01"
            className="mt-2 h-11 w-full rounded-2xl border border-panelLine bg-cloud px-4 text-sm text-slateDeep outline-none transition focus:border-skyStrong"
          />
        </div>

        <div>
          <label htmlFor="assignment-operator-id" className="text-sm font-medium text-slateDeep">
            运营商 ID
          </label>
          <input
            id="assignment-operator-id"
            value={form.operatorId}
            onChange={(event) => updateField('operatorId', event.target.value)}
            placeholder="可选，例如：operator-01"
            className="mt-2 h-11 w-full rounded-2xl border border-panelLine bg-cloud px-4 text-sm text-slateDeep outline-none transition focus:border-skyStrong"
          />
        </div>

        <div>
          <label htmlFor="assignment-notes" className="text-sm font-medium text-slateDeep">
            备注
          </label>
          <textarea
            id="assignment-notes"
            value={form.notes}
            onChange={(event) => updateField('notes', event.target.value)}
            placeholder="可选，填写分配说明或交接备注"
            className="mt-2 min-h-24 w-full rounded-2xl border border-panelLine bg-cloud px-4 py-3 text-sm text-slateDeep outline-none transition focus:border-skyStrong"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-skyStrong px-5 py-3 text-sm font-medium text-white disabled:opacity-60"
        >
          {submitting ? '分配中...' : '确认分配'}
        </button>

        {error ? <p className="text-sm text-rose-500">{error}</p> : null}
        {message ? <p className="text-sm text-slate-500">{message}</p> : null}
      </form>
    </ActionCard>
  );
}
