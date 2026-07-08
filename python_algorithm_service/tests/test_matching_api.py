from fastapi.testclient import TestClient

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
                    "worker-b": {"active_load": 1, "pass_rate": 0.9},
                },
            },
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["service"] == "matching"
    assert body["result"]["recommendations"][0]["worker_id"] == "worker-b"
