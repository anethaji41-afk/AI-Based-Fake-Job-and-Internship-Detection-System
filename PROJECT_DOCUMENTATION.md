# SENTINELGUARD AI — FINAL YEAR PROJECT COMPREHENSIVE DOCUMENTATION

**Project Title:** An Intelligent Hybrid Decision-Support System for Detecting Fraudulent Jobs and Internships  
**Domain:** Natural Language Processing (NLP), Cybersecurity, Machine Learning, Decision-Support Systems  
**Core Technologies:** React / Modern Web Frontend, Python FastAPI, Scikit-Learn (TF-IDF + Logistic Regression), PostgreSQL / SQLAlchemy, Web Audio API, Web Speech API (Voice Recognition & AI Synthesis)

---

## 1. Executive Summary & Problem Formulation

Online job boards and social platforms have seen an explosion in fraudulent listings targeting college students and recent graduates. Scammers exploit student urgency through:
1. **Advance Fee Traps:** Requiring "registration fees", "training charges", or "refundable laptop deposits".
2. **Task & Crypto Scams:** Directing candidates to Telegram channels for fake data entry or review tasks with artificial daily commissions.
3. **Brand Impersonation:** Spoofing corporate logos (Google, Microsoft, Amazon) using free webmail addresses (e.g. `@gmail.com`).
4. **Premature Identity Harvesting:** Demanding Aadhaar, SSN, bank accounts, or OTPs before formal interviews.

Unlike naive classifiers that produce opaque "Fake" or "Real" binary outputs, **SentinelGuard** functions as an **explainable decision-support system**. It computes a **Triangulated Risk Score (0–100)** across three layers, surfaces specific reason codes, highlights positive trust signals, and empowers students to make informed career decisions.

---

## 2. Triangulation Risk Architecture

The decision-support engine employs a weighted linear combination of three complementary analytical layers:

$$\text{FinalRiskScore} = 0.50 \times \text{MLScore} + 0.30 \times \text{RuleScore} + 0.20 \times \text{DomainReputationScore}$$

```
                +------------------------------------------------+
                |           Incoming Job Posting Data            |
                |  (Title, Company, Description, Email, URL)     |
                +-----------------------+------------------------+
                                        |
       +--------------------------------+--------------------------------+
       |                                |                                |
       v                                v                                v
+--------------+               +------------------+             +-----------------+
| Rule Engine  |               |  ML / NLP Model  |             | Domain Verifier |
| (Weight: 30%)|               |  (Weight: 50%)   |             | (Weight: 20%)   |
+-------+------+               +--------+---------+             +--------+--------+
        |                               |                                |
  Reason Codes &                  TF-IDF Vector                    SSRF Check,
  Heuristic Flags                Logistic Regr.                  Domain Mismatch,
        |                        P(Fraud) Sigmoid                 Blacklist Check
        +-------------------------------+--------------------------------+
                                        |
                                        v
                    +----------------------------------------+
                    |    Triangulated Risk Score (0 - 100)   |
                    |     Low / Medium / High / Very High    |
                    +-------------------+--------------------+
                                        |
                 +----------------------+----------------------+
                 |                                             |
                 v                                             v
    +--------------------------+                 +----------------------------+
    |  Student Explainability  |                 | Community Intel & Feedback |
    |   - Warning Signals      |                 |   - Student Scam Reports   |
    |   - Positive Trust Flags |                 |   - Moderation Queue       |
    |   - Audio/Voice Verdict  |                 |   - Model Retraining Loop  |
    +--------------------------+                 +----------------------------+
```

### Risk Tier Calibration Table

| Risk Score | Tier Classification | System Directive | User Guidance |
|---|---|---|---|
| **0 – 29** | **Low Risk** | Display Normal Safety Checks | Proceed with standard application via official career portal. |
| **30 – 59** | **Medium Risk** | Request Student Due Diligence | Ambiguous listing; verify recruiter identity on LinkedIn & official site. |
| **60 – 79** | **High Risk** | Highlight Severe Warning Signs | Contains known scam patterns (free email, Telegram link, urgency). |
| **80 – 100** | **Critical Fraud Risk** | Urgent Action Recommendation | Upfront fee demand or blacklisted host; do NOT pay or share PII. |

---

## 3. Database Schema (PostgreSQL / SQLite)

### Entity-Relationship (ER) Overview

```
 [User] 1 -------- * [Analysis] * -------- 1 [JobListing] 1 -------- 0..1 [Company]
   |                     |                                                |
   |                     *                                                *
   *              [AnalysisSignal]                                   [Domain]
 [Report] 1 -- * [EvidenceFile]
```

### Core Table Definitions

```sql
-- 1. Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    passwordhash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'student' NOT NULL,
    createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 2. Companies Table
CREATE TABLE companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    website VARCHAR(255),
    domain VARCHAR(255),
    verificationstatus VARCHAR(50) DEFAULT 'unverified' NOT NULL,
    createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Job Listings Table
CREATE TABLE joblistings (
    id SERIAL PRIMARY KEY,
    companyid INTEGER REFERENCES companies(id),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    salary VARCHAR(100),
    location VARCHAR(150),
    recruiteremail VARCHAR(255),
    sourceurl VARCHAR(500),
    worktype VARCHAR(50) DEFAULT 'unspecified',
    createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_joblistings_email ON joblistings(recruiteremail);
CREATE INDEX idx_joblistings_sourceurl ON joblistings(sourceurl);

-- 4. Analyses Table
CREATE TABLE analyses (
    id SERIAL PRIMARY KEY,
    listingid INTEGER REFERENCES joblistings(id),
    userid INTEGER REFERENCES users(id),
    riskscore INTEGER NOT NULL,
    risklevel VARCHAR(50) NOT NULL,
    confidence FLOAT DEFAULT 0.85,
    modelversion VARCHAR(50) DEFAULT 'v2.4',
    createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Risk Signals Master Table
CREATE TABLE risksignals (
    id SERIAL PRIMARY KEY,
    code VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    severity VARCHAR(50) NOT NULL,
    description TEXT NOT NULL
);

-- 6. Analysis Signals Association
CREATE TABLE analysissignals (
    id SERIAL PRIMARY KEY,
    analysisid INTEGER REFERENCES analyses(id) ON DELETE CASCADE,
    signalid INTEGER REFERENCES risksignals(id),
    value VARCHAR(255),
    contribution FLOAT DEFAULT 0.0,
    explanation TEXT NOT NULL
);

-- 7. Community Scam Reports
CREATE TABLE reports (
    id SERIAL PRIMARY KEY,
    listingid INTEGER REFERENCES joblistings(id),
    userid INTEGER REFERENCES users(id),
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    contacthandle VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending',
    createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Domain Threat Intelligence
CREATE TABLE domains (
    id SERIAL PRIMARY KEY,
    domain VARCHAR(255) UNIQUE NOT NULL,
    reputation VARCHAR(50) DEFAULT 'neutral',
    reportcount INTEGER DEFAULT 0,
    lastcheckedat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 4. Step-by-Step Command Line Execution Guide

### Option A: Instant Browser Execution (Zero Setup)
The frontend application has a built-in hybrid detection triangulation engine, Web Audio synthesizer, and Web Speech API.

Run the local web server from the project directory:
```powershell
# In PowerShell:
cd "c:\Users\ASUS\Downloads\nethaji\job web"
python -m http.server 3000
```
Open **`http://localhost:3000`** in Google Chrome or Microsoft Edge.

---

### Option B: Running the Python FastAPI Backend

#### 1. Setup Virtual Environment & Install Dependencies
```powershell
cd "c:\Users\ASUS\Downloads\nethaji\job web"

# Create virtual environment
python -m venv venv

# Activate virtual environment (Windows PowerShell)
.\venv\Scripts\Activate.ps1

# Install requirements
pip install -r backend/requirements.txt
```

#### 2. Start the FastAPI Server
```powershell
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```
- Interactive Swagger API Documentation: **`http://localhost:8000/docs`**
- Alternative Redoc API Documentation: **`http://localhost:8000/redoc`**

---

### Option C: Running with Docker Container

```bash
# Build the Docker image
docker build -t sentinel-guard:latest .

# Run container on port 8000
docker run -d -p 8000:8000 --name sentinel_container sentinel-guard:latest

# Check logs
docker logs -f sentinel_container
```

---

## 5. REST API Specifications & cURL Examples

### Endpoint: Analyze a Job Posting
- **Method:** `POST`
- **Path:** `/api/jobs/analyze`
- **Headers:** `Content-Type: application/json`

#### Example Request:
```bash
curl -X POST "http://localhost:8000/api/jobs/analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Remote Data Entry Assistant",
    "company": "Apex Global Process Ltd",
    "salary": "$4,000 / month",
    "location": "Remote",
    "worktype": "remote",
    "recruiteremail": "apex.hiring.team@gmail.com",
    "sourceurl": "https://bit.ly/urgent-data-job",
    "description": "URGENT OPENING! Join immediately! Earn $4,000/month typing text. Send refundable software license fee of $50 via UPI to secure slot. Contact Telegram: @ApexHR2026."
  }'
```

#### Example Response:
```json
{
  "id": "SG-84920",
  "jobtitle": "Remote Data Entry Assistant",
  "company": "Apex Global Process Ltd",
  "riskscore": 88,
  "risklevel": "very_high",
  "confidence": 0.94,
  "headline": "Critical Scam Indicators Flagged",
  "summary": "Multiple high-severity fraudulent patterns detected. SentinelGuard strongly advises against sharing funds or documents.",
  "breakdown": {
    "rulescore": 95,
    "mlscore": 86,
    "domainscore": 85
  },
  "warningsignals": [
    {
      "code": "PAYMENT_REQUESTED",
      "name": "Upfront Fee or Deposit Demanded",
      "severity": "high",
      "explanation": "Listing requests payments for training, registration, security clearance, or software. Legitimate companies never charge candidates."
    },
    {
      "code": "OFF_PLATFORM_COMMUNICATION",
      "name": "Messaging App Redirection (Telegram/WhatsApp)",
      "severity": "high",
      "explanation": "Directs applicant to unmonitored messaging apps, preventing corporate paper trails."
    },
    {
      "code": "FREE_EMAIL_DOMAIN",
      "name": "Free Webmail Recruiter Address",
      "severity": "high",
      "explanation": "Recruiter contact (@gmail.com) uses a free public mailbox instead of a verified corporate domain."
    }
  ],
  "trustsignals": [],
  "recommendations": [
    {
      "num": "01",
      "title": "Never Send Money",
      "text": "Do not pay for training, onboarding kits, or security deposits under any circumstance."
    },
    {
      "num": "02",
      "title": "Protect Sensitive Identity",
      "text": "Withhold Aadhaar, SSN, bank account numbers, or OTPs until a verified contract exists."
    }
  ],
  "createdat": "2026-10-18T13:20:00Z"
}
```

---

## 6. Prompt Engineering Guide for Dataset Generation & Retraining

When creating synthetic training datasets or augmenting sparse fraud corpora, use the following structured prompt template with LLMs (e.g. Gemini / GPT-4):

### Master Data Generation Prompt

```markdown
SYSTEM INSTRUCTION:
You are an expert fraud researcher specializing in collegiate recruitment fraud and cybersecurity threat modeling.
Generate structured job listing examples for training a fake job classification model.

REQUIREMENTS:
1. Generate pairs of (1) Fraudulent Listings and (2) Legitimate Listings.
2. For Fraudulent Listings, incorporate real-world scam markers:
   - Upfront training/laptop/license deposit demands (₹1,500 - ₹5,000 or $50 - $200).
   - Off-platform comms (Telegram usernames, WhatsApp numbers).
   - Disproportionate compensation for unskilled tasks ($500/day for video likes or data entry).
   - Free recruiter webmail domains (@gmail.com, @yahoo.com) for supposed enterprise employers.
   - Premature request for bank accounts, OTPs, or government IDs.
3. For Legitimate Listings, incorporate real-world corporate markers:
   - Concrete technical responsibilities and qualifications.
   - Clear interview phases (Screening, Technical assessment, Virtual onsite).
   - Corporate benefits (health insurance, provident fund, PTO).
   - Matching corporate domain emails.
4. Output in JSON format with fields:
   {
     "title": string,
     "company": string,
     "description": string,
     "salary": string,
     "recruiter_email": string,
     "source_url": string,
     "label": 1 (fraud) or 0 (legitimate),
     "scam_type": string or null
   }
```

---

## 7. Model Evaluation & Defense Strategies

### Key Performance Metrics
- **Recall for Fraud ($>94\%$):** Missing a scam (False Negative) can cost a student money or identity theft. The decision threshold is lowered to $\tau = 60$ to prioritize student safety.
- **Precision ($>91\%$):** Minimizing False Positives ensures legitimate startups and early-stage companies are not unfairly penalized.
- **Calibrated Probability:** Probability scores are computed using logistic sigmoid $P(\text{fraud}|x) = \frac{1}{1 + e^{-z}}$, preventing uncalibrated extremes.

### Legal & Ethics Safeguards
- SentinelGuard outputs **decision-support risk indicators**, not legal accusations.
- Disclaimers state: *"High-risk indicators detected — independent verification recommended"*.
- Student reports require manual administrator review before entering domain threat intelligence blacklists.
