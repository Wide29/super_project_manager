from app.domain.sampling.planner import build_sampling_plan


def test_build_sampling_plan_keeps_high_risk_tasks() -> None:
    ratio, selected, flags, used_fallback = build_sampling_plan(
        [{"task_id": "t-1", "risk_level": "high"}, {"task_id": "t-2", "risk_level": "low"}],
        {"batch_risk_level": "high"},
        {
            "ratio_by_risk_level": {"low": 0.1, "medium": 0.2, "high": 0.3},
            "forced_risk_levels": ["high"],
            "fallback_to_first_available": True,
        },
    )

    assert ratio == 0.3
    assert selected == ["t-1"]
    assert "expand_sampling" in flags
    assert used_fallback is False


def test_build_sampling_plan_falls_back_to_first_task_when_no_high_risk() -> None:
    ratio, selected, flags, used_fallback = build_sampling_plan(
        [{"task_id": "t-1", "risk_level": "low"}, {"task_id": "t-2", "risk_level": "medium"}],
        {"batch_risk_level": "medium"},
        {
            "ratio_by_risk_level": {"low": 0.1, "medium": 0.2, "high": 0.3},
            "forced_risk_levels": ["high"],
            "fallback_to_first_available": True,
        },
    )

    assert ratio == 0.2
    assert selected == ["t-2"]
    assert flags == ["fallback_to_first_available_task"]
    assert used_fallback is True


def test_build_sampling_plan_fills_ratio_target_after_forced_high_risk_tasks() -> None:
    ratio, selected, flags, used_fallback = build_sampling_plan(
        [
            {"task_id": "t-1", "risk_level": "high"},
            {"task_id": "t-2", "risk_level": "medium"},
            {"task_id": "t-3", "risk_level": "low"},
            {"task_id": "t-4", "risk_level": "low"},
        ],
        {"batch_risk_level": "high", "task_count": 10},
        {
            "ratio_by_risk_level": {"low": 0.1, "medium": 0.2, "high": 0.3},
            "forced_risk_levels": ["high"],
            "fallback_to_first_available": True,
        },
    )

    assert ratio == 0.3
    assert selected == ["t-1", "t-3", "t-2"]
    assert "expand_sampling" in flags
    assert used_fallback is False


def test_build_sampling_plan_forced_high_risk_overrides_lower_target_sample_count() -> None:
    ratio, selected, flags, used_fallback = build_sampling_plan(
        [
            {"task_id": "t-1", "risk_level": "high"},
            {"task_id": "t-2", "risk_level": "high"},
            {"task_id": "t-3", "risk_level": "low"},
        ],
        {
            "batch_risk_level": "low",
            "task_count": 3,
            "target_sample_count": 1,
        },
        {
            "ratio_by_risk_level": {"low": 0.1, "medium": 0.2, "high": 0.3},
            "forced_risk_levels": ["high"],
            "fallback_to_first_available": True,
        },
    )

    assert ratio == 0.1
    assert selected == ["t-1", "t-2"]
    assert flags == []
    assert used_fallback is False


def test_build_sampling_plan_uses_seeded_random_baseline_selection() -> None:
    ratio, selected, flags, used_fallback = build_sampling_plan(
        [
            {"task_id": "t-1", "risk_level": "low"},
            {"task_id": "t-2", "risk_level": "low"},
            {"task_id": "t-3", "risk_level": "medium"},
            {"task_id": "t-4", "risk_level": "low"},
        ],
        {
            "batch_risk_level": "high",
            "task_count": 6,
            "sampling_seed": "batch-seed-7",
        },
        {
            "ratio_by_risk_level": {"low": 0.1, "medium": 0.2, "high": 0.5},
            "forced_risk_levels": ["high"],
            "fallback_to_first_available": True,
        },
    )

    assert ratio == 0.5
    assert selected == ["t-4", "t-2", "t-3"]
    assert flags == ["expand_sampling", "fallback_to_first_available_task"]
    assert used_fallback is True
