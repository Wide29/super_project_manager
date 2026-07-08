from hashlib import sha256
from random import Random

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
    if batch_risk_level in ratios:
        return float(ratios[batch_risk_level])
    return float(ratios.get("high", max(ratios.values(), default=0.3)))


def choose_seeded_baseline_tasks(
    candidate_task_ids: list[str],
    selection_count: int,
    seed: str | int | None,
) -> list[str]:
    if selection_count <= 0 or not candidate_task_ids:
        return []

    if selection_count >= len(candidate_task_ids):
        return list(_shuffle_ids(candidate_task_ids, seed))

    shuffled_task_ids = _shuffle_ids(candidate_task_ids, seed)
    return shuffled_task_ids[:selection_count]


def _shuffle_ids(task_ids: list[str], seed: str | int | None) -> list[str]:
    shuffled = list(task_ids)
    if len(shuffled) < 2:
        return shuffled

    seed_value = "sampling-default" if seed is None else str(seed)
    seed_digest = sha256(seed_value.encode("utf-8")).digest()
    rng = Random(int.from_bytes(seed_digest[:8], byteorder="big", signed=False))
    rng.shuffle(shuffled)
    return shuffled
