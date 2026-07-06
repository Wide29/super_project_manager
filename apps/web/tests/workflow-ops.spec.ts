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
  await expect(page.getByText(pendingQaTitle)).toBeVisible();
  await expect(page.getByText(reworkTitle)).toBeVisible();

  await page.getByRole('link', { name: '算法验收台' }).click();
  await expect(page.getByRole('heading', { name: '算法验收台', exact: true })).toBeVisible();
  await expect(page.getByText(batch.name)).toBeVisible();
  await expect(page.getByText('待算法抽检的交付批次')).toBeVisible();
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
