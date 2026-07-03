'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createBatchDelivery } from '../../lib/api/deliveries';
import type { BatchDelivery } from '../../lib/types';
import { ActionCard } from '../ui/action-card';

export function BatchDeliveryForm({
  batchId,
  onCreated
}: {
  batchId: string;
  onCreated?: (delivery: BatchDelivery) => void;
}) {
  const router = useRouter();
  const [submittedBy, setSubmittedBy] = useState('ops-1');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!submittedBy.trim()) {
      setError('请先填写交付人 ID。');
      return;
    }

    setSubmitting(true);
    setError('');
    setMessage('');

    try {
      const delivery = await createBatchDelivery(batchId, {
        submittedBy: submittedBy.trim(),
        notes: notes.trim() || undefined
      });
      onCreated?.(delivery);
      setMessage('批次已发起交付，右侧记录已刷新。');
      setNotes('');
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '发起交付失败');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ActionCard title="发起交付" description="把当前批次提交给算法侧做抽检验收。">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="delivery-submitted-by" className="text-sm font-medium text-slateDeep">
            交付人 ID
          </label>
          <input
            id="delivery-submitted-by"
            value={submittedBy}
            onChange={(event) => setSubmittedBy(event.target.value)}
            className="mt-2 h-11 w-full rounded-2xl border border-panelLine bg-cloud px-4 text-sm text-slateDeep outline-none transition focus:border-skyStrong"
          />
        </div>

        <div>
          <label htmlFor="delivery-notes" className="text-sm font-medium text-slateDeep">
            交付说明
          </label>
          <textarea
            id="delivery-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="补充交付范围、风险提醒或批次说明"
            className="mt-2 min-h-24 w-full rounded-2xl border border-panelLine bg-cloud px-4 py-3 text-sm text-slateDeep outline-none transition focus:border-skyStrong"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-skyStrong px-5 py-3 text-sm font-medium text-white disabled:opacity-60"
        >
          {submitting ? '提交中...' : '确认交付'}
        </button>

        {error ? <p className="text-sm text-rose-500">{error}</p> : null}
        {message ? <p className="text-sm text-slate-500">{message}</p> : null}
      </form>
    </ActionCard>
  );
}
