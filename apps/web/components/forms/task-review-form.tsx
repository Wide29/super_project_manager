'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createTaskReview } from '../../lib/api/reviews';
import type { CreateTaskReviewInput } from '../../lib/types';
import { ActionCard } from '../ui/action-card';

type TaskReviewFormState = {
  decision: CreateTaskReviewInput['decision'];
  reviewerId: string;
  notes: string;
};

const INITIAL_FORM: TaskReviewFormState = {
  decision: 'passed',
  reviewerId: '',
  notes: ''
};

export function TaskReviewForm({
  taskId,
  externalNotesDraft
}: {
  taskId: string;
  externalNotesDraft?: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState<TaskReviewFormState>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setForm(INITIAL_FORM);
    setMessage('');
    setError('');
  }, [taskId]);

  useEffect(() => {
    if (!externalNotesDraft) return;

    setForm((current) => ({ ...current, notes: externalNotesDraft }));
  }, [externalNotesDraft]);

  function updateField<K extends keyof TaskReviewFormState>(key: K, value: TaskReviewFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    if (error) {
      setError('');
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.reviewerId.trim()) {
      setError('请先填写质检员 ID。');
      return;
    }

    setSubmitting(true);
    setError('');
    setMessage('');

    try {
      await createTaskReview(taskId, {
        stage: 'qa',
        decision: form.decision,
        reviewerId: form.reviewerId.trim(),
        notes: form.notes.trim() || undefined
      });
      setForm(INITIAL_FORM);
      setMessage('质检记录已创建，页面已刷新。');
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '提交质检失败');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ActionCard title="提交质检" description="对当前题目做 QA 通过或打回。">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="task-review-decision" className="text-sm font-medium text-slateDeep">
            审核结论
          </label>
          <select
            id="task-review-decision"
            value={form.decision}
            onChange={(event) =>
              updateField('decision', event.target.value as TaskReviewFormState['decision'])
            }
            className="mt-2 h-11 w-full rounded-2xl border border-panelLine bg-cloud px-4 text-sm text-slateDeep outline-none transition focus:border-skyStrong"
          >
            <option value="passed">通过</option>
            <option value="rejected">打回</option>
          </select>
        </div>

        <div>
          <label htmlFor="task-reviewer-id" className="text-sm font-medium text-slateDeep">
            质检员 ID
          </label>
          <input
            id="task-reviewer-id"
            value={form.reviewerId}
            onChange={(event) => updateField('reviewerId', event.target.value)}
            placeholder="例如：qa-1"
            className="mt-2 h-11 w-full rounded-2xl border border-panelLine bg-cloud px-4 text-sm text-slateDeep outline-none transition focus:border-skyStrong"
          />
        </div>

        <div>
          <label htmlFor="task-review-notes" className="text-sm font-medium text-slateDeep">
            质检备注
          </label>
          <textarea
            id="task-review-notes"
            value={form.notes}
            onChange={(event) => updateField('notes', event.target.value)}
            placeholder="补充通过原因、打回说明或返修建议"
            className="mt-2 min-h-24 w-full rounded-2xl border border-panelLine bg-cloud px-4 py-3 text-sm text-slateDeep outline-none transition focus:border-skyStrong"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-skyStrong px-5 py-3 text-sm font-medium text-white disabled:opacity-60"
        >
          {submitting ? '提交中...' : '提交质检'}
        </button>

        {error ? <p className="text-sm text-rose-500">{error}</p> : null}
        {message ? <p className="text-sm text-slate-500">{message}</p> : null}
      </form>
    </ActionCard>
  );
}
