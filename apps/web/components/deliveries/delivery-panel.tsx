import type { BatchDelivery } from '../../lib/types';
import { ActionCard } from '../ui/action-card';

export function DeliveryPanel({ deliveries }: { deliveries: BatchDelivery[] }) {
  return (
    <ActionCard title="交付记录" description="查看批次的交付历史与当前有效交付。">
      <div className="space-y-4">
        {deliveries.length === 0 ? (
          <p className="text-sm text-slate-500">当前还没有交付记录。</p>
        ) : null}

        {deliveries.map((delivery) => (
          <div key={delivery.id} className="rounded-2xl bg-cloud px-4 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-medium text-slateDeep">{delivery.submittedBy}</p>
              <span className="rounded-full bg-white px-3 py-1 text-xs text-skyStrong">
                {delivery.status}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              时间：{new Date(delivery.submittedAt).toLocaleString('zh-CN')}
            </p>
            {delivery.notes ? (
              <p className="mt-3 text-sm text-slate-500">说明：{delivery.notes}</p>
            ) : null}
          </div>
        ))}
      </div>
    </ActionCard>
  );
}
