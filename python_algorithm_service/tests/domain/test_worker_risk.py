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


def test_score_worker_risk_uses_rule_config_thresholds_and_weights() -> None:
    score, level, reasons = score_worker_risk(
        {
            "recent_pass_rate": 0.84,
            "recent_rework_rate": 0.19,
            "active_load": 4,
        },
        {
            "signals": {
                "pass_rate_drop": {"threshold": 0.85, "score": 35},
                "rework_rate_high": {"threshold": 0.18, "score": 25},
                "load_high": {"threshold": 4, "score": 20},
            },
            "level_thresholds": {"medium": 30, "high": 70},
        },
    )

    assert score == 80
    assert level.value == "high"
    assert reasons == ["pass_rate_drop", "rework_rate_high", "load_high"]
