"""
Claim Extractor Service
-----------------------
Stub for Phase 1 MVP. Will be replaced with NLP pipeline
(spaCy Tagalog + xlm-roberta NER) in Phase 2.
"""
from uuid import UUID

async def extract_claims(claim_id: UUID, raw_text: str) -> list[str]:
    """
    Extract discrete factual claims from raw text.
    Currently returns the raw text as a single claim (stub).
    
    TODO Phase 2:
    - Language detection (fasttext)
    - Sentence segmentation (stanza Tagalog)
    - NER via xlm-roberta-ner
    - Claim likelihood classifier
    """
    print(f"[ClaimExtractor] Processing claim {claim_id}")
    # Stub: treat the whole text as one claim
    return [raw_text.strip()]
