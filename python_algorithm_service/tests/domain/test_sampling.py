from app.domain.sampling.planner import build_sampling_plan


def test_build_sampling_plan_keeps_high_risk_tasks() -> None:
    ratio, selected, flags = build_sampling_plan(
        [{"task_id": "t-1", "risk_level": "high"}, {"task_id": "t-2", "risk_level": "low"}],
        {"batch_risk_level": "high"},
    )

    assert ratio == 0.3
    assert selected == ["t-1"]
    assert "expand_sampling" in flags


def test_build_sampling_plan_falls_back_to_first_task_when_no_high_risk() -> None:
    ratio, selected, flags = build_sampling_plan(
        [{"task_id": "t-1", "risk_level": "low"}, {"task_id": "t-2", "risk_level": "medium"}],
        {"batch_risk_level": "medium"},
    )

    assert ratio == 0.2
    assert selected == ["t-1"]
    assert flags == []
