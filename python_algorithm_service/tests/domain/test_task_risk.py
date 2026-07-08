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


def test_score_task_risk_uses_rule_config_thresholds_and_weights() -> None:
    score, level, reasons = score_task_risk(
        {
            "rework_count": 1,
            "deadline_hours_left": 6,
            "historical_defect_rate": 0.2,
        },
        {
            "signals": {
                "rework_count_high": {"threshold": 1, "score": 50},
                "deadline_pressure": {"threshold_hours": 6, "score": 30},
                "historical_defect_high": {"threshold": 0.2, "score": 20},
            },
            "level_thresholds": {"medium": 40, "high": 80},
        },
    )

    assert score == 100
    assert level.value == "high"
    assert reasons == [
        "rework_count_high",
        "deadline_pressure",
        "historical_defect_high",
    ]
