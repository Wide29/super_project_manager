DEFAULT_MATCHING_CONFIG = {
    "base_score": 100.0,
    "active_load_penalty": 5.0,
    "pass_rate_bonus": 10.0,
    "strong_pass_rate_threshold": 0.9,
    "high_load_threshold": 3,
}


def score_candidate(
    worker_id: str,
    features: dict,
    config: dict | None = None,
) -> tuple[float, list[str], list[str]]:
    config = config or DEFAULT_MATCHING_CONFIG
    active_load = features.get("active_load", 0)
    recent_pass_rate = features.get("recent_pass_rate", features.get("pass_rate", 0.0))

    score = config.get("base_score", 100.0)
    reasons = ["active_load_considered", "recent_pass_rate_considered"]
    warnings: list[str] = []

    score -= active_load * config.get("active_load_penalty", 5.0)
    score += recent_pass_rate * config.get("pass_rate_bonus", 10.0)

    if recent_pass_rate >= config.get("strong_pass_rate_threshold", 0.9):
        reasons.append("recent_pass_rate_high")

    if active_load >= config.get("high_load_threshold", 3):
        warnings.append("load_high")

    return score, reasons, warnings
