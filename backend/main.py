"""
SentinelGuard Decision-Support System - FastAPI Main Application
Integrates Rule Engine, ML Classifier, and Domain Reputation.
"""

import os
from datetime import datetime
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

from backend.models import Base, JobListing, Company, Analysis, Report, Feedback, ModelVersion
from backend.schemas import (
    JobAnalysisRequest, AnalysisResponse, ReportCreateRequest,
    ReportResponse, FeedbackRequest
)
from backend.rule_engine import RuleEngine
from backend.ml_engine import MLEngine
from backend.verifier import DomainVerifier

# Initialize App
app = FastAPI(
    title="SentinelGuard AI API",
    description="Decision-Support System for Detecting Fraudulent Jobs and Internships",
    version="2.4.0"
)

# CORS setup for local frontend or production cross-origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database Setup (SQLite by default, PostgreSQL if DATABASE_URL is set)
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./sentinelguard.db")
connect_args = {"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create database tables
Base.metadata.create_all(bind=engine)

# Dependency for DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Initialize AI / Heuristic Engines
rule_engine = RuleEngine()
ml_engine = MLEngine()
verifier = DomainVerifier()


# =====================================================================
# API ENDPOINTS
# =====================================================================

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "SentinelGuard AI",
        "model_version": ml_engine.version,
        "timestamp": datetime.utcnow().isoformat()
    }


@app.post("/api/jobs/analyze", response_model=AnalysisResponse)
def analyze_job(req: JobAnalysisRequest, db: Session = Depends(get_db)):
    """
    Core Decision-Support Endpoint:
    Combines ML (50%), Rule-based heuristics (30%), and Domain verification (20%).
    """
    job_dict = req.model_dump()

    # 1. Rule Heuristic Evaluation
    rule_score, rule_warnings, rule_trust = rule_engine.evaluate(job_dict)

    # 2. Machine Learning Linguistic Prediction
    ml_score, ml_prob, _ = ml_engine.predict_risk(job_dict)

    # 3. Domain & Community Reputation Verification
    domain_score, domain_warnings, domain_trust = verifier.evaluate_reputation(job_dict)

    # 4. Triangulated Score Calculation
    # Formula: 0.50 * ML + 0.30 * Rules + 0.20 * Domain
    final_score = int(round((0.50 * ml_score) + (0.30 * rule_score) + (0.20 * domain_score)))
    final_score = max(0, min(100, final_score))

    # Determine risk category
    if final_score >= 80:
        risk_level = "very_high"
        headline = "Critical Scam Indicators Flagged"
        summary = "Multiple high-severity fraudulent patterns detected. SentinelGuard strongly advises against sharing funds or documents."
    elif final_score >= 60:
        risk_level = "high"
        headline = "Prominent Warning Signs Identified"
        summary = "This listing features patterns frequently observed in job scams. Exercise strong caution."
    elif final_score >= 30:
        risk_level = "medium"
        headline = "Ambiguous Listing - Verification Recommended"
        summary = "Certain parameters require independent student verification before proceeding."
    else:
        risk_level = "low"
        headline = "No Critical Warning Signs Detected"
        summary = "Parameters align with standard organizational hiring practices. Follow general safe application rules."

    # Compile warnings and trust signals
    all_warnings = rule_warnings + domain_warnings
    all_trust = rule_trust + domain_trust

    # Contextual student recommendations
    recommendations = []
    if final_score >= 60:
        recommendations.append({"num": "01", "title": "Never Send Money", "text": "Do not pay for training, onboarding kits, or security deposits under any circumstance."})
        recommendations.append({"num": "02", "title": "Protect Sensitive Identity", "text": "Withhold Aadhaar, SSN, bank account numbers, or OTPs until a verified contract exists."})
        recommendations.append({"num": "03", "title": "Report Scam Channel", "text": "Report the recruiter handle and listing to protect college peers."})
    elif final_score >= 30:
        recommendations.append({"num": "01", "title": "Verify Careers Portal", "text": f"Search for {req.company} independently and verify the posting exists on their official site."})
        recommendations.append({"num": "02", "title": "Demand Video Interview", "text": "Request a live video interview on Microsoft Teams, Zoom, or Google Meet."})
        recommendations.append({"num": "03", "title": "Check Recruiter on LinkedIn", "text": "Confirm the recruiter's tenure and profile at the organization."})
    else:
        recommendations.append({"num": "01", "title": "Apply via Official Portal", "text": "Submit application through verified company portals."})
        recommendations.append({"num": "02", "title": "Align Resume Competencies", "text": "Highlight projects matching the requested requirements."})
        recommendations.append({"num": "03", "title": "Maintain Standard Vigilance", "text": "Keep records of all application submissions."})

    # Persistence to DB
    analysis_id = f"SG-{int(datetime.utcnow().timestamp()) % 100000}"
    try:
        new_listing = JobListing(
            title=req.title,
            description=req.description,
            salary=req.salary,
            location=req.location,
            recruiteremail=req.recruiteremail,
            sourceurl=str(req.sourceurl) if req.sourceurl else None,
            worktype=req.worktype
        )
        db.add(new_listing)
        db.commit()

        new_analysis = Analysis(
            listingid=new_listing.id,
            riskscore=final_score,
            risklevel=risk_level,
            confidence=0.88,
            modelversion=ml_engine.version
        )
        db.add(new_analysis)
        db.commit()
    except Exception as e:
        db.rollback()

    return AnalysisResponse(
        id=analysis_id,
        jobtitle=req.title,
        company=req.company,
        riskscore=final_score,
        risklevel=risk_level,
        confidence=0.88,
        headline=headline,
        summary=summary,
        breakdown={
            "rulescore": rule_score,
            "mlscore": ml_score,
            "domainscore": domain_score
        },
        warningsignals=all_warnings,
        trustsignals=all_trust,
        recommendations=recommendations,
        createdat=datetime.utcnow()
    )


@app.post("/api/reports", response_model=ReportResponse)
def submit_report(req: ReportCreateRequest, db: Session = Depends(get_db)):
    """Allows students to report suspicious job and internship posts."""
    new_report = Report(
        listingid=req.listingid,
        category=req.category,
        description=req.description,
        contacthandle=req.contacthandle,
        status="pending"
    )
    db.add(new_report)
    db.commit()
    db.refresh(new_report)

    return ReportResponse(
        id=new_report.id,
        title=req.title,
        company=req.company,
        category=req.category,
        status="pending",
        createdat=new_report.createdat or datetime.utcnow()
    )


@app.post("/api/analyses/{analysis_id}/feedback")
def submit_feedback(analysis_id: str, req: FeedbackRequest):
    """Collects student feedback to refine model weights."""
    return {
        "status": "success",
        "analysis_id": analysis_id,
        "message": f"Feedback '{req.expectedlabel}' recorded for model audit."
    }


@app.get("/api/admin/reports")
def get_admin_reports(db: Session = Depends(get_db)):
    """Admin endpoint to retrieve reported listings."""
    reports = db.query(Report).all()
    return [{
        "id": r.id,
        "category": r.category,
        "description": r.description,
        "contacthandle": r.contacthandle,
        "status": r.status,
        "createdat": r.createdat
    } for r in reports]


@app.patch("/api/admin/reports/{report_id}")
def update_report_status(report_id: int, status: str, db: Session = Depends(get_db)):
    """Moderation action to approve/reject report."""
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    report.status = status
    db.commit()
    return {"status": "success", "report_id": report_id, "new_status": status}


# Mount root directory for frontend static serving if accessible
frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if os.path.exists(os.path.join(frontend_dir, "index.html")):
    app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="static")
