'use client';

import type { ReactElement } from 'react';
import { useState } from 'react';

const GENERIC_ERROR_MESSAGE = '建议生成失败，请稍后重试。';

function getChineseErrorMessage(err: unknown) {
  if (err instanceof Error) {
    return GENERIC_ERROR_MESSAGE;
  }

  if (typeof err === 'string' && err.trim()) {
    return GENERIC_ERROR_MESSAGE;
  }

  return GENERIC_ERROR_MESSAGE;
}

export function WorkbenchAgentCard({
  title,
  description,
  actionLabel,
  loadingLabel,
  emptyHint,
  disabled,
  onGenerate,
  onInsert,
  insertLabel = '填入备注'
}: {
  title: string;
  description: string;
  actionLabel: string;
  loadingLabel: string;
  emptyHint: string;
  disabled?: boolean;
  onGenerate: () => Promise<string>;
  onInsert?: (draft: string) => void;
  insertLabel?: string;
}): ReactElement {
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleGenerate() {
    if (disabled) return;

    setDraft('');
    setLoading(true);
    setError('');

    try {
      const nextDraft = await onGenerate();
      setDraft(nextDraft);
    } catch (err) {
      setError(getChineseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      aria-label={title}
      className="rounded-panel border border-panelLine bg-white p-6 shadow-panel"
    >
      <h3 className="text-lg font-semibold text-slateDeep">{title}</h3>
      <p className="mt-2 text-sm text-slate-500">{description}</p>

      <button
        type="button"
        onClick={handleGenerate}
        disabled={disabled || loading}
        className="mt-4 rounded-full bg-slateDeep px-5 py-2.5 text-sm text-white disabled:opacity-60"
      >
        {loading ? loadingLabel : actionLabel}
      </button>

      {error ? <p className="mt-4 text-sm text-rose-500">{error}</p> : null}

      {draft ? (
        <>
          <div className="mt-4 rounded-2xl bg-skySoft p-4 text-sm leading-7 text-slateDeep">
            {draft}
          </div>
          {onInsert ? (
            <button
              type="button"
              onClick={() => onInsert(draft)}
              className="mt-4 rounded-full bg-skyStrong px-5 py-2.5 text-sm text-white"
            >
              {insertLabel}
            </button>
          ) : null}
        </>
      ) : (
        <p className="mt-4 text-sm text-slate-500">{emptyHint}</p>
      )}
    </section>
  );
}
