'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { transferAssignment } from '../../lib/api/assignments';
import type { TaskAssignment, TransferAssignmentInput } from '../../lib/types';
import { ActionCard } from '../ui/action-card';

type AssignmentTransferFormState = {
  assignmentId: string;
  nextAssigneeId: string;
  transferReason: TransferAssignmentInput['transferReason'];
  notes: string;
};

function createInitialForm(assignments: TaskAssignment[]): AssignmentTransferFormState {
  return {
    assignmentId: assignments[0]?.id ?? '',
    nextAssigneeId: '',
    transferReason: 'offboarded',
    notes: ''
  };
}

export function AssignmentTransferForm({ assignments }: { assignments: TaskAssignment[] }) {
  const router = useRouter();
  const [form, setForm] = useState<AssignmentTransferFormState>(createInitialForm(assignments));
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  function updateField<K extends keyof AssignmentTransferFormState>(
    key: K,
    value: AssignmentTransferFormState[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
    if (error) {
      setError('');
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.assignmentId) {
      setError('当前没有可转交的执行记录。');
      return;
    }

    if (!form.nextAssigneeId.trim()) {
      setError('请先填写接手标注员 ID。');
      return;
    }

    setSubmitting(true);
    setError('');
    setMessage('');

    try {
      await transferAssignment(form.assignmentId, {
        nextAssigneeId: form.nextAssigneeId.trim(),
        transferReason: form.transferReason,
        notes: form.notes.trim() || undefined
      });
      setForm(createInitialForm(assignments));
      setMessage('任务已转交，执行流转记录已刷新。');
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '转交任务失败');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ActionCard title="代标转交" description="标注员离项后，把题目转给新的执行人。">
      {assignments.length === 0 ? (
        <p className="text-sm text-slate-500">请先为任务创建一条分配记录，再执行转交。</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="transfer-assignment-id" className="text-sm font-medium text-slateDeep">
              原执行记录
            </label>
            <select
              id="transfer-assignment-id"
              value={form.assignmentId}
              onChange={(event) => updateField('assignmentId', event.target.value)}
              className="mt-2 h-11 w-full rounded-2xl border border-panelLine bg-cloud px-4 text-sm text-slateDeep outline-none transition focus:border-skyStrong"
            >
              {assignments.map((assignment) => (
                <option key={assignment.id} value={assignment.id}>
                  {assignment.assigneeId} / {assignment.status}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="transfer-next-assignee" className="text-sm font-medium text-slateDeep">
              接手标注员 ID
            </label>
            <input
              id="transfer-next-assignee"
              value={form.nextAssigneeId}
              onChange={(event) => updateField('nextAssigneeId', event.target.value)}
              placeholder="例如：annotator-replacement"
              className="mt-2 h-11 w-full rounded-2xl border border-panelLine bg-cloud px-4 text-sm text-slateDeep outline-none transition focus:border-skyStrong"
            />
          </div>

          <div>
            <label htmlFor="transfer-reason" className="text-sm font-medium text-slateDeep">
              转交原因
            </label>
            <select
              id="transfer-reason"
              value={form.transferReason}
              onChange={(event) =>
                updateField('transferReason', event.target.value as TransferAssignmentInput['transferReason'])
              }
              className="mt-2 h-11 w-full rounded-2xl border border-panelLine bg-cloud px-4 text-sm text-slateDeep outline-none transition focus:border-skyStrong"
            >
              <option value="offboarded">离项</option>
              <option value="leave">请假</option>
              <option value="capacity_rebalance">产能调整</option>
              <option value="rework">返修重分配</option>
              <option value="manual">手动转交</option>
            </select>
          </div>

          <div>
            <label htmlFor="transfer-notes" className="text-sm font-medium text-slateDeep">
              转交备注
            </label>
            <textarea
              id="transfer-notes"
              value={form.notes}
              onChange={(event) => updateField('notes', event.target.value)}
              placeholder="说明离项原因、接手背景或返修上下文"
              className="mt-2 min-h-24 w-full rounded-2xl border border-panelLine bg-cloud px-4 py-3 text-sm text-slateDeep outline-none transition focus:border-skyStrong"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-slateDeep px-5 py-3 text-sm font-medium text-white disabled:opacity-60"
          >
            {submitting ? '转交中...' : '确认转交'}
          </button>

          {error ? <p className="text-sm text-rose-500">{error}</p> : null}
          {message ? <p className="text-sm text-slate-500">{message}</p> : null}
        </form>
      )}
    </ActionCard>
  );
}
