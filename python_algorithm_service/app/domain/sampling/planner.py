from math import ceil

from app.domain.sampling.strategies import DEFAULT_SAMPLING_CONFIG, choose_sampling_ratio


def build_sampling_plan(
    task_pool: list[dict],
    context: dict,
    config: dict | None = None,
) -> tuple[float, list[str], list[str], bool]:
    config = config or DEFAULT_SAMPLING_CONFIG
    ratio = choose_sampling_ratio(context.get("batch_risk_level", "low"), config)
    forced_risk_levels = set(config.get("forced_risk_levels", ["high"]))
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

    for task in task_pool:
        task_id = task.get("task_id")
        if task_id in selected:
            continue
        if len(selected) >= total_target_count:
            break
        selected.append(task_id)

    used_fallback = False
    if not selected and task_pool and config.get("fallback_to_first_available", True):
        selected = [task_pool[0]["task_id"]]
        used_fallback = True
    elif selected and not found_forced_task:
        used_fallback = True

    flags = ["expand_sampling"] if ratio >= 0.3 else []
    if used_fallback:
        flags.append("fallback_to_first_available_task")
    return ratio, selected, flags, used_fallback
