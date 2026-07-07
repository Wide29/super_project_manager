import { expect, test } from '@playwright/test';

test('项目页和项目详情页支持创建项目与批次', async ({ page }) => {
  const projectName = `Playwright 项目 ${Date.now()}`;
  const projectDescription = '用于验证项目创建表单';
  const taskType = '文本题';

  await page.goto('/projects');

  await expect(page.getByRole('heading', { name: '项目管理', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: '新建项目', exact: true })).toBeVisible();

  await page.getByLabel('项目名称').fill(projectName);
  await page.getByLabel('题型').fill(taskType);
  await page.getByLabel('项目说明').fill(projectDescription);
  await page.getByLabel('SOP 文档').fill('按步骤执行');
  await page.getByLabel('验收标准').fill('提交数据需通过抽检');
  await page.getByRole('button', { name: '保存项目' }).click();

  await expect(page.getByRole('link', { name: new RegExp(projectName) })).toBeVisible();

  await page.getByRole('link', { name: new RegExp(projectName) }).click();

  const batchName = `批次 ${Date.now()}`;

  await expect(page.getByRole('heading', { name: '项目详情', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: '新建批次', exact: true })).toBeVisible();

  await page.getByLabel('批次名称').fill(batchName);
  await page.getByLabel('计划题量').fill('12');
  await page.getByRole('button', { name: '保存批次' }).click();

  await expect(page.getByRole('link', { name: new RegExp(batchName) })).toBeVisible();
});

test('批次页和任务页支持创建任务、导入 JSON 和分配标注员', async ({
  page,
  request
}) => {
  const projectResponse = await request.post('http://localhost:3000/projects', {
    data: {
      name: `Task Flow 项目 ${Date.now()}`,
      taskType: 'text'
    }
  });
  expect(projectResponse.ok()).toBeTruthy();
  const project = await projectResponse.json();

  const batchResponse = await request.post(
    `http://localhost:3000/projects/${project.id}/batches`,
    {
      data: {
        name: `Task Flow 批次 ${Date.now()}`,
        plannedTaskCount: 2
      }
    }
  );
  expect(batchResponse.ok()).toBeTruthy();
  const batch = await batchResponse.json();

  await page.goto(`/batches/${batch.id}`);
  await expect(page.getByRole('heading', { name: '批次详情', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: '新建任务', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: '批量导入 JSON', exact: true })).toBeVisible();

  const manualTaskTitle = `手工任务 ${Date.now()}`;
  await page.getByLabel('任务标题').fill(manualTaskTitle);
  await page.getByLabel('外部引用').fill('MANUAL-001');
  await page.getByLabel('优先级').fill('3');
  await page
    .getByLabel('题目 JSON')
    .fill('{\n  "question": "请完成手工录入任务"\n}');
  await page.getByRole('button', { name: '保存任务' }).click();
  await expect(page.getByRole('link', { name: new RegExp(manualTaskTitle) })).toBeVisible();

  const importedTaskTitle = `导入任务 ${Date.now()}`;
  await page.getByLabel('任务数组').fill(`[
  {
    "title": "${importedTaskTitle}",
    "externalRef": "IMPORT-001",
    "priority": 1,
    "inputPayload": {
      "question": "请通过导入创建任务"
    }
  }
]`);
  await page.getByRole('button', { name: '开始导入' }).click();
  await expect(page.getByRole('link', { name: new RegExp(importedTaskTitle) })).toBeVisible();

  await page.getByRole('link', { name: new RegExp(manualTaskTitle) }).click();

  await expect(page.getByRole('heading', { name: '任务详情', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: '分配给标注员', exact: true })).toBeVisible();

  const assigneeId = `annotator-${Date.now()}`;
  await page.getByLabel('标注员 ID').fill(assigneeId);
  await page.getByLabel('运营商 ID').fill('operator-01');
  await page.getByLabel('分配备注').fill('Playwright 分配验证');
  await page.getByRole('button', { name: '确认分配' }).click();

  await expect(page.getByText(assigneeId).first()).toBeVisible();
  await expect(page.getByText('备注：Playwright 分配验证').first()).toBeVisible();
});

test('批次页支持发起交付与算法验收', async ({ page, request }) => {
  const projectResponse = await request.post('http://localhost:3000/projects', {
    data: {
      name: `Delivery 项目 ${Date.now()}`,
      taskType: 'text'
    }
  });
  expect(projectResponse.ok()).toBeTruthy();
  const project = await projectResponse.json();

  const batchResponse = await request.post(
    `http://localhost:3000/projects/${project.id}/batches`,
    {
      data: {
        name: `Delivery 批次 ${Date.now()}`,
        plannedTaskCount: 2
      }
    }
  );
  expect(batchResponse.ok()).toBeTruthy();
  const batch = await batchResponse.json();

  const taskTitles = [`验收题目 A ${Date.now()}`, `验收题目 B ${Date.now()}`];
  for (const title of taskTitles) {
    const taskResponse = await request.post(`http://localhost:3000/batches/${batch.id}/tasks`, {
      data: {
        title,
        status: 'qa_passed',
        inputPayload: {
          question: title
        }
      }
    });
    expect(taskResponse.ok()).toBeTruthy();
  }

  await page.goto(`/batches/${batch.id}`);
  await expect(page.getByRole('heading', { name: '发起交付', exact: true })).toBeVisible();

  await page.getByLabel('交付说明').fill('提交第一轮批次');
  await page.getByRole('button', { name: '确认交付' }).click();
  await expect(page.getByText('提交第一轮批次')).toBeVisible();

  await expect(page.getByRole('heading', { name: '算法验收', exact: true })).toBeVisible();
  await page.getByLabel('验收结论').selectOption('partially_rejected');
  await page.getByLabel(`抽检题目 ${taskTitles[0]}`).check();
  await page.getByLabel(`抽检题目 ${taskTitles[1]}`).check();
  await page.getByLabel(`打回题目 ${taskTitles[0]}`).check();
  await page.getByLabel('验收备注').fill('抽检命中一题打回');
  await page.getByRole('button', { name: '提交验收' }).click();

  await expect(page.getByText('抽检题量：2')).toBeVisible();
  await expect(page.getByText('抽检命中一题打回')).toBeVisible();
});
