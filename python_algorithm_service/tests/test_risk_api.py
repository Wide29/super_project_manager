from fastapi.testclient import TestClient

from app.main import create_app


def test_task_risk_returns_high_when_rework_and_deadline_pressure() -> None:
    client = TestClient(create_app())

    response = client.post(
        "/api/v1/risk/task-score",
        json={
            "task_id": "task-1",
            "project_id": "project-1",
            "context": {
                "rework_count": 2,
                "deadline_hours_left": 2,
                "historical_defect_rate": 0.4,
            },
        },
    )

    assert response.status_code == 200
    body = response.json()

    assert body["service"] == "risk"
    assert body["service_version"] == "v1"
    assert body["rule_version"] == "task_risk_rules_v1"
    assert body["feature_version"] == "task_risk_feature_v1"
    assert body["result"]["risk_level"] == "high"
    assert body["result"]["risk_score"] == 100
    assert body["result"]["reason_codes"] == [
        "rework_count_high",
        "deadline_pressure",
        "historical_defect_high",
    ]


def test_worker_risk_returns_window_type_and_high_risk() -> None:
    client = TestClient(create_app())

    response = client.post(
        "/api/v1/risk/worker-score",
        json={
            "worker_id": "worker-1",
            "project_id": "project-1",
            "window_type": "14d",
            "context": {
                "recent_pass_rate": 0.7,
                "recent_rework_rate": 0.25,
                "active_load": 5,
            },
        },
    )

    assert response.status_code == 200
    body = response.json()

    assert body["service"] == "risk"
    assert body["rule_version"] == "worker_risk_rules_v1"
    assert body["feature_version"] == "worker_risk_feature_v1"
    assert body["result"]["window_type"] == "14d"
    assert body["result"]["risk_level"] == "high"
