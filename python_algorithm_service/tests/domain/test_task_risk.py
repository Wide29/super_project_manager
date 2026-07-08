from app.domain.risk.task_risk import score_task_risk


def test_score_task_risk_marks_high_for_rework_deadline_and_defect() -> None:
    score, level, reasons = score_task_risk(
        {
            "rework_count": 2,
            "deadline_hours_left": 2,
            "historical_defect_rate": 0.4,
        }
    )

    assert score == 100
    assert level.value == "high"
    assert "rework_count_high" in reasons
    assert "deadline_pressure" in reasons
    assert "historical_defect_high" in reasons


def test_score_task_risk_marks_low_without_signals() -> None:
    score, level, reasons = score_task_risk({})

    assert score == 0
    assert level.value == "low"
    assert reasons == []
