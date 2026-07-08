from app.domain.sampling.strategies import choose_sampling_ratio


def build_sampling_plan(task_pool: list[dict], context: dict) -> tuple[float, list[str], list[str]]:
    ratio = choose_sampling_ratio(context.get("batch_risk_level", "low"))
    selected = [task["task_id"] for task in task_pool if task["risk_level"] == "high"]
    if not selected and task_pool:
        selected = [task_pool[0]["task_id"]]
    flags = ["expand_sampling"] if ratio >= 0.3 else []
    return ratio, selected, flags
