from app.domain.common.enums import RiskLevel


def score_task_risk(context: dict) -> tuple[int, RiskLevel, list[str]]:
    score = 0
    reasons: list[str] = []

    if context.get("rework_count", 0) >= 2:
        score += 40
        reasons.append("rework_count_high")
    if context.get("deadline_hours_left", 999) <= 4:
        score += 30
        reasons.append("deadline_pressure")
    if context.get("historical_defect_rate", 0) >= 0.3:
        score += 30
        reasons.append("historical_defect_high")

    if score >= 70:
        return score, RiskLevel.HIGH, reasons
    if score >= 40:
        return score, RiskLevel.MEDIUM, reasons
    return score, RiskLevel.LOW, reasons
