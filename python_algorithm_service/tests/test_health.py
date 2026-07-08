from fastapi.testclient import TestClient

from app.main import create_app


def test_health_endpoint_returns_envelope_with_versions() -> None:
    client = TestClient(create_app())

    response = client.get("/health")

    assert response.status_code == 200
    body = response.json()

    assert body["service"] == "health"
    assert body["service_version"] == "v1"
    assert body["rule_version"] == "health_rules_v1"
    assert body["feature_version"] == "health_feature_v1"
    assert body["result"] == {"status": "ok"}
    assert body["reasons"] == []
    assert body["warnings"] == []
    assert body["debug"] == {}
    assert isinstance(body["request_id"], str)
    assert len(body["request_id"]) > 0
