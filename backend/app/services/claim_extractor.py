import logging
import json
import uuid
import traceback
from sqlalchemy import update
from app.models.claim import Claim, ClaimStatus
from app.models.verdict import Verdict, VerdictTag
from app.core.database import AsyncSessionLocal
from app.core.config import settings

# --- 1. KNOWLEDGE BASE & MAPPING ---

# Voter Education Resources for 2028 PH Elections
VOTER_RESOURCES = {
    "registration": "📢 Para sa registration status, bisitahin ang COMELEC 'Voter Care' portal: https://comelec.gov.ph",
    "voting_rights": "⚖️ Alamin ang iyong karapatan! Basahin ang 'Your Vote. Our Future.' manual mula sa Ombudsman.",
    "hotline": "📞 Kailangan ng tulong? Mag-email sa COMELEC: law@comelec.gov.ph"
}

# Maps AI string output to SQLAlchemy Enum
VALID_TAGS = {
    "true": VerdictTag.TRUE,
    "mostly_true": VerdictTag.MOSTLY_TRUE,
    "misleading": VerdictTag.MISLEADING,
    "false": VerdictTag.FALSE,
    "unverifiable": VerdictTag.UNVERIFIABLE,
    "credit_grab": VerdictTag.CREDIT_GRAB
}

# --- 2. THE CORE AGENT ---

async def extract_and_verify_claim(claim_id: uuid.UUID, raw_text: str, tavily, groq):
    async with AsyncSessionLocal() as db:
        try:
            # A. Update status to PROCESSING
            await db.execute(
                update(Claim)
                .where(Claim.id == claim_id)
                .values(status=ClaimStatus.PROCESSING)
            )
            await db.commit()

            # B. Research Phase: Search 2026 Budget & Official Records
            search_query = f"funding source and project details Philippines: {raw_text}"
            search = await tavily.search(
                query=search_query,
                search_depth="advanced",
                max_results=7,
                include_domains=[
                    "blockchain.open.gov.ph", "dict.gov.ph", "dbm.gov.ph", 
                    "coa.gov.ph", "foi.gov.ph", "dpwh.gov.ph", "neda.gov.ph",
                    "rappler.com", "verafiles.org", "tsek.ph", "inquirer.net",
                    "officialgazette.gov.ph", "pna.gov.ph"
                ]
            )
            
            context = "\n".join([f"SOURCE: {r['url']}\nCONTENT: {r['content']}" for r in search.get('results', [])])

            # C. The "Anti-Credit Grab" & 2026 Context Prompt
            prompt = f"""
### ROLE
Lead Fact-Checker for the 2028 PH Elections. Expert in the 'Digital Bayanihan Chain' (GAA Blockchain).

### CONTEXT
The Philippines 2026-2028 budgets are on a permanent, tamper-proof digital ledger (Digital Bayanihan Chain).

### CORE TASK: CREDIT-GRAB DETECTION
A "Credit Grab" occurs when a politician implies they funded a project personally or are the sole reason it exists, when in fact it is a 2026-2028 GAA project funded by the National Budget.

### INPUT
- CLAIM: "{raw_text}"
- RESEARCH CONTEXT: {context}

### INSTRUCTIONS
1. FUNDING CHECK: Look for keywords like "GAA", "National Budget", "Government Grant".
2. TIMELINE CHECK: Did the project start before the candidate was in office?
3. VERDICT RULES:
   - If candidate says "I built this" but it's a DBM-approved project: Tag 'credit_grab'.
   - If candidate says "My gift to you" for a public bridge: Tag 'misleading'.
   - If project appears in DPWH 2026-2028 AIP: Tag 'credit_grab'.

### OUTPUT (JSON ONLY)
{{
    "analysis_thought": "Reasoning about the GAA 2026 records...",
    "claim_summary": "One sentence summary in the original language.",
    "tag": "true | mostly_true | misleading | false | credit_grab | unverifiable",
    "explanation": "State clearly if it was a GAA-funded project. Reference the 2026 Digital Bayanihan Chain.",
    "confidence_score": 0.0 to 1.0,
    "source_bias": "Assess if the source is an official ledger or a campaign social media post.",
    "primary_source": "URL (favor .gov.ph blockchain portals)"
}}
"""
            response = await groq.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": "You are a professional fact-checker. You strictly output JSON."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.1 
            )

            data = json.loads(response.choices[0].message.content)

            # D. Confidence & Tag Normalization
            confidence = data.get("confidence_score", 0.0)
            raw_tag = data.get("tag", "unverifiable").lower().strip()
            tag = VALID_TAGS.get(raw_tag, VerdictTag.UNVERIFIABLE)
            explanation = data.get("explanation", "")

            if confidence < 0.70:
                tag = VerdictTag.UNVERIFIABLE
                explanation = f"⚠️ [Low Confidence Analysis] {explanation}"

            # E. Voter Education Injection
            text_for_check = (raw_text + explanation).lower()
            if any(word in text_for_check for word in ["register", "rehistro", "listahan", "comelec"]):
                explanation += f"\n\n{VOTER_RESOURCES['registration']}"
            elif any(word in text_for_check for word in ["rights", "karapatan", "boto", "rights"]):
                explanation += f"\n\n{VOTER_RESOURCES['voting_rights']}"

            # F. Atomic Save
            # Update the Claim record
            await db.execute(
                update(Claim)
                .where(Claim.id == claim_id)
                .values(
                    raw_text=data.get('claim_summary', raw_text),
                    status=ClaimStatus.DONE
                )
            )

            # Create the Verdict record
            new_verdict = Verdict(
                claim_id=claim_id,
                tag=tag,
                explanation=explanation,
                sources=data.get('primary_source'),
                confidence=confidence,
                bias_note=data.get('source_bias') # Saving the AI's bias assessment
            )
            
            db.add(new_verdict)
            await db.commit()
            print(f"✅ Success: Verdict saved for claim {claim_id}")

        except Exception as e:
            logging.error(f"❌ AGENT ERROR: {str(e)}")
            traceback.print_exc() # This will show exactly which line failed in your terminal
            await db.rollback()
            await db.execute(
                update(Claim)
                .where(Claim.id == claim_id)
                .values(status=ClaimStatus.FAILED)
            )
            await db.commit()