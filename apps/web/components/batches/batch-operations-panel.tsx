'use client';

import { useMemo, useState } from 'react';
import type { BatchAcceptance, BatchDelivery, TaskSummary } from '../../lib/types';
import { AcceptancePanel } from '../acceptances/acceptance-panel';
import { BatchAcceptanceForm } from '../forms/batch-acceptance-form';
import { BatchDeliveryForm } from '../forms/batch-delivery-form';
import { TaskCreateForm } from '../forms/task-create-form';
import { TaskImportForm } from '../forms/task-import-form';
import { DeliveryPanel } from '../deliveries/delivery-panel';

export function BatchOperationsPanel({
  batchId,
  tasks,
  initialDeliveries,
  initialAcceptances
}: {
  batchId: string;
  tasks: TaskSummary[];
  initialDeliveries: BatchDelivery[];
  initialAcceptances: BatchAcceptance[];
}) {
  const [deliveries, setDeliveries] = useState(initialDeliveries);
  const [acceptances, setAcceptances] = useState(initialAcceptances);

  const acceptanceDecisionByDeliveryId = useMemo(
    () =>
      new Map(
        acceptances.map((acceptance) => [acceptance.deliveryId, acceptance.decision] as const)
      ),
    [acceptances]
  );

  function handleDeliveryCreated(delivery: BatchDelivery) {
    setDeliveries((current) => [
      delivery,
      ...current.map((item) =>
        item.status === 'submitted' ? { ...item, status: 'superseded' as const } : item
      )
    ]);
  }

  function handleAcceptanceCreated(acceptance: BatchAcceptance) {
    setAcceptances((current) => [acceptance, ...current]);
    setDeliveries((current) =>
      current.map((delivery) =>
        delivery.id === acceptance.deliveryId ? { ...delivery, status: 'superseded' as const } : delivery
      )
    );
  }

  const deliveriesForForm = deliveries.filter(
    (delivery) => !acceptanceDecisionByDeliveryId.has(delivery.id) && delivery.status === 'submitted'
  );

  return (
    <div className="space-y-6">
      <TaskCreateForm batchId={batchId} />
      <TaskImportForm batchId={batchId} />
      <BatchDeliveryForm batchId={batchId} onCreated={handleDeliveryCreated} />
      <DeliveryPanel deliveries={deliveries} />
      <BatchAcceptanceForm
        deliveries={deliveriesForForm}
        tasks={tasks}
        onCreated={handleAcceptanceCreated}
      />
      <AcceptancePanel acceptances={acceptances} />
    </div>
  );
}
