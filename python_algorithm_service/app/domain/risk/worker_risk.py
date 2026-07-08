from app.domain.common.enums import RiskLevel


DEFAULT_WORKER_RISK_CONFIG = {
    "signals": {
        "pass_rate_drop": {"threshold": 0.8, "score": 40},
        "rework_rate_high": {"threshold": 0.2, "score": 30},
        "load_high": {"threshold": 5, "score": 20},
    },
    "level_thresholds": {"medium": 40, "high": 70},
}


def score_worker_risk(
    context: dict,
    config: dict | None = None,
) -> tuple[int, RiskLevel, list[str]]:
    config = config or DEFAULT_WORKER_RISK_CONFIG
    signal_config = config.get("signals", {})
    level_thresholds = config.get("level_thresholds", {})
    score = 0
    reasons: list[str] = []

    pass_rate_threshold = signal_config.get("pass_rate_drop", {}).get("threshold", 0.8)
    if context.get("recent_pass_rate", 1.0) < pass_rate_threshold:
        score += signal_config.get("pass_rate_drop", {}).get("score", 40)
        reasons.append("pass_rate_drop")
    rework_rate_threshold = signal_config.get("rework_rate_high", {}).get("threshold", 0.2)
    if context.get("recent_rework_rate", 0.0) > rework_rate_threshold:
        score += signal_config.get("rework_rate_high", {}).get("score", 30)
        reasons.append("rework_rate_high")
    active_load_threshold = signal_config.get("load_high", {}).get("threshold", 5)
    if context.get("active_load", 0) >= active_load_threshold:
        score += signal_config.get("load_high", {}).get("score", 20)
        reasons.append("load_high")

    if score >= level_thresholds.get("high", 70):
        return score, RiskLevel.HIGH, reasons
    if score >= level_thresholds.get("medium", 40):
        return score, RiskLevel.MEDIUM, reasons
    return score, RiskLevel.LOW, reasons
