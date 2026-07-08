from app.domain.sampling.strategies import choose_sampling_ratio


def build_sampling_plan(
    task_pool: list[dict], context: dict
) -> tuple[float, list[str], list[str], bool]:
    ratio = choose_sampling_ratio(context.get("batch_risk_level", "low"))
    selected = [task["task_id"] for task in task_pool if task["risk_level"] == "high"]
    used_fallback = False
    if not selected and task_pool:
        selected = [task_pool[0]["task_id"]]
        used_fallback = True
    flags = ["expand_sampling"] if ratio >= 0.3 else []
    if used_fallback:
        flags.append("fallback_to_first_available_task")
    return ratio, selected, flags, used_fallback
