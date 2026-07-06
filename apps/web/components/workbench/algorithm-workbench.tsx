'use client';

import { useEffect, useMemo, useState } from 'react';
import { BatchAcceptanceForm } from '../forms/batch-acceptance-form';
import { ActionCard } from '../ui/action-card';
import type { BatchAcceptance, BatchDelivery, TaskSummary } from '../../lib/types';

export type AlgorithmDeliveryRecord = {
  projectName: string;
  batchId: string;
  batchName: string;
  delivery: BatchDelivery;
  tasks: TaskSummary[];
};

export type AlgorithmAcceptanceRecord = {
  projectName: string;
  batchId: string;
  batchName: string;
  acceptance: BatchAcceptance;
};

export function AlgorithmWorkbench({
  pendingDeliveries,
  recentAcceptances
}: {
  pendingDeliveries: AlgorithmDeliveryRecord[];
  recentAcceptances: AlgorithmAcceptanceRecord[];
}) {
  const [selectedDeliveryId, setSelectedDeliveryId] = useState(
    pendingDeliveries[0]?.delivery.id ?? ''
  );

  useEffect(() => {
    if (!pendingDeliveries.some((record) => record.delivery.id === selectedDeliveryId)) {
      setSelectedDeliveryId(pendingDeliveries[0]?.delivery.id ?? '');
    }
  }, [pendingDeliveries, selectedDeliveryId]);

  const selectedRecord = useMemo(
    () =>
      pendingDeliveries.find((record) => record.delivery.id === selectedDeliveryId) ?? null,
    [pendingDeliveries, selectedDeliveryId]
  );

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="grid gap-6 lg:grid-cols-2">
        <ActionCard title="待验收批次" description="点击交付记录后可在右侧直接完成抽检验收。">
          <div className="space-y-3">
            {pendingDeliveries.length === 0 ? (
              <p className="text-sm text-slate-500">当前没有待验收交付。</p>
            ) : (
              pendingDeliveries.map((record) => {
                const selected = record.delivery.id === selectedDeliveryId;

                return (
                  <button
                    key={record.delivery.id}
                    type="button"
                    onClick={() => setSelectedDeliveryId(record.delivery.id)}
                    className={`block w-full rounded-2xl px-4 py-4 text-left transition ${
                      selected
                        ? 'bg-skySoft ring-1 ring-skyStrong'
                        : 'bg-cloud hover:bg-skySoft'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-slateDeep">{record.batchName}</p>
                      <span className="rounded-full bg-white px-3 py-1 text-xs text-skyStrong">
                        {record.delivery.status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-500">{record.projectName}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      交付人：{record.delivery.submittedBy}
                    </p>
                    {record.delivery.notes ? (
                      <p className="mt-1 text-sm text-slate-500">
                        说明：{record.delivery.notes}
                      </p>
                    ) : null}
                  </button>
                );
              })
            )}
          </div>
        </ActionCard>

        <ActionCard title="最近验收结论" description="回看最近的抽检判定与命中样本。">
          <div className="space-y-3">
            {recentAcceptances.length === 0 ? (
              <p className="text-sm text-slate-500">当前还没有验收记录。</p>
            ) : (
              recentAcceptances.map((record) => (
                <div key={record.acceptance.id} className="rounded-2xl bg-cloud px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-slateDeep">{record.batchName}</p>
                    <span className="rounded-full bg-white px-3 py-1 text-xs text-skyStrong">
                      {record.acceptance.decision}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">{record.projectName}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    抽检题量：{record.acceptance.sampleSize}
                  </p>
                  {record.acceptance.notes ? (
                    <p className="mt-1 text-sm text-slate-500">
                      备注：{record.acceptance.notes}
                    </p>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </ActionCard>
      </div>

      <aside className="space-y-6">
        <ActionCard title="验收概览" description="帮助算法同学快速切换当前待处理批次。">
          <div className="space-y-3 text-sm text-slate-500">
            <p>待验收交付：{pendingDeliveries.length}</p>
            <p>历史验收记录：{recentAcceptances.length}</p>
          </div>
        </ActionCard>

        <ActionCard title="当前验收批次" description="选中交付后可直接完成抽检与验收裁定。">
          {selectedRecord ? (
            <div className="space-y-4">
              <div className="rounded-2xl bg-cloud px-4 py-4">
                <p className="font-medium text-slateDeep">{selectedRecord.batchName}</p>
                <p className="mt-2 text-sm text-slate-500">{selectedRecord.projectName}</p>
                <p className="mt-1 text-sm text-slate-500">
                  待抽检题量：{selectedRecord.tasks.length}
                </p>
              </div>
              <BatchAcceptanceForm
                key={selectedRecord.delivery.id}
                deliveries={[selectedRecord.delivery]}
                tasks={selectedRecord.tasks}
              />
            </div>
          ) : (
            <p className="text-sm text-slate-500">当前没有待验收交付。</p>
          )}
        </ActionCard>
      </aside>
    </div>
  );
}
