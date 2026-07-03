'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { createTaskSettlement } from '../../lib/api/settlements';
import type { CreateTaskSettlementInput, TaskAssignment } from '../../lib/types';
import { ActionCard } from '../ui/action-card';

type TaskSettlementFormState = {
  decisionMode: CreateTaskSettlementInput['decisionMode'];
  ownerAssignmentId: string;
  decidedBy: string;
  decidedByRole: CreateTaskSettlementInput['decidedByRole'];
  notes: string;
  sharesText: string;
};

function createInitialShares(assignments: TaskAssignment[]) {
  const seedAssignments = assignments.slice(0, 2);
  if (seedAssignments.length === 0) {
    return '[]';
  }

  const basePercentage = Math.floor(100 / seedAssignments.length);
  const remainder = 100 - basePercentage * seedAssignments.length;

  return JSON.stringify(
    seedAssignments.map((assignment, index) => ({
      assignmentId: assignment.id,
      percentage: basePercentage + (index === 0 ? remainder : 0)
    })),
    null,
    2
  );
}

function createInitialForm(assignments: TaskAssignment[]): TaskSettlementFormState {
  return {
    decisionMode: 'single_owner',
    ownerAssignmentId: assignments[0]?.id ?? '',
    decidedBy: '',
    decidedByRole: 'operations',
    notes: '',
    sharesText: createInitialShares(assignments)
  };
}

export function TaskSettlementForm({ taskId, assignments }: { taskId: string; assignments: TaskAssignment[] }) {
  const router = useRouter();
  const initialForm = useMemo(() => createInitialForm(assignments), [assignments]);
  const [form, setForm] = useState<TaskSettlementFormState>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  function updateField<K extends keyof TaskSettlementFormState>(
    key: K,
    value: TaskSettlementFormState[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
    if (error) {
      setError('');
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.decidedBy.trim()) {
      setError('请先填写裁定人 ID。');
      return;
    }

    if (assignments.length === 0) {
      setError('当前任务还没有执行记录，无法裁定结算。');
      return;
    }

    const payload: CreateTaskSettlementInput = {
      decisionMode: form.decisionMode,
      decidedBy: form.decidedBy.trim(),
      decidedByRole: form.decidedByRole,
      notes: form.notes.trim() || undefined
    };

    if (form.decisionMode === 'single_owner') {
      if (!form.ownerAssignmentId) {
        setError('请选择归属执行记录。');
        return;
      }

      payload.ownerAssignmentId = form.ownerAssignmentId;
    } else {
      try {
        const parsed = JSON.parse(form.sharesText) as unknown;
        if (!Array.isArray(parsed) || parsed.length === 0) {
          throw new Error('请输入至少一条拆分比例。');
        }
        payload.shares = parsed as CreateTaskSettlementInput['shares'];
      } catch (parseError) {
        setError(parseError instanceof Error ? parseError.message : '拆分 JSON 解析失败。');
        return;
      }
    }

    setSubmitting(true);
    setError('');
    setMessage('');

    try {
      await createTaskSettlement(taskId, payload);
      setForm(createInitialForm(assignments));
      setMessage('结算裁定已保存。');
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '保存结算裁定失败');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ActionCard title="结算裁定" description="为当前任务指定单归属或拆分归属。">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="settlement-decision-mode" className="text-sm font-medium text-slateDeep">
            裁定模式
          </label>
          <select
            id="settlement-decision-mode"
            value={form.decisionMode}
            onChange={(event) =>
              updateField('decisionMode', event.target.value as TaskSettlementFormState['decisionMode'])
            }
            className="mt-2 h-11 w-full rounded-2xl border border-panelLine bg-cloud px-4 text-sm text-slateDeep outline-none transition focus:border-skyStrong"
          >
            <option value="single_owner">单人归属</option>
            <option value="split">拆分归属</option>
          </select>
        </div>

        <div>
          <label htmlFor="settlement-decided-by" className="text-sm font-medium text-slateDeep">
            裁定人 ID
          </label>
          <input
            id="settlement-decided-by"
            value={form.decidedBy}
            onChange={(event) => updateField('decidedBy', event.target.value)}
            placeholder="例如：ops-1"
            className="mt-2 h-11 w-full rounded-2xl border border-panelLine bg-cloud px-4 text-sm text-slateDeep outline-none transition focus:border-skyStrong"
          />
        </div>

        <div>
          <label htmlFor="settlement-decider-role" className="text-sm font-medium text-slateDeep">
            裁定角色
          </label>
          <select
            id="settlement-decider-role"
            value={form.decidedByRole}
            onChange={(event) =>
              updateField(
                'decidedByRole',
                event.target.value as TaskSettlementFormState['decidedByRole']
              )
            }
            className="mt-2 h-11 w-full rounded-2xl border border-panelLine bg-cloud px-4 text-sm text-slateDeep outline-none transition focus:border-skyStrong"
          >
            <option value="operations">运营</option>
            <option value="project_manager">项目经理</option>
          </select>
        </div>

        {form.decisionMode === 'single_owner' ? (
          <div>
            <label htmlFor="settlement-owner-assignment" className="text-sm font-medium text-slateDeep">
              归属执行记录
            </label>
            <select
              id="settlement-owner-assignment"
              value={form.ownerAssignmentId}
              onChange={(event) => updateField('ownerAssignmentId', event.target.value)}
              className="mt-2 h-11 w-full rounded-2xl border border-panelLine bg-cloud px-4 text-sm text-slateDeep outline-none transition focus:border-skyStrong"
            >
              {assignments.map((assignment) => (
                <option key={assignment.id} value={assignment.id}>
                  {assignment.assigneeId} / {assignment.status}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div>
            <label htmlFor="settlement-shares" className="text-sm font-medium text-slateDeep">
              拆分比例 JSON
            </label>
            <textarea
              id="settlement-shares"
              value={form.sharesText}
              onChange={(event) => updateField('sharesText', event.target.value)}
              className="mt-2 min-h-40 w-full rounded-2xl border border-panelLine bg-cloud px-4 py-3 font-mono text-sm text-slateDeep outline-none transition focus:border-skyStrong"
            />
          </div>
        )}

        <div>
          <label htmlFor="settlement-notes" className="text-sm font-medium text-slateDeep">
            裁定备注
          </label>
          <textarea
            id="settlement-notes"
            value={form.notes}
            onChange={(event) => updateField('notes', event.target.value)}
            placeholder="说明归属依据、代标背景或拆分原因"
            className="mt-2 min-h-24 w-full rounded-2xl border border-panelLine bg-cloud px-4 py-3 text-sm text-slateDeep outline-none transition focus:border-skyStrong"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-slateDeep px-5 py-3 text-sm font-medium text-white disabled:opacity-60"
        >
          {submitting ? '保存中...' : '保存裁定'}
        </button>

        {error ? <p className="text-sm text-rose-500">{error}</p> : null}
        {message ? <p className="text-sm text-slate-500">{message}</p> : null}
      </form>
    </ActionCard>
  );
}
