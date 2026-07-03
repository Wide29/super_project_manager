'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createBatchAcceptance } from '../../lib/api/acceptances';
import type {
  BatchAcceptance,
  BatchDelivery,
  CreateBatchAcceptanceInput,
  TaskSummary
} from '../../lib/types';
import { ActionCard } from '../ui/action-card';

type BatchAcceptanceFormState = {
  deliveryId: string;
  reviewedBy: string;
  decision: CreateBatchAcceptanceInput['decision'];
  notes: string;
  sampledTaskIds: string[];
  rejectedTaskIds: string[];
};

function createInitialForm(deliveries: BatchDelivery[]): BatchAcceptanceFormState {
  return {
    deliveryId: deliveries[0]?.id ?? '',
    reviewedBy: 'algo-1',
    decision: 'accepted',
    notes: '',
    sampledTaskIds: [],
    rejectedTaskIds: []
  };
}

export function BatchAcceptanceForm({
  deliveries,
  tasks,
  onCreated
}: {
  deliveries: BatchDelivery[];
  tasks: TaskSummary[];
  onCreated?: (acceptance: BatchAcceptance) => void;
}) {
  const router = useRouter();
  const [form, setForm] = useState<BatchAcceptanceFormState>(createInitialForm(deliveries));
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const availableDeliveries = deliveries.filter((delivery) => delivery.status === 'submitted');

  useEffect(() => {
    if (availableDeliveries.length === 0) {
      setForm(createInitialForm(deliveries));
      return;
    }

    setForm((current) => {
      if (availableDeliveries.some((delivery) => delivery.id === current.deliveryId)) {
        return current;
      }

      return {
        ...current,
        deliveryId: availableDeliveries[0].id,
        sampledTaskIds: [],
        rejectedTaskIds: []
      };
    });
  }, [deliveries, availableDeliveries]);

  function updateField<K extends keyof BatchAcceptanceFormState>(
    key: K,
    value: BatchAcceptanceFormState[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
    if (error) {
      setError('');
    }
  }

  function toggleTask(target: 'sampledTaskIds' | 'rejectedTaskIds', taskId: string) {
    setForm((current) => {
      const exists = current[target].includes(taskId);
      const nextValues = exists
        ? current[target].filter((item) => item !== taskId)
        : [...current[target], taskId];

      const nextState: BatchAcceptanceFormState = {
        ...current,
        [target]: nextValues
      };

      if (target === 'sampledTaskIds' && exists) {
        nextState.rejectedTaskIds = current.rejectedTaskIds.filter((item) => item !== taskId);
      }

      return nextState;
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.deliveryId) {
      setError('当前没有可验收的交付记录。');
      return;
    }

    if (!form.reviewedBy.trim()) {
      setError('请先填写验收人 ID。');
      return;
    }

    if (form.sampledTaskIds.length === 0) {
      setError('请至少勾选一道抽检题目。');
      return;
    }

    setSubmitting(true);
    setError('');
    setMessage('');

    try {
      const acceptance = await createBatchAcceptance(form.deliveryId, {
        reviewedBy: form.reviewedBy.trim(),
        decision: form.decision,
        sampleSize: form.sampledTaskIds.length,
        sampledTaskIds: form.sampledTaskIds,
        rejectedTaskIds: form.rejectedTaskIds,
        notes: form.notes.trim() || undefined
      });
      onCreated?.(acceptance);
      setForm(createInitialForm(deliveries));
      setMessage('算法验收结果已保存。');
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '保存验收结果失败');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ActionCard title="算法验收" description="记录抽检题目与最终验收结论。">
      {availableDeliveries.length === 0 ? (
        <p className="text-sm text-slate-500">请先发起交付，再进行算法验收。</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="acceptance-delivery-id" className="text-sm font-medium text-slateDeep">
              待验收交付
            </label>
            <select
              id="acceptance-delivery-id"
              value={form.deliveryId}
              onChange={(event) => updateField('deliveryId', event.target.value)}
              className="mt-2 h-11 w-full rounded-2xl border border-panelLine bg-cloud px-4 text-sm text-slateDeep outline-none transition focus:border-skyStrong"
            >
              {availableDeliveries.map((delivery) => (
                <option key={delivery.id} value={delivery.id}>
                  {delivery.submittedBy} / {new Date(delivery.submittedAt).toLocaleString('zh-CN')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="acceptance-reviewed-by" className="text-sm font-medium text-slateDeep">
              验收人 ID
            </label>
            <input
              id="acceptance-reviewed-by"
              value={form.reviewedBy}
              onChange={(event) => updateField('reviewedBy', event.target.value)}
              className="mt-2 h-11 w-full rounded-2xl border border-panelLine bg-cloud px-4 text-sm text-slateDeep outline-none transition focus:border-skyStrong"
            />
          </div>

          <div>
            <label htmlFor="acceptance-decision" className="text-sm font-medium text-slateDeep">
              验收结论
            </label>
            <select
              id="acceptance-decision"
              value={form.decision}
              onChange={(event) =>
                updateField('decision', event.target.value as BatchAcceptanceFormState['decision'])
              }
              className="mt-2 h-11 w-full rounded-2xl border border-panelLine bg-cloud px-4 text-sm text-slateDeep outline-none transition focus:border-skyStrong"
            >
              <option value="accepted">accepted</option>
              <option value="partially_rejected">partially_rejected</option>
              <option value="rejected">rejected</option>
            </select>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-slateDeep">抽检题目</p>
            {tasks.map((task) => (
              <label key={task.id} className="flex items-center gap-3 rounded-2xl bg-cloud px-4 py-3">
                <input
                  type="checkbox"
                  aria-label={`抽检题目 ${task.title}`}
                  checked={form.sampledTaskIds.includes(task.id)}
                  onChange={() => toggleTask('sampledTaskIds', task.id)}
                />
                <span className="text-sm text-slateDeep">{task.title}</span>
              </label>
            ))}
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-slateDeep">打回题目</p>
            {tasks
              .filter((task) => form.sampledTaskIds.includes(task.id))
              .map((task) => (
                <label key={task.id} className="flex items-center gap-3 rounded-2xl bg-cloud px-4 py-3">
                  <input
                    type="checkbox"
                    aria-label={`打回题目 ${task.title}`}
                    checked={form.rejectedTaskIds.includes(task.id)}
                    onChange={() => toggleTask('rejectedTaskIds', task.id)}
                  />
                  <span className="text-sm text-slateDeep">{task.title}</span>
                </label>
              ))}
          </div>

          <div>
            <label htmlFor="acceptance-notes" className="text-sm font-medium text-slateDeep">
              验收备注
            </label>
            <textarea
              id="acceptance-notes"
              value={form.notes}
              onChange={(event) => updateField('notes', event.target.value)}
              placeholder="说明抽检原因、问题模式或通过依据"
              className="mt-2 min-h-24 w-full rounded-2xl border border-panelLine bg-cloud px-4 py-3 text-sm text-slateDeep outline-none transition focus:border-skyStrong"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-slateDeep px-5 py-3 text-sm font-medium text-white disabled:opacity-60"
          >
            {submitting ? '提交中...' : '提交验收'}
          </button>

          {error ? <p className="text-sm text-rose-500">{error}</p> : null}
          {message ? <p className="text-sm text-slate-500">{message}</p> : null}
        </form>
      )}
    </ActionCard>
  );
}
