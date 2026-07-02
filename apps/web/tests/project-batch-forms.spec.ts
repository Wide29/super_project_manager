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
