def apply_policies(worker_id: str, score: float, context: dict) -> tuple[float, list[str], list[str]]:
    if context.get("is_rework") and context.get("original_worker_id") == worker_id:
        return score + 20, ["rework_original_worker_preferred"], []
    return score, [], []
