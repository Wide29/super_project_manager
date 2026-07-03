'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { importTasks } from '../../lib/api/tasks';
import type { CreateTaskInput } from '../../lib/types';
import { ActionCard } from '../ui/action-card';

const IMPORT_EXAMPLE = `[
  {
    "title": "题目一",
    "externalRef": "A-001",
    "priority": 1,
    "inputPayload": {
      "question": "请给出答案并说明理由"
    }
  }
]`;

export function TaskImportForm({ batchId }: { batchId: string }) {
  const router = useRouter();
  const [value, setValue] = useState(IMPORT_EXAMPLE);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage('');
    setError('');

    try {
      const parsed = JSON.parse(value) as unknown;
      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error('请输入至少一条任务数组 JSON。');
      }

      const tasks = parsed as CreateTaskInput[];
      const result = await importTasks(batchId, { tasks });
      setMessage(`已导入 ${result.createdCount} 条任务。`);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '导入失败');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ActionCard title="批量导入 JSON" description="粘贴任务数组并一次性导入。">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="task-import-json" className="text-sm font-medium text-slateDeep">
            任务数组
          </label>
          <textarea
            id="task-import-json"
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              if (error) {
                setError('');
              }
            }}
            className="mt-2 min-h-64 w-full rounded-2xl border border-panelLine bg-cloud px-4 py-3 font-mono text-sm text-slateDeep outline-none transition focus:border-skyStrong"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-slateDeep px-5 py-3 text-sm font-medium text-white disabled:opacity-60"
        >
          {submitting ? '导入中...' : '开始导入'}
        </button>

        {error ? <p className="text-sm text-rose-500">{error}</p> : null}
        {message ? <p className="text-sm text-slate-500">{message}</p> : null}
      </form>
    </ActionCard>
  );
}
