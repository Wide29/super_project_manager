from app.domain.matching.policies import apply_policies
from app.domain.matching.scorer import score_candidate


def test_score_candidate_uses_feature_aligned_recent_pass_rate() -> None:
    score, reasons, warnings = score_candidate(
        "worker-b",
        {"active_load": 1, "recent_pass_rate": 0.9},
    )

    assert score == 104.0
    assert "recent_pass_rate_considered" in reasons
    assert warnings == []


def test_apply_policies_boosts_original_worker_for_rework() -> None:
    base_score, _, _ = score_candidate(
        "worker-b",
        {"active_load": 1, "recent_pass_rate": 0.9},
    )

    boosted, reasons, warnings = apply_policies(
        "worker-b",
        base_score,
        {"is_rework": True, "original_worker_id": "worker-b"},
    )

    assert boosted > base_score
    assert reasons == ["rework_original_worker_preferred"]
    assert warnings == []


def test_matching_domain_uses_rule_config_for_scoring_and_policy_thresholds() -> None:
    score, reasons, warnings = score_candidate(
        "worker-a",
        {"active_load": 4, "recent_pass_rate": 0.86},
        {
            "base_score": 90.0,
            "active_load_penalty": 6.0,
            "pass_rate_bonus": 20.0,
            "strong_pass_rate_threshold": 0.85,
            "high_load_threshold": 5,
        },
    )

    boosted, policy_reasons, policy_warnings = apply_policies(
        "worker-a",
        score,
        {"is_rework": True, "original_worker_id": "worker-a"},
        {"rework_original_worker_boost": 8.0},
    )

    assert score == 83.2
    assert reasons == [
        "active_load_considered",
        "recent_pass_rate_considered",
        "recent_pass_rate_high",
    ]
    assert warnings == []
    assert boosted == 91.2
    assert policy_reasons == ["rework_original_worker_preferred"]
    assert policy_warnings == []
