def score_candidate(worker_id: str, features: dict) -> tuple[float, list[str], list[str]]:
    active_load = features.get("active_load", 0)
    recent_pass_rate = features.get("recent_pass_rate", features.get("pass_rate", 0.0))

    score = 100.0
    reasons = ["active_load_considered", "recent_pass_rate_considered"]
    warnings: list[str] = []

    score -= active_load * 5
    score += recent_pass_rate * 10

    if recent_pass_rate >= 0.9:
        reasons.append("recent_pass_rate_high")

    if active_load >= 3:
        warnings.append("load_high")

    return score, reasons, warnings
