/**
 * SENTINELGUARD AI - HYBRID RISK TRIANGULATION ENGINE (CLIENT & EDGE)
 * Matches the backend Python Scikit-Learn + Heuristic Architecture:
 * 1. Rule-based Heuristic Scorer (30% weight)
 * 2. NLP ML Linguistic Classifier (50% weight)
 * 3. Domain & Community Reputation Verification (20% weight)
 */

class HybridDetector {
  constructor() {
    this.freeEmailDomains = [
      'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 
      'aol.com', 'protonmail.com', 'proton.me', 'icloud.com', 'zoho.com'
    ];

    this.shortenerDomains = [
      'bit.ly', 'tinyurl.com', 'goo.gl', 't.co', 'ow.ly', 
      'is.gd', 'buff.ly', 'adf.ly', 'bit.do', 'cutt.ly', 'rb.gy'
    ];

    this.suspiciousTLDs = [
      '.top', '.xyz', '.club', '.online', '.site', '.work', 
      '.click', '.biz', '.info', '.live', '.buzz'
    ];

    this.knownBlacklist = [
      'careers-google-verify.top',
      'telegram.me/global_hr_task',
      'infosys-onboarding.xyz',
      'amazon-workfromhome.club',
      'apexmedia-intl.online'
    ];

    // ML Lexicon with weights
    this.fraudLexicon = {
      'deposit': 18,
      'registration fee': 25,
      'training fee': 25,
      'software license': 20,
      'telegram': 22,
      'whatsapp': 16,
      'daily': 12,
      'crypto': 18,
      'usdt': 20,
      'urgent opening': 14,
      'join immediately': 16,
      'limited vacancies': 14,
      'no experience': 10,
      'like videos': 24,
      'hotel review': 22,
      'part-time': 8,
      'aadhaar': 18,
      'bank account': 15,
      'refundable': 15,
      'no interview': 22,
      'commission': 12,
      'flexible hours': 8
    };

    this.legitLexicon = {
      'responsibilities': -12,
      'qualifications': -12,
      'bachelor\'s': -14,
      'master\'s': -15,
      'experience': -8,
      'engineering': -10,
      'collaborate': -10,
      'equal opportunity': -15,
      'benefits': -10,
      'health insurance': -15,
      '401k': -15,
      'provident fund': -12,
      'interview process': -15,
      'equity': -12,
      'technical assessment': -14,
      'unit tests': -12,
      'git': -8
    };
  }

  analyze(jobData) {
    const title = (jobData.title || '').trim();
    const company = (jobData.company || '').trim();
    const salary = (jobData.salary || '').trim();
    const email = (jobData.email || '').trim().toLowerCase();
    const url = (jobData.url || '').trim();
    const description = (jobData.description || '').trim();
    const fullText = `${title} ${company} ${salary} ${description}`.toLowerCase();

    const warningSignals = [];
    const trustSignals = [];

    // ==========================================
    // 1. RULE-BASED HEURISTICS
    // ==========================================
    let ruleScore = 0;

    // Rule: Free Email Domain Check
    if (email) {
      const emailDomain = email.split('@')[1] || '';
      if (this.freeEmailDomains.includes(emailDomain)) {
        ruleScore += 28;
        warningSignals.push({
          code: 'FREE_EMAIL_DOMAIN',
          severity: 'high',
          name: 'Free Webmail Recruiter Address',
          explanation: `The recruiter uses a free webmail service (@${emailDomain}). Established companies use corporate domain emails matching their registered organization.`
        });
      } else {
        trustSignals.push({
          code: 'CORPORATE_EMAIL',
          name: 'Custom Domain Recruiter Address',
          explanation: `Email is hosted on custom domain (@${emailDomain}), typical of structured organizations.`
        });
      }
    } else {
      warningSignals.push({
        code: 'EMAIL_MISSING',
        severity: 'low',
        name: 'No Recruiter Email Disclosed',
        explanation: 'The listing does not specify a direct recruiter email contact.'
      });
    }

    // Rule: Payment / Deposit / License Fee Demands
    const paymentRegex = /(registration\s+fee|training\s+fee|security\s+deposit|refundable\s+(deposit|fee)|laptop\s+charge|pay\s+₹|pay\s+\$|processing\s+charge|software\s+license\s+fee|upi\s+transfer)/i;
    if (paymentRegex.test(fullText)) {
      ruleScore += 35;
      warningSignals.push({
        code: 'PAYMENT_DEMAND',
        severity: 'high',
        name: 'Upfront Payment or Deposit Requested',
        explanation: 'The job post explicitly demands payment for onboarding, training, equipment, or application. Legitimate employers NEVER charge applicants.'
      });
    }

    // Rule: Off-Platform Communication (Telegram / WhatsApp Only)
    const messagingRegex = /(telegram|@\w*hr|whatsapp\s+only|chat\s+on\s+whatsapp|t\.me\/|connect\s+on\s+telegram)/i;
    if (messagingRegex.test(fullText)) {
      ruleScore += 26;
      warningSignals.push({
        code: 'OFF_PLATFORM_COMM',
        severity: 'high',
        name: 'Redirects to Messaging Apps (Telegram/WhatsApp)',
        explanation: 'The listing instructs candidates to communicate exclusively via Telegram or WhatsApp, a known hallmark of task and deposit scams.'
      });
    }

    // Rule: Premature Sensitive Document or Bank Requests
    const piiRegex = /(aadhaar|bank\s+account(\s+number)?|otp|passport\s+copy|ssn|social\s+security|credit\s+card)/i;
    if (piiRegex.test(fullText)) {
      ruleScore += 30;
      warningSignals.push({
        code: 'SENSITIVE_DATA_HARVESTING',
        severity: 'high',
        name: 'Premature Identity or Banking Data Requested',
        explanation: 'Requests government identity proofs or bank details before an interview. Legitimate HR only collects this post-offer for payroll.'
      });
    }

    // Rule: Artificial Urgency & Limited Vacancy Pressure
    const urgencyRegex = /(urgent\s+opening|join\s+immediately|limited\s+(vacancies|seats)|immediate\s+hiring|apply\s+today\s+only|hurry\s+up)/i;
    if (urgencyRegex.test(fullText)) {
      ruleScore += 16;
      warningSignals.push({
        code: 'ARTIFICIAL_URGENCY',
        severity: 'medium',
        name: 'High-Pressure Urgency Tactics',
        explanation: 'Employs psychological urgency phrases ("Join immediately", "Limited vacancies") designed to bypass student due diligence.'
      });
    }

    // Rule: No Interview / Instant Selection Claims
    const noInterviewRegex = /(no\s+interview|instant\s+selection|no\s+resume|guaranteed\s+job|direct\s+joining)/i;
    if (noInterviewRegex.test(fullText)) {
      ruleScore += 22;
      warningSignals.push({
        code: 'NO_INTERVIEW_PROCESS',
        severity: 'medium',
        name: 'Absence of Professional Interview',
        explanation: 'Claims candidates will be hired immediately without resume review or structured interview.'
      });
    }

    // Rule: Shortened or Cloaked URL
    if (url) {
      const isShortened = this.shortenerDomains.some(domain => url.includes(domain));
      if (isShortened) {
        ruleScore += 18;
        warningSignals.push({
          code: 'SHORTENED_URL',
          severity: 'medium',
          name: 'Shortened / Cloaked Application Link',
          explanation: 'The application URL uses a link shortener (e.g. bit.ly, tinyurl), masking the true destination website.'
        });
      }

      if (url.startsWith('https://')) {
        trustSignals.push({
          code: 'HTTPS_SECURE',
          name: 'Secure HTTPS Protocol',
          explanation: 'The provided application portal utilizes SSL/TLS encryption.'
        });
      }
    }

    // Rule: Excessive All-Caps / Poor Grammar Screamer
    const words = description.split(/\s+/).filter(w => w.length > 2);
    const upperWords = words.filter(w => w === w.toUpperCase() && /[A-Z]/.test(w));
    if (words.length > 10 && (upperWords.length / words.length) > 0.22) {
      ruleScore += 12;
      warningSignals.push({
        code: 'EXCESSIVE_CAPS',
        severity: 'low',
        name: 'Excessive Capitalization & Stylistic Anomalies',
        explanation: 'Over 20% of words are in ALL CAPS, atypical of professional corporate job requisitions.'
      });
    }

    ruleScore = Math.min(100, ruleScore);

    // ==========================================
    // 2. ML / NLP LINGUISTIC CLASSIFIER
    // ==========================================
    let fraudWordWeight = 0;
    let legitWordWeight = 0;

    for (const [phrase, weight] of Object.entries(this.fraudLexicon)) {
      if (fullText.includes(phrase)) {
        fraudWordWeight += weight;
      }
    }

    for (const [phrase, weight] of Object.entries(this.legitLexicon)) {
      if (fullText.includes(phrase)) {
        legitWordWeight += Math.abs(weight);
      }
    }

    // Logistic regression sigmoid projection: z = (fraud - legit) / scaling
    const zScore = (fraudWordWeight - legitWordWeight) / 18.0;
    const mlProbability = 1.0 / (1.0 + Math.exp(-zScore));
    const mlScore = Math.round(mlProbability * 100);

    if (legitWordWeight > 25) {
      trustSignals.push({
        code: 'STRUCTURED_REQUIREMENTS',
        name: 'Structured Technical Competencies',
        explanation: 'Job description outlines professional qualifications, technical responsibilities, and benefits.'
      });
    }

    // ==========================================
    // 3. DOMAIN & REPUTATION VERIFICATION
    // ==========================================
    let domainScore = 0;

    // Check Blacklist
    const isBlacklisted = this.knownBlacklist.some(b => 
      email.includes(b) || (url && url.includes(b))
    );

    if (isBlacklisted) {
      domainScore += 90;
      warningSignals.push({
        code: 'DOMAIN_BLACKLISTED',
        severity: 'high',
        name: 'Domain Present in Threat Blacklist',
        explanation: 'The recruiter domain or application URL appears in known student fraud reports.'
      });
    }

    // Compare email domain with company name
    if (email && company) {
      const emailDomain = email.split('@')[1] || '';
      const cleanCompany = company.toLowerCase().replace(/[^a-z0-9]/g, '');
      const cleanDomain = emailDomain.replace(/[^a-z0-9]/g, '');

      if (!this.freeEmailDomains.includes(emailDomain)) {
        if (cleanCompany.length > 4 && !cleanDomain.includes(cleanCompany.slice(0, 5))) {
          domainScore += 25;
          warningSignals.push({
            code: 'DOMAIN_MISMATCH',
            severity: 'medium',
            name: 'Company & Email Domain Discrepancy',
            explanation: `The recruiter email domain (@${emailDomain}) does not appear related to the declared company name "${company}".`
          });
        }
      }
    }

    // Suspicious TLD check
    if (email || url) {
      const hasSuspiciousTLD = this.suspiciousTLDs.some(tld => 
        email.endsWith(tld) || (url && url.includes(tld))
      );
      if (hasSuspiciousTLD) {
        domainScore += 25;
        warningSignals.push({
          code: 'SUSPICIOUS_TLD',
          severity: 'medium',
          name: 'High-Risk Top-Level Domain',
          explanation: 'Uses a high-abuse TLD (.top, .xyz, .club) commonly acquired for temporary scam campaigns.'
        });
      }
    }

    domainScore = Math.min(100, domainScore);

    // ==========================================
    // 4. TRIANGULATED FINAL RISK CALCULATION
    // ==========================================
    // Formula: 0.50 * ML + 0.30 * Rules + 0.20 * Domain
    let finalRiskScore = Math.round((0.50 * mlScore) + (0.30 * ruleScore) + (0.20 * domainScore));

    // Cap between 0 and 100
    finalRiskScore = Math.max(0, Math.min(100, finalRiskScore));

    // Determine Risk Tier
    let riskTier = 'low';
    let riskTierLabel = 'LOW RISK';
    let headline = 'No Critical Warning Signs Detected';
    let summary = 'This posting displays indicators consistent with authentic hiring practices. Exercise standard caution.';

    if (finalRiskScore >= 80) {
      riskTier = 'veryhigh';
      riskTierLabel = 'CRITICAL FRAUD RISK';
      headline = 'Multiple High-Severity Scam Patterns Flagged';
      summary = 'SentinelGuard strongly advises against sharing financial details, paying fees, or sending identity documents to this poster.';
    } else if (finalRiskScore >= 60) {
      riskTier = 'high';
      riskTierLabel = 'HIGH RISK';
      headline = 'Prominent Warning Signs Identified';
      summary = 'This listing contains patterns frequently associated with employment scams (such as free email domains, off-platform messaging, or upfront fees).';
    } else if (finalRiskScore >= 30) {
      riskTier = 'medium';
      riskTierLabel = 'MEDIUM RISK (VERIFY)';
      headline = 'Ambiguous Listing — Verification Recommended';
      summary = 'Some indicators require extra caution. For early-stage startups or unverified contacts, verify the identity via official channels before proceeding.';
    }

    // Generate Tailored Student Next Actions
    const recommendations = [];
    if (finalRiskScore >= 60) {
      recommendations.push({
        num: '01',
        title: 'DO NOT PAY ANY SUM OF MONEY',
        text: 'Real employers will never charge for interviews, equipment, training, or application processing.'
      });
      recommendations.push({
        num: '02',
        title: 'DO NOT SHARE SENSITIVE PII',
        text: 'Do not upload government ID cards (Aadhaar, SSN, Passport), OTPs, or bank account numbers.'
      });
      recommendations.push({
        num: '03',
        title: 'REPORT TO COLLEGE & PORTAL',
        text: 'Flag this post on the platform where you found it and submit a report to alert fellow students.'
      });
    } else if (finalRiskScore >= 30) {
      recommendations.push({
        num: '01',
        title: 'Verify via Official Careers Portal',
        text: `Look up "${company}" independently on Google and verify whether this opening exists on their careers page.`
      });
      recommendations.push({
        num: '02',
        title: 'Insist on Enterprise Video Interview',
        text: 'Request video interviews via Google Meet, Zoom, or Microsoft Teams. Avoid purely text-based evaluations.'
      });
      recommendations.push({
        num: '03',
        title: 'Verify Recruiter on LinkedIn',
        text: 'Search for the recruiter\'s profile on LinkedIn to confirm their current active employment with the company.'
      });
    } else {
      recommendations.push({
        num: '01',
        title: 'Proceed with Standard Applications',
        text: 'Apply through the official corporate applicant tracking system (ATS) or company website.'
      });
      recommendations.push({
        num: '02',
        title: 'Prepare Technical Portfolio',
        text: 'Ensure your GitHub, resume, and project links align with the required competencies.'
      });
      recommendations.push({
        num: '03',
        title: 'Maintain Safe Practice',
        text: 'Never disclose passwords or financial credentials at any stage of the interview process.'
      });
    }

    // Confidence Calculation
    const textLength = fullText.length;
    let confidence = 85;
    if (textLength > 600) confidence = 94;
    else if (textLength < 150) confidence = 68;

    return {
      id: 'SG-' + Math.floor(10000 + Math.random() * 90000),
      timestamp: new Date().toLocaleString(),
      jobTitle: title,
      company: company,
      riskScore: finalRiskScore,
      riskLevel: riskTier,
      riskLevelLabel: riskTierLabel,
      confidence: confidence,
      headline: headline,
      summary: summary,
      breakdown: {
        ruleScore: ruleScore,
        mlScore: mlScore,
        domainScore: domainScore
      },
      warningSignals: warningSignals,
      trustSignals: trustSignals,
      recommendations: recommendations
    };
  }
}

// Global detector instance
const detector = new HybridDetector();
