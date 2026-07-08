from app.domain.common.types import RuleConfig

DEFAULT_RULES: dict[str, dict] = {
    "health": {},
    "matching": {
        "base_score": 100.0,
        "active_load_penalty": 5.0,
        "pass_rate_bonus": 10.0,
        "strong_pass_rate_threshold": 0.9,
        "high_load_threshold": 3,
        "rework_original_worker_boost": 20.0,
    },
    "task_risk": {
        "signals": {
            "rework_count_high": {"threshold": 2, "score": 40},
            "deadline_pressure": {"threshold_hours": 4, "score": 30},
            "historical_defect_high": {"threshold": 0.3, "score": 30},
        },
        "level_thresholds": {"medium": 40, "high": 70},
    },
    "worker_risk": {
        "signals": {
            "pass_rate_drop": {"threshold": 0.8, "score": 40},
            "rework_rate_high": {"threshold": 0.2, "score": 30},
            "load_high": {"threshold": 5, "score": 20},
        },
        "level_thresholds": {"medium": 40, "high": 70},
    },
    "sampling": {
        "ratio_by_risk_level": {"low": 0.1, "medium": 0.2, "high": 0.3},
        "forced_risk_levels": ["high"],
        "fallback_to_first_available": True,
    },
}

PROJECT_RULE_OVERRIDES: dict[str, dict[str, dict]] = {}


class RuleRepository:
    def get_rule(self, rule_type: str, project_id: str | None = None) -> RuleConfig:
        default_config = DEFAULT_RULES.get(rule_type, {})
        project_overrides = PROJECT_RULE_OVERRIDES.get(project_id or "", {}).get(rule_type, {})
        return RuleConfig(
            rule_type=rule_type,
            rule_version=f"{rule_type}_rules_v1",
            config={
                "project_id": project_id,
                **default_config,
                **project_overrides,
            },
        )
