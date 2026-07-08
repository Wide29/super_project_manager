def choose_sampling_ratio(batch_risk_level: str) -> float:
    if batch_risk_level == "high":
        return 0.3
    if batch_risk_level == "medium":
        return 0.2
    return 0.1
