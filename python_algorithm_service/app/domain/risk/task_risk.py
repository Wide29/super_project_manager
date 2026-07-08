from app.domain.common.enums import RiskLevel


DEFAULT_TASK_RISK_CONFIG = {
    "signals": {
        "rework_count_high": {"threshold": 2, "score": 40},
        "deadline_pressure": {"threshold_hours": 4, "score": 30},
        "historical_defect_high": {"threshold": 0.3, "score": 30},
    },
    "level_thresholds": {"medium": 40, "high": 70},
}


def score_task_risk(
    context: dict,
    config: dict | None = None,
) -> tuple[int, RiskLevel, list[str]]:
    config = config or DEFAULT_TASK_RISK_CONFIG
    signal_config = config.get("signals", {})
    level_thresholds = config.get("level_thresholds", {})
    score = 0
    reasons: list[str] = []

    rework_threshold = signal_config.get("rework_count_high", {}).get("threshold", 2)
    if context.get("rework_count", 0) >= rework_threshold:
        score += signal_config.get("rework_count_high", {}).get("score", 40)
        reasons.append("rework_count_high")
    deadline_threshold = signal_config.get("deadline_pressure", {}).get("threshold_hours", 4)
    if context.get("deadline_hours_left", 999) <= deadline_threshold:
        score += signal_config.get("deadline_pressure", {}).get("score", 30)
        reasons.append("deadline_pressure")
    defect_threshold = signal_config.get("historical_defect_high", {}).get("threshold", 0.3)
    if context.get("historical_defect_rate", 0) >= defect_threshold:
        score += signal_config.get("historical_defect_high", {}).get("score", 30)
        reasons.append("historical_defect_high")

    if score >= level_thresholds.get("high", 70):
        return score, RiskLevel.HIGH, reasons
    if score >= level_thresholds.get("medium", 40):
        return score, RiskLevel.MEDIUM, reasons
    return score, RiskLevel.LOW, reasons
