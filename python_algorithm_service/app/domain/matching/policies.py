def apply_policies(
    worker_id: str,
    score: float,
    context: dict,
    config: dict | None = None,
) -> tuple[float, list[str], list[str]]:
    config = config or {}
    if context.get("is_rework") and context.get("original_worker_id") == worker_id:
        return (
            score + config.get("rework_original_worker_boost", 20.0),
            ["rework_original_worker_preferred"],
            [],
        )
    return score, [], []
