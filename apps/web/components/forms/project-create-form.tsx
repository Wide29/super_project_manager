'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createProject } from '../../lib/api/projects';
import type { CreateProjectInput } from '../../lib/types';
import { ActionCard } from '../ui/action-card';

type ProjectFormState = Pick<CreateProjectInput, 'name' | 'taskType'> & {
  description: string;
  sopDocument: string;
  acceptanceCriteria: string;
};

const INITIAL_FORM: ProjectFormState = {
  name: '',
  description: '',
  taskType: '',
  sopDocument: '',
  acceptanceCriteria: ''
};

export function ProjectCreateForm() {
  const router = useRouter();
  const [form, setForm] = useState<ProjectFormState>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  function updateField<K extends keyof ProjectFormState>(key: K, value: ProjectFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.name.trim() || !form.taskType.trim()) {
      setError('请先填写项目名称和题型。');
      setMessage('');
      return;
    }

    setSubmitting(true);
    setError('');
    setMessage('');

    const payload: CreateProjectInput = {
      name: form.name.trim(),
      taskType: form.taskType.trim(),
      description: form.description.trim() || undefined,
      sopDocument: form.sopDocument.trim() || undefined,
      acceptanceCriteria: form.acceptanceCriteria.trim() || undefined
    };

    try {
      await createProject(payload);
      setForm(INITIAL_FORM);
      setMessage('项目已创建，可在列表中查看。');
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '创建项目失败');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ActionCard title="新建项目" description="创建一个新的数据生产项目。">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="project-name" className="text-sm font-medium text-slateDeep">
            项目名称
          </label>
          <input
            id="project-name"
            value={form.name}
            onChange={(event) => updateField('name', event.target.value)}
            placeholder="例如：高考数学解题标注"
            className="mt-2 h-11 w-full rounded-2xl border border-panelLine bg-cloud px-4 text-sm text-slateDeep outline-none transition focus:border-skyStrong"
          />
        </div>

        <div>
          <label htmlFor="project-task-type" className="text-sm font-medium text-slateDeep">
            题型
          </label>
          <input
            id="project-task-type"
            value={form.taskType}
            onChange={(event) => updateField('taskType', event.target.value)}
            placeholder="例如：问答题、选择题、证明题"
            className="mt-2 h-11 w-full rounded-2xl border border-panelLine bg-cloud px-4 text-sm text-slateDeep outline-none transition focus:border-skyStrong"
          />
        </div>

        <div>
          <label htmlFor="project-description" className="text-sm font-medium text-slateDeep">
            项目说明
          </label>
          <textarea
            id="project-description"
            value={form.description}
            onChange={(event) => updateField('description', event.target.value)}
            placeholder="补充项目背景、交付目标或协作说明"
            className="mt-2 min-h-24 w-full rounded-2xl border border-panelLine bg-cloud px-4 py-3 text-sm text-slateDeep outline-none transition focus:border-skyStrong"
          />
        </div>

        <div>
          <label htmlFor="project-sop" className="text-sm font-medium text-slateDeep">
            SOP 文档
          </label>
          <textarea
            id="project-sop"
            value={form.sopDocument}
            onChange={(event) => updateField('sopDocument', event.target.value)}
            placeholder="填写执行流程、操作步骤或注意事项"
            className="mt-2 min-h-28 w-full rounded-2xl border border-panelLine bg-cloud px-4 py-3 text-sm text-slateDeep outline-none transition focus:border-skyStrong"
          />
        </div>

        <div>
          <label
            htmlFor="project-acceptance-criteria"
            className="text-sm font-medium text-slateDeep"
          >
            验收标准
          </label>
          <textarea
            id="project-acceptance-criteria"
            value={form.acceptanceCriteria}
            onChange={(event) => updateField('acceptanceCriteria', event.target.value)}
            placeholder="明确质检要求、完成标准与交付口径"
            className="mt-2 min-h-28 w-full rounded-2xl border border-panelLine bg-cloud px-4 py-3 text-sm text-slateDeep outline-none transition focus:border-skyStrong"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-skyStrong px-5 py-3 text-sm font-medium text-white disabled:opacity-60"
        >
          {submitting ? '创建中...' : '保存项目'}
        </button>

        {error ? <p className="text-sm text-rose-500">{error}</p> : null}
        {message ? <p className="text-sm text-slate-500">{message}</p> : null}
      </form>
    </ActionCard>
  );
}
