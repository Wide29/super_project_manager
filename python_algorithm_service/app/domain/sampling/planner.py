from math import ceil

from app.domain.sampling.strategies import (
    DEFAULT_SAMPLING_CONFIG,
    choose_sampling_ratio,
    choose_seeded_baseline_tasks,
)


def build_sampling_plan(
    task_pool: list[dict],
    context: dict,
    config: dict | None = None,
) -> tuple[float, list[str], list[str], bool]:
    config = config or DEFAULT_SAMPLING_CONFIG
    ratio = choose_sampling_ratio(context.get("batch_risk_level", "low"), config)
    forced_risk_levels = set(config.get("forced_risk_levels", ["high"]))
    selection_seed = context.get("sampling_seed")
    selected = [
        task["task_id"] for task in task_pool if task.get("risk_level") in forced_risk_levels
    ]
    found_forced_task = bool(selected)
    requested_target_count = context.get("target_sample_count")
    task_count = max(context.get("task_count", len(task_pool)), len(task_pool))
    ratio_target_count = ceil(task_count * ratio) if task_pool else 0
    desired_sample_count = (
        requested_target_count
        if isinstance(requested_target_count, int) and requested_target_count > 0
        else ratio_target_count
    )
    total_target_count = max(desired_sample_count, len(selected))
    remaining_task_ids = [
        task.get("task_id")
        for task in task_pool
        if task.get("task_id") not in selected and task.get("task_id") is not None
    ]

    selected.extend(
        choose_seeded_baseline_tasks(
            remaining_task_ids,
            max(total_target_count - len(selected), 0),
            selection_seed,
        )
    )

    used_fallback = False
    if not selected and task_pool and config.get("fallback_to_first_available", True):
        selected = choose_seeded_baseline_tasks(
            [task["task_id"] for task in task_pool if task.get("task_id") is not None],
            1,
            selection_seed,
        )
        used_fallback = True
    elif selected and not found_forced_task:
        used_fallback = True

    flags = ["expand_sampling"] if ratio >= 0.3 else []
    if used_fallback:
        flags.append("fallback_to_first_available_task")
    return ratio, selected, flags, used_fallback
