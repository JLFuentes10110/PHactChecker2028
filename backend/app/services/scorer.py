"""
Scorer Service
--------------
Converts raw model output into a structured verdict tag + confidence score.
"""

VERDICT_THRESHOLDS = {
    "true": 0.85,
    "mostly_true": 0.70,
    "misleading": 0.55,
    "false": 0.40,
    "credit_grab": 0.50,
    "unverifiable": 0.0,
}

def score_to_tag(confidence: float, raw_tag: str) -> str:
    """
    Validate and normalize a tag based on confidence threshold.
    Falls back to 'unverifiable' if confidence is too low.
    """
    threshold = VERDICT_THRESHOLDS.get(raw_tag, 0.0)
    if confidence < threshold:
        return "unverifiable"
    return raw_tag
