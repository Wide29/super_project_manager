from app.domain.common.enums import RiskLevel


def score_worker_risk(context: dict) -> tuple[int, RiskLevel, list[str]]:
    score = 0
    reasons: list[str] = []

    if context.get("recent_pass_rate", 1.0) < 0.8:
        score += 40
        reasons.append("pass_rate_drop")
    if context.get("recent_rework_rate", 0.0) > 0.2:
        score += 30
        reasons.append("rework_rate_high")
    if context.get("active_load", 0) >= 5:
        score += 20
        reasons.append("load_high")

    if score >= 70:
        return score, RiskLevel.HIGH, reasons
    if score >= 40:
        return score, RiskLevel.MEDIUM, reasons
    return score, RiskLevel.LOW, reasons
