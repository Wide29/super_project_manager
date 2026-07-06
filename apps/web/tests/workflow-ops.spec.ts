import { expect, test } from '@playwright/test';

test('侧边栏可进入质检交付台与算法验收台', async ({ page, request }) => {
  const projectResponse = await request.post('http://localhost:3000/projects', {
    data: {
      name: `Ops 项目 ${Date.now()}`,
      taskType: 'text'
    }
  });
  expect(projectResponse.ok()).toBeTruthy();
  const project = await projectResponse.json();

  const batchResponse = await request.post(`http://localhost:3000/projects/${project.id}/batches`, {
    data: {
      name: `Ops 批次 ${Date.now()}`,
      plannedTaskCount: 3
    }
  });
  expect(batchResponse.ok()).toBeTruthy();
  const batch = await batchResponse.json();

  const pendingQaTitle = `待质检题目 ${Date.now()}`;
  const reworkTitle = `返修题目 ${Date.now()}`;
  const deliverableTitle = `可交付题目 ${Date.now()}`;

  for (const payload of [
    { title: pendingQaTitle, status: 'submitted' },
    { title: reworkTitle, status: 'qa_rejected' },
    { title: deliverableTitle, status: 'qa_passed' }
  ]) {
    const taskResponse = await request.post(`http://localhost:3000/batches/${batch.id}/tasks`, {
      data: {
        title: payload.title,
        status: payload.status,
        inputPayload: {
          question: payload.title
        }
      }
    });
    expect(taskResponse.ok()).toBeTruthy();
  }

  const deliveryResponse = await request.post(`http://localhost:3000/batches/${batch.id}/deliveries`, {
    data: {
      submittedBy: 'ops-1',
      notes: '待算法抽检的交付批次'
    }
  });
  expect(deliveryResponse.ok()).toBeTruthy();

  await page.goto('/projects');
  await page.getByRole('link', { name: '质检交付台' }).click();
  await expect(page.getByRole('heading', { name: '质检交付台', exact: true })).toBeVisible();
  await expect(
    page.getByRole('button', { name: new RegExp(`${pendingQaTitle}.*${project.name}`) })
  ).toBeVisible();
  await expect(page.getByText(reworkTitle).first()).toBeVisible();

  await page.getByRole('link', { name: '算法验收台' }).click();
  await expect(page.getByRole('heading', { name: '算法验收台', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: new RegExp(batch.name) }).first()).toBeVisible();
  await expect(page.getByText('待算法抽检的交付批次').first()).toBeVisible();
});

test('角色工作台支持直接质检、交付与算法验收', async ({ page, request }) => {
  const projectResponse = await request.post('http://localhost:3000/projects', {
    data: {
      name: `Workbench 项目 ${Date.now()}`,
      taskType: 'text'
    }
  });
  expect(projectResponse.ok()).toBeTruthy();
  const project = await projectResponse.json();

  const batchResponse = await request.post(`http://localhost:3000/projects/${project.id}/batches`, {
    data: {
      name: `Workbench 批次 ${Date.now()}`,
      plannedTaskCount: 2
    }
  });
  expect(batchResponse.ok()).toBeTruthy();
  const batch = await batchResponse.json();

  const reviewTaskTitle = `工作台待质检题 ${Date.now()}`;
  const readyTaskTitle = `工作台可交付题 ${Date.now()}`;
  const deliveryNote = `工作台直接发起交付 ${Date.now()}`;
  const acceptanceNote = `工作台直接完成验收 ${Date.now()}`;

  for (const payload of [
    { title: reviewTaskTitle, status: 'submitted' },
    { title: readyTaskTitle, status: 'qa_passed' }
  ]) {
    const taskResponse = await request.post(`http://localhost:3000/batches/${batch.id}/tasks`, {
      data: {
        title: payload.title,
        status: payload.status,
        inputPayload: {
          question: payload.title
        }
      }
    });
    expect(taskResponse.ok()).toBeTruthy();
  }

  await page.goto('/qa-delivery');
  await expect(page.getByRole('heading', { name: '质检交付台', exact: true })).toBeVisible();
  await expect(
    page.getByRole('button', { name: new RegExp(`${reviewTaskTitle}.*${project.name}`) })
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: '当前质检题目', exact: true })).toBeVisible();
  await page.getByLabel('质检员 ID').fill('qa-workbench');
  await page.getByLabel('质检备注').fill('工作台直接质检通过');
  await page.getByRole('button', { name: '提交质检' }).click();
  await expect(page.getByText('质检记录已创建，页面已刷新。')).toBeVisible();

  await expect(page.getByRole('button', { name: new RegExp(batch.name) }).first()).toBeVisible();
  await page.getByLabel('交付说明').fill(deliveryNote);
  await page.getByRole('button', { name: '确认交付' }).click();
  await expect(page.getByText('批次已发起交付，右侧记录已刷新。')).toBeVisible();

  await page.goto('/algorithm');
  await expect(page.getByRole('heading', { name: '算法验收台', exact: true })).toBeVisible();
  await expect(page.getByText(deliveryNote).first()).toBeVisible();
  await page.getByRole('button', { name: new RegExp(deliveryNote) }).first().click();
  await page.getByLabel('验收结论').selectOption('accepted');
  await page.locator('input[aria-label^="抽检题目 "]').first().check();
  await page.getByLabel('验收备注').fill(acceptanceNote);
  await page.getByRole('button', { name: '提交验收' }).click();
  await expect(page.getByText('算法验收结果已保存。')).toBeVisible();
  await expect(page.getByText(acceptanceNote).first()).toBeVisible();
});

test('任务详情页支持转交、质检和结算裁定', async ({ page, request }) => {
  const projectResponse = await request.post('http://localhost:3000/projects', {
    data: {
      name: `Workflow 项目 ${Date.now()}`,
      taskType: 'text'
    }
  });
  expect(projectResponse.ok()).toBeTruthy();
  const project = await projectResponse.json();

  const batchResponse = await request.post(`http://localhost:3000/projects/${project.id}/batches`, {
    data: {
      name: `Workflow 批次 ${Date.now()}`
    }
  });
  expect(batchResponse.ok()).toBeTruthy();
  const batch = await batchResponse.json();

  const taskResponse = await request.post(`http://localhost:3000/batches/${batch.id}/tasks`, {
    data: {
      title: `Workflow 任务 ${Date.now()}`,
      inputPayload: {
        question: '请完成任务页工作流验证'
      }
    }
  });
  expect(taskResponse.ok()).toBeTruthy();
  const task = await taskResponse.json();

  const assignmentResponse = await request.post(
    `http://localhost:3000/tasks/${task.id}/assignments`,
    {
      data: {
        assigneeId: 'annotator-origin',
        operatorId: 'operator-01'
      }
    }
  );
  expect(assignmentResponse.ok()).toBeTruthy();

  await page.goto(`/tasks/${task.id}`);
  await expect(page.getByRole('heading', { name: '任务详情', exact: true })).toBeVisible();

  await page.getByLabel('接手标注员 ID').fill('annotator-replacement');
  await page.getByLabel('转交备注').fill('原标注员离项，改由代标接手');
  await page.getByRole('button', { name: '确认转交' }).click();
  await expect(page.getByText('annotator-replacement').first()).toBeVisible();

  await page.getByLabel('审核结论').selectOption('passed');
  await page.getByLabel('质检员 ID').fill('qa-1');
  await page.getByLabel('质检备注').fill('Playwright 质检通过');
  await page.getByRole('button', { name: '提交质检' }).click();
  await expect(page.getByText('qa-1')).toBeVisible();
  await expect(page.getByText('passed', { exact: true })).toBeVisible();

  await page.getByLabel('裁定模式').selectOption('single_owner');
  await page.getByLabel('裁定人 ID').fill('ops-1');
  await page.getByLabel('裁定角色').selectOption('operations');
  await page.getByLabel('归属执行记录').selectOption({ index: 1 });
  await page.getByLabel('裁定备注').fill('最终由代标人员计入产量');
  await page.getByRole('button', { name: '保存裁定' }).click();
  await expect(page.getByText('single_owner')).toBeVisible();
  await expect(page.getByText('100%')).toBeVisible();
});

test('角色工作台支持 AI 建议生成与备注填入', async ({ page, request }) => {
  let qaTaskOneId = '';
  let qaTaskTwoId = '';
  let qaDraftOne = '';
  let qaDraftTwo = '';
  let algorithmDraftOne = '';
  let algorithmDraftTwo = '';
  const deliveryNoteOne = `AI 验收交付说明 A ${Date.now()}`;
  const deliveryNoteTwo = `AI 验收交付说明 B ${Date.now()}`;

  await page.route('**/api/ai/task-suggestion', async (route) => {
    const payload = route.request().postDataJSON() as { taskId?: string };
    const suggestion =
      payload.taskId === qaTaskOneId
        ? qaDraftOne
        : payload.taskId === qaTaskTwoId
          ? qaDraftTwo
          : '未命中任务的默认质检建议';

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ suggestion })
    });
  });

  await page.route('**/api/ai/chat', async (route) => {
    const payload = route.request().postDataJSON() as { context?: string };
    const answer = payload.context?.includes(deliveryNoteOne)
      ? algorithmDraftOne
      : payload.context?.includes(deliveryNoteTwo)
        ? algorithmDraftTwo
        : '未命中交付的默认验收建议';

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ answer })
    });
  });

  const projectResponse = await request.post('http://localhost:3000/projects', {
    data: {
      name: `AI Workbench 项目 ${Date.now()}`,
      taskType: 'text'
    }
  });
  expect(projectResponse.ok()).toBeTruthy();
  const project = await projectResponse.json();

  const batchResponse = await request.post(`http://localhost:3000/projects/${project.id}/batches`, {
    data: {
      name: `AI Workbench 批次 ${Date.now()}`,
      plannedTaskCount: 2
    }
  });
  expect(batchResponse.ok()).toBeTruthy();
  const batch = await batchResponse.json();

  const secondBatchResponse = await request.post(`http://localhost:3000/projects/${project.id}/batches`, {
    data: {
      name: `AI Workbench 第二批次 ${Date.now()}`,
      plannedTaskCount: 1
    }
  });
  expect(secondBatchResponse.ok()).toBeTruthy();
  const secondBatch = await secondBatchResponse.json();

  const qaTaskTitleOne = `AI 质检题目 A ${Date.now()}`;
  const qaTaskTitleTwo = `AI 质检题目 B ${Date.now()}`;
  const readyTaskTitleOne = `AI 验收题目 A ${Date.now()}`;
  const readyTaskTitleTwo = `AI 验收题目 B ${Date.now()}`;

  qaDraftOne = 'AI 质检建议 A：关注题意完整性。建议结论仅供人工参考。质检备注草稿：题目 A 可进入通过复核。';
  qaDraftTwo = 'AI 质检建议 B：关注约束覆盖。建议结论仅供人工参考。质检备注草稿：题目 B 需补充边界检查。';
  algorithmDraftOne = 'AI 验收建议 A：优先抽检边界样本。建议结论仅供人工参考。验收备注草稿：交付 A 可先按通过处理。';
  algorithmDraftTwo = 'AI 验收建议 B：重点复核异常模式。建议结论仅供人工参考。验收备注草稿：交付 B 需补充复核记录。';

  for (const payload of [
    { title: qaTaskTitleOne, status: 'submitted' },
    { title: qaTaskTitleTwo, status: 'submitted' },
    { title: readyTaskTitleOne, status: 'qa_passed' }
  ]) {
    const taskResponse = await request.post(`http://localhost:3000/batches/${batch.id}/tasks`, {
      data: {
        title: payload.title,
        status: payload.status,
        inputPayload: {
          question: payload.title
        }
      }
    });
    expect(taskResponse.ok()).toBeTruthy();
    const task = await taskResponse.json();

    if (payload.title === qaTaskTitleOne) {
      qaTaskOneId = task.id;
    }

    if (payload.title === qaTaskTitleTwo) {
      qaTaskTwoId = task.id;
    }
  }

  const secondBatchTaskResponse = await request.post(`http://localhost:3000/batches/${secondBatch.id}/tasks`, {
    data: {
      title: readyTaskTitleTwo,
      status: 'qa_passed',
      inputPayload: {
        question: readyTaskTitleTwo
      }
    }
  });
  expect(secondBatchTaskResponse.ok()).toBeTruthy();

  const deliveryResponseOne = await request.post(`http://localhost:3000/batches/${batch.id}/deliveries`, {
    data: {
      submittedBy: 'ops-ai',
      notes: deliveryNoteOne
    }
  });
  expect(deliveryResponseOne.ok()).toBeTruthy();

  const deliveryResponseTwo = await request.post(`http://localhost:3000/batches/${secondBatch.id}/deliveries`, {
    data: {
      submittedBy: 'ops-ai',
      notes: deliveryNoteTwo
    }
  });
  expect(deliveryResponseTwo.ok()).toBeTruthy();

  await page.goto('/qa-delivery');
  const qaAgentCard = page.getByRole('region', { name: 'AI 质检助手', exact: true }).last();
  await page.getByRole('button', { name: new RegExp(`${qaTaskTitleOne}.*${project.name}`) }).click();
  await qaAgentCard.getByRole('button', { name: '生成质检建议' }).click();
  await expect(qaAgentCard.getByText(qaDraftOne)).toBeVisible();
  await expect(qaAgentCard.getByRole('button', { name: '填入质检备注' })).toBeVisible();

  await qaAgentCard.getByRole('button', { name: '填入质检备注' }).click();
  await expect(page.getByLabel('质检备注')).toHaveValue(qaDraftOne);

  await page.getByRole('button', { name: new RegExp(`${qaTaskTitleTwo}.*${project.name}`) }).click();
  await expect(qaAgentCard.getByText(qaDraftOne)).toHaveCount(0);
  await expect(qaAgentCard.getByRole('button', { name: '填入质检备注' })).toHaveCount(0);

  await qaAgentCard.getByRole('button', { name: '生成质检建议' }).click();
  await expect(qaAgentCard.getByText(qaDraftTwo)).toBeVisible();
  await qaAgentCard.getByRole('button', { name: '填入质检备注' }).click();
  await expect(page.getByLabel('质检备注')).toHaveValue(qaDraftTwo);

  await page.goto('/algorithm');
  const algorithmAgentCard = page
    .getByRole('region', { name: 'AI 验收助手', exact: true })
    .last();
  await page.getByRole('button', { name: new RegExp(deliveryNoteOne) }).first().click();
  await algorithmAgentCard.getByRole('button', { name: '生成验收建议' }).click();
  await expect(algorithmAgentCard.getByText(algorithmDraftOne)).toBeVisible();
  await expect(algorithmAgentCard.getByRole('button', { name: '填入验收备注' })).toBeVisible();

  await algorithmAgentCard.getByRole('button', { name: '填入验收备注' }).click();
  await expect(page.getByLabel('验收备注')).toHaveValue(algorithmDraftOne);

  await page.getByRole('button', { name: new RegExp(deliveryNoteTwo) }).first().click();
  await expect(algorithmAgentCard.getByText(algorithmDraftOne)).toHaveCount(0);
  await expect(algorithmAgentCard.getByRole('button', { name: '填入验收备注' })).toHaveCount(0);

  await algorithmAgentCard.getByRole('button', { name: '生成验收建议' }).click();
  await expect(algorithmAgentCard.getByText(algorithmDraftTwo)).toBeVisible();
  await algorithmAgentCard.getByRole('button', { name: '填入验收备注' }).click();
  await expect(page.getByLabel('验收备注')).toHaveValue(algorithmDraftTwo);
});
