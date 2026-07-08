def apply_policies(worker_id: str, score: float, context: dict) -> float:
    if context.get("is_rework") and context.get("original_worker_id") == worker_id:
        return score + 20
    return score
