"""
Domain & Reputation Verification Engine for SentinelGuard.
Includes SSRF Protection, domain matching, and blacklist resolution.
"""

import ipaddress
import socket
from urllib.parse import urlparse
from typing import Dict, List, Tuple, Any

KNOWN_SCAM_DOMAINS = {
    "careers-google-verify.top",
    "telegram.me/global_hr_task",
    "infosys-onboarding.xyz",
    "amazon-workfromhome.club",
    "apexmedia-intl.online",
    "daily-earn-tasks.site",
    "fresher-hiring-portal.click"
}

SUSPICIOUS_TLDS = {
    ".top", ".xyz", ".club", ".online", ".site", ".work",
    ".click", ".biz", ".info", ".live", ".buzz"
}


class DomainVerifier:
    def __init__(self):
        self.blacklist = set(KNOWN_SCAM_DOMAINS)

    def is_private_ip(self, hostname: str) -> bool:
        """SSRF protection: prevents connecting to internal cloud or private network endpoints."""
        try:
            ip = socket.gethostbyname(hostname)
            ip_obj = ipaddress.ip_address(ip)
            return ip_obj.is_private or ip_obj.is_loopback or ip_obj.is_link_local
        except Exception:
            return False

    def evaluate_reputation(self, job_data: Dict[str, Any]) -> Tuple[int, List[Dict[str, Any]], List[Dict[str, Any]]]:
        """
        Evaluates domain veracity and reputation score.
        Returns:
            domain_score: int (0 to 100)
            warning_signals: list of dicts
            trust_signals: list of dicts
        """
        email = (job_data.get("recruiteremail") or "").strip().lower()
        company = (job_data.get("company") or "").strip()
        url = (job_data.get("sourceurl") or "").strip()

        score = 0
        warning_signals = []
        trust_signals = []

        # 1. Threat Blacklist Lookups
        for bl in self.blacklist:
            if bl in email or (url and bl in url):
                score += 85
                warning_signals.append({
                    "code": "KNOWN_SCAM_DOMAIN",
                    "severity": "high",
                    "name": "Identified Fraud Domain Blacklist Match",
                    "explanation": f"The domain '{bl}' has been confirmed in multiple prior student scam investigations."
                })
                break

        # 2. Company vs Email Domain Discrepancy
        if email and "@" in email and company:
            email_domain = email.split("@")[-1]
            clean_company = "".join(c for c in company.lower() if c.isalnum())
            clean_domain = "".join(c for c in email_domain if c.isalnum())

            # Only check for non-generic mail domains
            if not any(email_domain.startswith(g) for g in ["gmail", "yahoo", "hotmail", "outlook"]):
                if len(clean_company) >= 4 and clean_company[:5] not in clean_domain:
                    score += 25
                    warning_signals.append({
                        "code": "DOMAIN_COMPANY_MISMATCH",
                        "severity": "medium",
                        "name": "Recruiter Domain Mismatch",
                        "explanation": f"Recruiter domain (@{email_domain}) does not align with company name '{company}'."
                    })
                else:
                    trust_signals.append({
                        "code": "DOMAIN_COMPANY_MATCH",
                        "name": "Recruiter Domain Matches Employer Name",
                        "explanation": f"Recruiter address domain (@{email_domain}) correlates directly with '{company}'."
                    })

        # 3. High-Abuse Top-Level Domain
        target_domains = [email.split("@")[-1]] if "@" in email else []
        if url:
            try:
                parsed = urlparse(url)
                if parsed.netloc:
                    target_domains.append(parsed.netloc)
            except Exception:
                pass

        for dom in target_domains:
            if any(dom.endswith(tld) for tld in SUSPICIOUS_TLDS):
                score += 20
                warning_signals.append({
                    "code": "HIGH_ABUSE_TLD",
                    "severity": "medium",
                    "name": "High-Abuse Top-Level Domain Detected",
                    "explanation": f"Host '{dom}' utilizes a top-level domain frequently associated with temporary scam infrastructure."
                })
                break

        return min(100, max(0, score)), warning_signals, trust_signals
