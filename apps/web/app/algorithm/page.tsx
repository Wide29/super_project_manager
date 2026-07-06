import Link from 'next/link';
import { AppShell } from '../../components/layout/app-shell';
import { ActionCard } from '../../components/ui/action-card';
import { getWorkflowDeliveriesAndAcceptances } from '../../lib/api/acceptances';

export const dynamic = 'force-dynamic';

export default async function AlgorithmPage() {
  const records = await getWorkflowDeliveriesAndAcceptances();

  const pendingDeliveries = records
    .filter((record) => record.delivery.status === 'submitted' && !record.acceptance)
    .sort((left, right) => right.delivery.submittedAt.localeCompare(left.delivery.submittedAt));

  const recentAcceptances = records
    .filter((record) => record.acceptance)
    .sort((left, right) =>
      (right.acceptance?.reviewedAt ?? '').localeCompare(left.acceptance?.reviewedAt ?? '')
    );

  return (
    <AppShell
      title="算法验收台"
      description="查看待验收交付、抽检入口与最近的验收结论。"
      rightSlot={
        <div className="space-y-6">
          <ActionCard title="验收概览" description="帮助算法同学快速切换到当前需要处理的批次。">
            <div className="space-y-3 text-sm text-slate-500">
              <p>待验收交付：{pendingDeliveries.length}</p>
              <p>历史验收记录：{recentAcceptances.length}</p>
            </div>
          </ActionCard>
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <ActionCard title="待验收批次" description="点击进入批次详情页发起抽检与验收。">
          <div className="space-y-3">
            {pendingDeliveries.length === 0 ? (
              <p className="text-sm text-slate-500">当前没有待验收交付。</p>
            ) : (
              pendingDeliveries.map(({ project, batch, delivery }) => (
                <Link
                  key={delivery.id}
                  href={`/batches/${batch.id}`}
                  className="block rounded-2xl bg-cloud px-4 py-4 transition hover:bg-skySoft"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-slateDeep">{batch.name}</p>
                    <span className="rounded-full bg-white px-3 py-1 text-xs text-skyStrong">
                      {delivery.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">{project.name}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    交付人：{delivery.submittedBy}
                  </p>
                  {delivery.notes ? (
                    <p className="mt-1 text-sm text-slate-500">说明：{delivery.notes}</p>
                  ) : null}
                </Link>
              ))
            )}
          </div>
        </ActionCard>

        <ActionCard title="最近验收结论" description="回看最近的抽检判定与问题记录。">
          <div className="space-y-3">
            {recentAcceptances.length === 0 ? (
              <p className="text-sm text-slate-500">当前还没有验收记录。</p>
            ) : (
              recentAcceptances.map(({ project, batch, acceptance }) => (
                <Link
                  key={acceptance?.id}
                  href={`/batches/${batch.id}`}
                  className="block rounded-2xl bg-cloud px-4 py-4 transition hover:bg-skySoft"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-slateDeep">{batch.name}</p>
                    <span className="rounded-full bg-white px-3 py-1 text-xs text-skyStrong">
                      {acceptance?.decision}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">{project.name}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    抽检题量：{acceptance?.sampleSize}
                  </p>
                  {acceptance?.notes ? (
                    <p className="mt-1 text-sm text-slate-500">备注：{acceptance.notes}</p>
                  ) : null}
                </Link>
              ))
            )}
          </div>
        </ActionCard>
      </div>
    </AppShell>
  );
}
