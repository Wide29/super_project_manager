def score_candidate(worker_id: str, context: dict) -> tuple[float, list[str], list[str]]:
    profiles = context.get("worker_profiles", {})
    profile = profiles.get(worker_id, {})
    active_load = profile.get("active_load", 0)
    pass_rate = profile.get("pass_rate", 0.0)

    score = 100.0
    reasons = [f"load_{active_load}", f"pass_rate_{pass_rate}"]
    warnings: list[str] = []

    score -= active_load * 5
    score += pass_rate * 10

    if active_load >= 3:
        warnings.append("load_high")

    return score, reasons, warnings
