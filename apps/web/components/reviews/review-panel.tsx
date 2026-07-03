import type { TaskReview } from '../../lib/types';
import { ActionCard } from '../ui/action-card';

export function ReviewPanel({ reviews }: { reviews: TaskReview[] }) {
  return (
    <ActionCard title="质检记录" description="查看题目的 QA 轨迹与结论。">
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <p className="text-sm text-slate-500">当前还没有质检记录。</p>
        ) : null}

        {reviews.map((review) => (
          <div key={review.id} className="rounded-2xl bg-cloud px-4 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-medium text-slateDeep">{review.reviewerId}</p>
              <span className="rounded-full bg-white px-3 py-1 text-xs text-skyStrong">
                {review.decision}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-500">阶段：{review.stage}</p>
            <p className="mt-1 text-sm text-slate-500">
              时间：{new Date(review.createdAt).toLocaleString('zh-CN')}
            </p>
            {review.notes ? (
              <p className="mt-3 text-sm text-slate-500">备注：{review.notes}</p>
            ) : null}
          </div>
        ))}
      </div>
    </ActionCard>
  );
}
