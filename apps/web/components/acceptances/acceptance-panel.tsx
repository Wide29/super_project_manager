import type { BatchAcceptance } from '../../lib/types';
import { ActionCard } from '../ui/action-card';

export function AcceptancePanel({ acceptances }: { acceptances: BatchAcceptance[] }) {
  return (
    <ActionCard title="验收记录" description="查看算法抽检结论与命中样本。">
      <div className="space-y-4">
        {acceptances.length === 0 ? (
          <p className="text-sm text-slate-500">当前还没有验收记录。</p>
        ) : null}

        {acceptances.map((acceptance) => (
          <div key={acceptance.id} className="rounded-2xl bg-cloud px-4 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-medium text-slateDeep">{acceptance.reviewedBy}</p>
              <span className="rounded-full bg-white px-3 py-1 text-xs text-skyStrong">
                {acceptance.decision}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-500">抽检题量：{acceptance.sampleSize}</p>
            <p className="mt-1 text-sm text-slate-500">
              时间：{new Date(acceptance.reviewedAt).toLocaleString('zh-CN')}
            </p>
            {acceptance.notes ? (
              <p className="mt-3 text-sm text-slate-500">备注：{acceptance.notes}</p>
            ) : null}
            {acceptance.reviews.length > 0 ? (
              <div className="mt-4 space-y-2">
                {acceptance.reviews.map((review) => (
                  <p key={review.id} className="text-sm text-slate-500">
                    抽检题 {review.taskItemId}：{review.decision}
                  </p>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </ActionCard>
  );
}
