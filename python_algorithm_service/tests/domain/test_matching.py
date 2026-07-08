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
