"""
Rule-Based Detection Engine for SentinelGuard Decision-Support System.
Evaluates explicit scam heuristics and generates structured reason codes.
"""

import re
from typing import Dict, List, Tuple, Any

FREE_EMAIL_DOMAINS = {
    "gmail.com", "yahoo.com", "hotmail.com", "outlook.com",
    "aol.com", "protonmail.com", "proton.me", "icloud.com", "zoho.com"
}

SHORTENER_DOMAINS = {
    "bit.ly", "tinyurl.com", "goo.gl", "t.co", "ow.ly",
    "is.gd", "buff.ly", "adf.ly", "bit.do", "cutt.ly", "rb.gy"
}

SUSPICIOUS_TLDS = {
    ".top", ".xyz", ".club", ".online", ".site", ".work",
    ".click", ".biz", ".info", ".live", ".buzz"
}


class RuleEngine:
    def __init__(self):
        self.payment_patterns = re.compile(
            r"(registration\s+fee|training\s+fee|security\s+deposit|refundable\s+(deposit|fee)|laptop\s+charge|pay\s+₹|pay\s+\$|processing\s+charge|software\s+license\s+fee|upi\s+transfer|advance\s+fee)",
            re.IGNORECASE
        )
        self.messaging_patterns = re.compile(
            r"(telegram|@\w*hr|whatsapp\s+only|chat\s+on\s+whatsapp|t\.me\/|connect\s+on\s+telegram|contact\s+via\s+telegram)",
            re.IGNORECASE
        )
        self.urgency_patterns = re.compile(
            r"(urgent\s+opening|join\s+immediately|limited\s+(vacancies|seats)|immediate\s+hiring|apply\s+today\s+only|hurry\s+up|act\s+fast)",
            re.IGNORECASE
        )
        self.sensitive_data_patterns = re.compile(
            r"(aadhaar|bank\s+account(\s+number)?|otp|passport\s+copy|ssn|social\s+security|credit\s+card|debit\s+card|net\s*banking)",
            re.IGNORECASE
        )
        self.no_interview_patterns = re.compile(
            r"(no\s+interview|instant\s+selection|no\s+resume|guaranteed\s+job|direct\s+joining|no\s+screening)",
            re.IGNORECASE
        )

    def evaluate(self, job_data: Dict[str, Any]) -> Tuple[int, List[Dict[str, Any]], List[Dict[str, Any]]]:
        """
        Executes heuristic rule checks.
        Returns:
            rule_score: int (0 to 100)
            warning_signals: list of dicts with code, name, severity, explanation
            trust_signals: list of dicts with code, name, explanation
        """
        title = job_data.get("title", "")
        company = job_data.get("company", "")
        salary = job_data.get("salary", "") or ""
        email = (job_data.get("recruiteremail") or "").strip().lower()
        url = (job_data.get("sourceurl") or "").strip()
        description = job_data.get("description", "")
        full_text = f"{title} {company} {salary} {description}".lower()

        raw_score = 0
        warning_signals = []
        trust_signals = []

        # 1. Recruiter Free Webmail Domain Check
        if email:
            domain = email.split("@")[-1] if "@" in email else ""
            if domain in FREE_EMAIL_DOMAINS:
                raw_score += 28
                warning_signals.append({
                    "code": "FREE_EMAIL_DOMAIN",
                    "severity": "high",
                    "name": "Free Webmail Recruiter Address",
                    "explanation": f"Recruiter contact (@{domain}) uses a free public mailbox instead of a verified corporate domain."
                })
            else:
                trust_signals.append({
                    "code": "CORPORATE_DOMAIN_EMAIL",
                    "name": "Custom Organization Email Domain",
                    "explanation": f"Recruiter uses custom domain (@{domain}), indicating organizational infrastructure."
                })
        else:
            warning_signals.append({
                "code": "EMAIL_MISSING",
                "severity": "low",
                "name": "No Recruiter Contact Email Disclosed",
                "explanation": "No direct employer or recruitment contact email provided in the post."
            })

        # 2. Payment, Registration, or Security Deposit Demand
        if self.payment_patterns.search(full_text):
            raw_score += 35
            warning_signals.append({
                "code": "PAYMENT_REQUESTED",
                "severity": "high",
                "name": "Upfront Fee or Deposit Demanded",
                "explanation": "Listing requests payments for training, registration, security clearance, or software. Legitimate companies never charge candidates."
            })

        # 3. Off-Platform Messaging Channels (Telegram / WhatsApp Only)
        if self.messaging_patterns.search(full_text):
            raw_score += 26
            warning_signals.append({
                "code": "OFF_PLATFORM_COMMUNICATION",
                "severity": "high",
                "name": "Messaging App Redirection (Telegram/WhatsApp)",
                "explanation": "Directs applicant to unmonitored messaging apps, preventing corporate paper trails."
            })

        # 4. Premature Sensitive Data Harvesting
        if self.sensitive_data_patterns.search(full_text):
            raw_score += 30
            warning_signals.append({
                "code": "SENSITIVE_DATA_HARVESTING",
                "severity": "high",
                "name": "Premature Identity or Bank Account Request",
                "explanation": "Demands government IDs, bank details, or sensitive financial data before a formal job offer."
            })

        # 5. High-Pressure Urgency Tactics
        if self.urgency_patterns.search(full_text):
            raw_score += 15
            warning_signals.append({
                "code": "ARTIFICIAL_URGENCY",
                "severity": "medium",
                "name": "High-Pressure Urgency Language",
                "explanation": "Uses psychological rush phrasing ('Join immediately', 'Limited vacancies') to discourage due diligence."
            })

        # 6. Absence of Structured Interview
        if self.no_interview_patterns.search(full_text):
            raw_score += 20
            warning_signals.append({
                "code": "NO_FORMAL_INTERVIEW",
                "severity": "medium",
                "name": "Immediate Offer Without Interview",
                "explanation": "Promises instantaneous hiring without video/in-person evaluation or technical assessment."
            })

        # 7. Shortened or Suspicious URL
        if url:
            is_shortened = any(short_dom in url for short_dom in SHORTENER_DOMAINS)
            if is_shortened:
                raw_score += 18
                warning_signals.append({
                    "code": "SHORTENED_URL",
                    "severity": "medium",
                    "name": "Shortened or Cloaked URL",
                    "explanation": "Application link conceals true host destination using link redirection."
                })

            if url.startswith("https://"):
                trust_signals.append({
                    "code": "HTTPS_SECURE",
                    "name": "Encrypted Connection (HTTPS)",
                    "explanation": "Application endpoint uses SSL/TLS certificate encryption."
                })

        # 8. Excessive Capitalization Check
        words = [w for w in description.split() if len(w) > 2]
        if len(words) > 15:
            upper_count = sum(1 for w in words if w.isupper() and any(c.isalpha() for c in w))
            if (upper_count / len(words)) > 0.20:
                raw_score += 12
                warning_signals.append({
                    "code": "EXCESSIVE_CAPITALIZATION",
                    "severity": "low",
                    "name": "Excessive All-Caps Typography",
                    "explanation": "Significant portion of text written in full uppercase letters, inconsistent with corporate communication."
                })

        # Calibrate rule score between 0 and 100
        final_rule_score = min(100, max(0, raw_score))
        return final_rule_score, warning_signals, trust_signals
