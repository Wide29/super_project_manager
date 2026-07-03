import type { TaskAssignment, TaskSettlement } from '../../lib/types';
import { ActionCard } from '../ui/action-card';

function getAssignmentLabel(assignmentId: string, assignments: TaskAssignment[]) {
  const assignment = assignments.find((item) => item.id === assignmentId);
  return assignment ? `${assignment.assigneeId} / ${assignment.status}` : assignmentId;
}

export function SettlementPanel({
  settlement,
  assignments
}: {
  settlement: TaskSettlement | null;
  assignments: TaskAssignment[];
}) {
  return (
    <ActionCard title="当前结算结果" description="展示这道题最新生效的归属裁定。">
      {!settlement ? (
        <p className="text-sm text-slate-500">当前还没有结算裁定。</p>
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl bg-cloud px-4 py-4">
            <p className="font-medium text-slateDeep">模式：{settlement.decisionMode}</p>
            <p className="mt-2 text-sm text-slate-500">裁定人：{settlement.decidedBy}</p>
            <p className="mt-1 text-sm text-slate-500">
              更新时间：{new Date(settlement.updatedAt).toLocaleString('zh-CN')}
            </p>
            {settlement.notes ? (
              <p className="mt-3 text-sm text-slate-500">备注：{settlement.notes}</p>
            ) : null}
          </div>

          {settlement.shares.length > 0 ? (
            <div className="space-y-3">
              {settlement.shares.map((share) => (
                <div key={share.id} className="rounded-2xl border border-panelLine px-4 py-4">
                  <p className="font-medium text-slateDeep">
                    {getAssignmentLabel(share.assignmentId, assignments)}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">比例：{share.percentage}%</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </ActionCard>
  );
}
