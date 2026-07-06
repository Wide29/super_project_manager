# Role Workbench Agent Assist Design

## Goal

Add lightweight AI assistance to the existing role workbenches so QA/Delivery and Algorithm users can get suggestion text and draft notes without giving up human decision authority.

## Scope

This design covers:

- `质检交付台` AI suggestion card
- `算法验收台` AI suggestion card
- Reuse of the existing backend AI proxy
- One-click insertion of AI-generated note drafts into existing form fields

This design does not cover:

- Fully automatic submission
- Multi-agent orchestration
- Persistent suggestion history
- Model-side structured decision enforcement

## Recommendation

Use the existing `POST /ai/task-suggestion` backend capability as the first integration point and add small, role-aware suggestion panels inside the two workbenches.

Why this approach:

- It ships fast because the DeepSeek proxy already exists.
- It keeps the product safe because AI remains advisory.
- It matches the current MVP interaction model where operators still review and submit manually.

## User Experience

### QA/Delivery workbench

When a QA user selects a task in `质检交付台`, the right-side panel shows:

- `生成质检建议`
- A Chinese suggestion block focused on:
  - likely risk points
  - whether the answer appears pass/reject leaning
  - a draft QA note
- `填入质检备注` button

The AI output is not treated as the final result. The user still chooses `通过` or `打回` and manually submits the form.

### Algorithm workbench

When an algorithm user selects a delivery in `算法验收台`, the right-side panel shows:

- `生成验收建议`
- A Chinese suggestion block focused on:
  - sampling focus
  - likely failure patterns
  - a draft acceptance note
- `填入验收备注` button

The AI output does not auto-pick acceptance decisions or rejected samples. It only helps the user think faster and write cleaner notes.

## Data Flow

### QA suggestion

1. User selects a task in `质检交付台`
2. Frontend sends task context to `/ai/task-suggestion`
3. Backend forwards the prompt through the existing DeepSeek proxy
4. Frontend renders suggestion text
5. User optionally copies or inserts the draft note into the QA form

### Algorithm suggestion

1. User selects a delivery in `算法验收台`
2. Frontend builds a compact delivery context with batch name and sampled task candidates
3. Frontend sends the context through `/ai/task-suggestion`
4. Backend returns suggestion text
5. User optionally inserts the note draft into the acceptance form

## Prompting Strategy

The frontend should send role-specific natural-language prompts:

- QA prompt asks for risk scan, likely QA judgment hints, and a concise Chinese QA note draft.
- Algorithm prompt asks for sampling focus, possible defect patterns, and a concise Chinese acceptance note draft.

Prompts should explicitly say:

- output must be in Chinese
- output is advisory only
- avoid claiming certainty
- keep note draft concise and directly usable

## Component Changes

### New frontend components

- `apps/web/components/ai/workbench-agent-card.tsx`
  - generic AI suggestion panel
  - accepts title, context text, prompt seed, insert callback

### Modified components

- `apps/web/components/workbench/qa-delivery-workbench.tsx`
  - add AI suggestion card beside the QA form
  - wire note insertion into the QA form

- `apps/web/components/workbench/algorithm-workbench.tsx`
  - add AI suggestion card beside the acceptance form
  - wire note insertion into the acceptance form

- existing form components may need a controlled `initialNotes` or `externalNoteDraft` prop so AI text can be inserted cleanly.

## Error Handling

- If the AI endpoint fails, show a short Chinese error state and keep manual workflow fully usable.
- If no task or delivery is selected, disable suggestion generation.
- AI suggestion generation must never block form submission.

## Testing

Add browser coverage for:

- generating QA suggestion in the workbench
- inserting suggestion text into the QA note field
- generating algorithm suggestion in the workbench
- inserting suggestion text into the acceptance note field

Keep backend regression unchanged because this feature reuses the existing AI proxy surface.

## Decision Boundary

The AI is an assistant, not an approver.

- It may suggest
- It may draft text
- It may highlight risk
- It may not auto-submit
- It may not silently choose final acceptance decisions

## Success Criteria

- QA users can generate a Chinese suggestion for the selected task.
- Algorithm users can generate a Chinese suggestion for the selected delivery.
- Suggested note text can be inserted into the existing form.
- Existing manual workflows continue to pass current browser and backend regression tests.
