from fastapi.testclient import TestClient

from app.main import create_app


def test_batch_sampling_for_high_risk_batch_expands_ratio() -> None:
    client = TestClient(create_app())

    response = client.post(
        "/api/v1/sampling/batch-plan",
        json={
            "batch_id": "batch-1",
            "project_id": "project-1",
            "task_pool": [
                {"task_id": "t-1", "risk_level": "high"},
                {"task_id": "t-2", "risk_level": "low"},
            ],
            "context": {"batch_risk_level": "high", "task_count": 20},
        },
    )

    assert response.status_code == 200
    body = response.json()

    assert body["service"] == "sampling"
    assert body["service_version"] == "v1"
    assert body["rule_version"] == "sampling_rules_v1"
    assert body["feature_version"] == "sampling_feature_v1"
    assert body["result"]["sampling_ratio"] >= 0.3
    assert body["result"]["sample_count"] == 1
    assert body["result"]["selected_task_ids"] == ["t-1"]
    assert body["result"]["recommendation_flags"] == ["expand_sampling"]
    assert body["reasons"] == [
        {
            "code": "sampling_ratio_selected",
            "message": "Sampling ratio set to 30% for a high-risk batch.",
        }
    ]
    assert body["warnings"] == []


def test_batch_sampling_returns_warning_when_fallback_selection_is_used() -> None:
    client = TestClient(create_app())

    response = client.post(
        "/api/v1/sampling/batch-plan",
        json={
            "batch_id": "batch-2",
            "project_id": "project-1",
            "task_pool": [
                {"task_id": "t-1", "risk_level": "low"},
                {"task_id": "t-2", "risk_level": "medium"},
            ],
            "context": {"batch_risk_level": "medium", "task_count": 2},
        },
    )

    assert response.status_code == 200
    body = response.json()

    assert body["result"]["sampling_ratio"] == 0.2
    assert body["result"]["selected_task_ids"] == ["t-1"]
    assert body["result"]["recommendation_flags"] == ["fallback_to_first_available_task"]
    assert body["warnings"] == [
        {
            "code": "sampling_fallback_applied",
            "message": "No high-risk task was available, so the first task was selected as a fallback.",
        }
    ]
