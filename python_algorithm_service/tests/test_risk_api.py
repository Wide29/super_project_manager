from fastapi.testclient import TestClient

from app.api.routes import risk as risk_routes
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
    assert body["reasons"] == [
        {
            "code": "rework_count_high",
            "message": "Rework count is above the high-risk threshold.",
        },
        {
            "code": "deadline_pressure",
            "message": "Deadline is too close and increases delivery pressure.",
        },
        {
            "code": "historical_defect_high",
            "message": "Historical defect rate is above the acceptable threshold.",
        },
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


def test_worker_risk_rejects_unknown_window_type_with_error_envelope() -> None:
    client = TestClient(create_app())

    response = client.post(
        "/api/v1/risk/worker-score",
        json={
            "worker_id": "worker-1",
            "project_id": "project-1",
            "window_type": "2d",
            "context": {},
        },
    )

    assert response.status_code == 422
    body = response.json()
    assert body["service"] == "risk"
    assert body["reasons"][0]["code"] == "validation_error"
    assert body["debug"]["errors"][0]["loc"][-1] == "window_type"


def test_risk_route_wraps_unhandled_exceptions_in_error_envelope(monkeypatch) -> None:
    client = TestClient(create_app(), raise_server_exceptions=False)

    def raise_unhandled(_payload):
        raise RuntimeError("boom")

    monkeypatch.setattr(risk_routes.service, "score_task", raise_unhandled)

    response = client.post(
        "/api/v1/risk/task-score",
        json={
            "task_id": "task-1",
            "project_id": "project-1",
            "context": {},
        },
    )

    assert response.status_code == 500
    body = response.json()
    assert body["service"] == "risk"
    assert body["service_version"] == "v1"
    assert body["rule_version"] == "unavailable"
    assert body["feature_version"] == "unavailable"
    assert body["result"] == {}
    assert body["reasons"] == [
        {
            "code": "internal_error",
            "message": "The service could not complete the request.",
        }
    ]
    assert body["warnings"] == []
