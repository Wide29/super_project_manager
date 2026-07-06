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
  await page.route('**/api/ai/task-suggestion', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        suggestion: 'AI 质检建议：关注题意完整性。建议结论仅供人工参考。质检备注草稿：题目表达清晰，可进入通过复核。'
      })
    });
  });

  await page.route('**/api/ai/chat', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        answer: 'AI 验收建议：优先抽检边界样本。建议结论仅供人工参考。验收备注草稿：已抽检关键题目，当前交付可先按通过处理。'
      })
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

  const qaTaskTitle = `AI 质检题目 ${Date.now()}`;
  const readyTaskTitle = `AI 验收题目 ${Date.now()}`;

  for (const payload of [
    { title: qaTaskTitle, status: 'submitted' },
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

  const deliveryResponse = await request.post(`http://localhost:3000/batches/${batch.id}/deliveries`, {
    data: {
      submittedBy: 'ops-ai',
      notes: `AI 验收交付说明 ${Date.now()}`
    }
  });
  expect(deliveryResponse.ok()).toBeTruthy();

  await page.goto('/qa-delivery');
  await page.getByRole('button', { name: '生成质检建议' }).click();
  await expect(page.getByRole('button', { name: '填入质检备注' })).toBeVisible();

  await page.getByRole('button', { name: '填入质检备注' }).click();
  await expect(page.getByLabel('质检备注')).not.toHaveValue('');

  await page.goto('/algorithm');
  await page.getByRole('button', { name: '生成验收建议' }).click();
  await expect(page.getByRole('button', { name: '填入验收备注' })).toBeVisible();

  await page.getByRole('button', { name: '填入验收备注' }).click();
  await expect(page.getByLabel('验收备注')).not.toHaveValue('');
});
