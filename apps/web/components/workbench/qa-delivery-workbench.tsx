'use client';

import { useEffect, useMemo, useState } from 'react';
import { WorkbenchAgentCard } from '../ai/workbench-agent-card';
import { BatchDeliveryForm } from '../forms/batch-delivery-form';
import { TaskReviewForm } from '../forms/task-review-form';
import { getTaskSuggestion } from '../../lib/api/ai';
import { ActionCard } from '../ui/action-card';

export type QaTaskRecord = {
  taskId: string;
  batchId: string;
  title: string;
  status: string;
  inputPayload: Record<string, unknown>;
  projectName: string;
  batchName: string;
};

export type DeliverableBatchRecord = {
  batchId: string;
  batchName: string;
  batchStatus: string;
  projectName: string;
  readyTaskCount: number;
};

export function QaDeliveryWorkbench({
  pendingQaTasks,
  reworkTasks,
  deliverableBatches
}: {
  pendingQaTasks: QaTaskRecord[];
  reworkTasks: QaTaskRecord[];
  deliverableBatches: DeliverableBatchRecord[];
}) {
  const [selectedTaskId, setSelectedTaskId] = useState(pendingQaTasks[0]?.taskId ?? '');
  const [selectedBatchId, setSelectedBatchId] = useState(deliverableBatches[0]?.batchId ?? '');
  const [qaDraft, setQaDraft] = useState('');

  useEffect(() => {
    if (!pendingQaTasks.some((task) => task.taskId === selectedTaskId)) {
      setSelectedTaskId(pendingQaTasks[0]?.taskId ?? '');
    }
  }, [pendingQaTasks, selectedTaskId]);

  useEffect(() => {
    if (!deliverableBatches.some((batch) => batch.batchId === selectedBatchId)) {
      setSelectedBatchId(deliverableBatches[0]?.batchId ?? '');
    }
  }, [deliverableBatches, selectedBatchId]);

  useEffect(() => {
    setQaDraft('');
  }, [selectedTaskId]);

  const selectedTask = useMemo(
    () => pendingQaTasks.find((task) => task.taskId === selectedTaskId) ?? null,
    [pendingQaTasks, selectedTaskId]
  );
  const selectedBatch = useMemo(
    () => deliverableBatches.find((batch) => batch.batchId === selectedBatchId) ?? null,
    [deliverableBatches, selectedBatchId]
  );

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="grid gap-6 lg:grid-cols-2">
        <ActionCard title="待质检题目" description="点击题目后可在右侧直接提交 QA 结论。">
          <div className="space-y-3">
            {pendingQaTasks.length === 0 ? (
              <p className="text-sm text-slate-500">当前没有待质检题目。</p>
            ) : (
              pendingQaTasks.map((task) => {
                const selected = task.taskId === selectedTaskId;

                return (
                  <button
                    key={task.taskId}
                    type="button"
                    onClick={() => setSelectedTaskId(task.taskId)}
                    className={`block w-full rounded-2xl px-4 py-4 text-left transition ${
                      selected
                        ? 'bg-skySoft ring-1 ring-skyStrong'
                        : 'bg-cloud hover:bg-skySoft'
                    }`}
                  >
                    <p className="font-medium text-slateDeep">{task.title}</p>
                    <p className="mt-2 text-sm text-slate-500">
                      {task.projectName} / {task.batchName}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </ActionCard>

        <ActionCard title="返修题目" description="聚合质检打回与抽检打回题目，方便回看问题面。">
          <div className="space-y-3">
            {reworkTasks.length === 0 ? (
              <p className="text-sm text-slate-500">当前没有返修题目。</p>
            ) : (
              reworkTasks.map((task) => (
                <div key={task.taskId} className="rounded-2xl bg-cloud px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-slateDeep">{task.title}</p>
                    <span className="rounded-full bg-white px-3 py-1 text-xs text-skyStrong">
                      {task.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">
                    {task.projectName} / {task.batchName}
                  </p>
                </div>
              ))
            )}
          </div>
        </ActionCard>

        <ActionCard title="可交付批次" description="点击批次后可在右侧直接发起交付。">
          <div className="space-y-3">
            {deliverableBatches.length === 0 ? (
              <p className="text-sm text-slate-500">当前没有可交付批次。</p>
            ) : (
              deliverableBatches.map((batch) => {
                const selected = batch.batchId === selectedBatchId;

                return (
                  <button
                    key={batch.batchId}
                    type="button"
                    onClick={() => setSelectedBatchId(batch.batchId)}
                    className={`block w-full rounded-2xl px-4 py-4 text-left transition ${
                      selected
                        ? 'bg-skySoft ring-1 ring-skyStrong'
                        : 'bg-cloud hover:bg-skySoft'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-slateDeep">{batch.batchName}</p>
                      <span className="rounded-full bg-white px-3 py-1 text-xs text-skyStrong">
                        {batch.batchStatus}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-500">{batch.projectName}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      可交付题量：{batch.readyTaskCount}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </ActionCard>
      </div>

      <aside className="space-y-6">
        <ActionCard title="今日视图" description="快速查看当前角色待办量。">
          <div className="space-y-3 text-sm text-slate-500">
            <p>待质检题目：{pendingQaTasks.length}</p>
            <p>返修题目：{reworkTasks.length}</p>
            <p>可交付批次：{deliverableBatches.length}</p>
          </div>
        </ActionCard>

        <ActionCard title="当前质检题目" description="选中题目后可直接提交通过或打回。">
          {selectedTask ? (
            <div className="space-y-4">
              <div className="rounded-2xl bg-cloud px-4 py-4">
                <p className="font-medium text-slateDeep">{selectedTask.title}</p>
                <p className="mt-2 text-sm text-slate-500">
                  {selectedTask.projectName} / {selectedTask.batchName}
                </p>
                <pre className="mt-4 overflow-x-auto rounded-2xl bg-white p-4 text-xs leading-6 text-slate-500">
                  {JSON.stringify(selectedTask.inputPayload, null, 2)}
                </pre>
              </div>
              <WorkbenchAgentCard
                title="AI 质检助手"
                description="为当前题目生成风险提示、结论倾向和备注草稿。"
                actionLabel="生成质检建议"
                loadingLabel="生成中..."
                emptyHint="选择题目后可生成 AI 质检建议。"
                disabled={!selectedTask}
                onGenerate={async () => {
                  const result = await getTaskSuggestion(
                    selectedTask.taskId,
                    '请基于题目内容输出中文质检建议，包含：风险点、通过/打回倾向提示、可直接使用的质检备注草稿。请明确说明建议仅供人工参考。'
                  );

                  return result.suggestion;
                }}
                onInsert={(draft) => setQaDraft(draft)}
                insertLabel="填入质检备注"
              />
              <TaskReviewForm
                key={selectedTask.taskId}
                taskId={selectedTask.taskId}
                externalNotesDraft={qaDraft}
              />
            </div>
          ) : (
            <p className="text-sm text-slate-500">请选择一条待质检题目。</p>
          )}
        </ActionCard>

        <ActionCard title="当前交付批次" description="选中批次后可直接发起算法侧交付。">
          {selectedBatch ? (
            <div className="space-y-4">
              <div className="rounded-2xl bg-cloud px-4 py-4">
                <p className="font-medium text-slateDeep">{selectedBatch.batchName}</p>
                <p className="mt-2 text-sm text-slate-500">{selectedBatch.projectName}</p>
                <p className="mt-1 text-sm text-slate-500">
                  可交付题量：{selectedBatch.readyTaskCount}
                </p>
              </div>
              <BatchDeliveryForm key={selectedBatch.batchId} batchId={selectedBatch.batchId} />
            </div>
          ) : (
            <p className="text-sm text-slate-500">当前没有可交付批次。</p>
          )}
        </ActionCard>
      </aside>
    </div>
  );
}
