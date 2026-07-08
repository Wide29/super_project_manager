from app.domain.common.types import RuleConfig


class RuleRepository:
    def get_rule(self, rule_type: str, project_id: str | None = None) -> RuleConfig:
        return RuleConfig(
            rule_type=rule_type,
            rule_version=f"{rule_type}_rules_v1",
            config={"project_id": project_id},
        )
