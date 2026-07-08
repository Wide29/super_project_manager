from app.domain.risk.worker_risk import score_worker_risk


def test_score_worker_risk_marks_high_for_quality_drop() -> None:
    score, level, reasons = score_worker_risk(
        {
            "recent_pass_rate": 0.7,
            "recent_rework_rate": 0.25,
            "active_load": 5,
        }
    )

    assert score >= 70
    assert level.value == "high"
    assert "pass_rate_drop" in reasons
    assert "rework_rate_high" in reasons
    assert "load_high" in reasons


def test_score_worker_risk_marks_medium_for_single_primary_signal() -> None:
    score, level, reasons = score_worker_risk({"recent_pass_rate": 0.75})

    assert score == 40
    assert level.value == "medium"
    assert reasons == ["pass_rate_drop"]
