DEFAULT_SAMPLING_CONFIG = {
    "ratio_by_risk_level": {"low": 0.1, "medium": 0.2, "high": 0.3},
    "forced_risk_levels": ["high"],
    "fallback_to_first_available": True,
}


def choose_sampling_ratio(
    batch_risk_level: str,
    config: dict | None = None,
) -> float:
    config = config or DEFAULT_SAMPLING_CONFIG
    ratios = config.get("ratio_by_risk_level", DEFAULT_SAMPLING_CONFIG["ratio_by_risk_level"])
    return float(ratios.get(batch_risk_level, ratios.get("low", 0.1)))
