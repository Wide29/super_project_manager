from fastapi.testclient import TestClient

from app.infra.settings import settings
from app.main import create_app


def test_matching_returns_original_worker_first_for_rework() -> None:
    client = TestClient(create_app())

    response = client.post(
        "/api/v1/matching/recommend-task-workers",
        json={
            "task_id": "task-1",
            "project_id": "project-1",
            "batch_id": "batch-1",
            "candidate_worker_ids": ["worker-a", "worker-b"],
            "top_k": 2,
            "context": {
                "is_rework": True,
                "original_worker_id": "worker-b",
                "worker_profiles": {
                    "worker-a": {"active_load": 1, "pass_rate": 0.95},
                    "worker-b": {"active_load": 3, "pass_rate": 0.9},
                },
            },
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["service"] == "matching"
    assert body["result"]["recommendations"][0]["worker_id"] == "worker-b"
    assert body["result"]["recommendations"][0]["reasons"][-1] == "rework_original_worker_preferred"
    assert body["result"]["recommendations"][0]["warnings"] == ["load_high"]
    assert body["reasons"][-1] == {
        "code": "rework_original_worker_preferred",
        "message": "Original worker received a rework continuity boost.",
    }
    assert body["warnings"] == [
        {
            "code": "load_high",
            "message": "Active workload is at or above the high-load threshold.",
        }
    ]


def test_matching_rejects_non_positive_top_k_with_error_envelope() -> None:
    client = TestClient(create_app())

    response = client.post(
        "/api/v1/matching/recommend-task-workers",
        json={
            "task_id": "task-1",
            "project_id": "project-1",
            "batch_id": "batch-1",
            "candidate_worker_ids": ["worker-a"],
            "top_k": 0,
            "context": {},
        },
    )

    assert response.status_code == 422
    body = response.json()
    assert body["service"] == "matching"
    assert body["service_version"] == "v1"
    assert body["rule_version"] == "unavailable"
    assert body["feature_version"] == "unavailable"
    assert body["result"] == {}
    assert body["reasons"][0]["code"] == "validation_error"
    assert body["warnings"] == []
    assert body["debug"]["errors"][0]["loc"][-1] == "top_k"


def test_matching_returns_401_when_api_key_is_missing() -> None:
    original_api_key = settings.api_key
    original_auth_header = settings.auth_header
    settings.api_key = "shared-secret"
    settings.auth_header = "X-Algorithm-Key"
    try:
        client = TestClient(create_app())

        response = client.post(
            "/api/v1/matching/recommend-task-workers",
            json={
                "task_id": "task-1",
                "project_id": "project-1",
                "batch_id": "batch-1",
                "candidate_worker_ids": ["worker-a"],
                "top_k": 1,
                "context": {},
            },
        )

        assert response.status_code == 401
        body = response.json()
        assert body["service"] == "matching"
        assert body["reasons"][0]["code"] == "unauthorized"
    finally:
        settings.api_key = original_api_key
        settings.auth_header = original_auth_header


def test_matching_accepts_request_when_api_key_header_is_valid() -> None:
    original_api_key = settings.api_key
    original_auth_header = settings.auth_header
    settings.api_key = "shared-secret"
    settings.auth_header = "X-Algorithm-Key"
    try:
        client = TestClient(create_app())

        response = client.post(
            "/api/v1/matching/recommend-task-workers",
            headers={"X-Algorithm-Key": "shared-secret"},
            json={
                "task_id": "task-1",
                "project_id": "project-1",
                "batch_id": "batch-1",
                "candidate_worker_ids": ["worker-a"],
                "top_k": 1,
                "context": {},
            },
        )

        assert response.status_code == 200
        assert response.json()["service"] == "matching"
    finally:
        settings.api_key = original_api_key
        settings.auth_header = original_auth_header
