"""
Database ORM Models for SentinelGuard Decision-Support System
Compatible with PostgreSQL (production) and SQLite (local development).
"""

from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey, Index, JSON
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    passwordhash = Column(String(255), nullable=False)
    role = Column(String(50), default="student", nullable=False)  # 'student', 'moderator', 'admin'
    createdat = Column(DateTime, default=datetime.utcnow, nullable=False)

    analyses = relationship("Analysis", back_populates="user")
    reports = relationship("Report", back_populates="user")
    feedback = relationship("Feedback", back_populates="user")


class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), index=True, nullable=False)
    website = Column(String(255), nullable=True)
    domain = Column(String(255), index=True, nullable=True)
    verificationstatus = Column(String(50), default="unverified", nullable=False)  # 'verified', 'unverified', 'flagged'
    createdat = Column(DateTime, default=datetime.utcnow)

    listings = relationship("JobListing", back_populates="company")


class JobListing(Base):
    __tablename__ = "joblistings"

    id = Column(Integer, primary_key=True, index=True)
    companyid = Column(Integer, ForeignKey("companies.id"), nullable=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=False)
    salary = Column(String(100), nullable=True)
    location = Column(String(150), nullable=True)
    recruiteremail = Column(String(255), index=True, nullable=True)
    sourceurl = Column(String(500), index=True, nullable=True)
    worktype = Column(String(50), default="unspecified")
    createdat = Column(DateTime, default=datetime.utcnow)

    company = relationship("Company", back_populates="listings")
    analyses = relationship("Analysis", back_populates="listing")
    reports = relationship("Report", back_populates="listing")


class Analysis(Base):
    __tablename__ = "analyses"

    id = Column(Integer, primary_key=True, index=True)
    listingid = Column(Integer, ForeignKey("joblistings.id"), nullable=True, index=True)
    userid = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    riskscore = Column(Integer, nullable=False)  # 0 to 100
    risklevel = Column(String(50), nullable=False)  # 'low', 'medium', 'high', 'very_high'
    confidence = Column(Float, default=0.85)
    modelversion = Column(String(50), default="v2.4")
    createdat = Column(DateTime, default=datetime.utcnow, index=True)

    listing = relationship("JobListing", back_populates="analyses")
    user = relationship("User", back_populates="analyses")
    signals = relationship("AnalysisSignal", back_populates="analysis")
    feedback = relationship("Feedback", back_populates="analysis")


class RiskSignal(Base):
    __tablename__ = "risksignals"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(100), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    severity = Column(String(50), nullable=False)  # 'low', 'medium', 'high'
    description = Column(Text, nullable=False)


class AnalysisSignal(Base):
    __tablename__ = "analysissignals"

    id = Column(Integer, primary_key=True, index=True)
    analysisid = Column(Integer, ForeignKey("analyses.id"), nullable=False, index=True)
    signalid = Column(Integer, ForeignKey("risksignals.id"), nullable=False, index=True)
    value = Column(String(255), nullable=True)
    contribution = Column(Float, default=0.0)
    explanation = Column(Text, nullable=False)

    analysis = relationship("Analysis", back_populates="signals")
    signal = relationship("RiskSignal")


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    listingid = Column(Integer, ForeignKey("joblistings.id"), nullable=True, index=True)
    userid = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    category = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    contacthandle = Column(String(255), nullable=True)
    status = Column(String(50), default="pending", index=True)  # 'pending', 'approved', 'rejected', 'investigating'
    createdat = Column(DateTime, default=datetime.utcnow)

    listing = relationship("JobListing", back_populates="reports")
    user = relationship("User", back_populates="reports")
    evidence = relationship("EvidenceFile", back_populates="report")


class EvidenceFile(Base):
    __tablename__ = "evidencefiles"

    id = Column(Integer, primary_key=True, index=True)
    reportid = Column(Integer, ForeignKey("reports.id"), nullable=False, index=True)
    fileurl = Column(String(500), nullable=False)
    filetype = Column(String(50), nullable=False)
    createdat = Column(DateTime, default=datetime.utcnow)

    report = relationship("Report", back_populates="evidence")


class Domain(Base):
    __tablename__ = "domains"

    id = Column(Integer, primary_key=True, index=True)
    domain = Column(String(255), unique=True, index=True, nullable=False)
    reputation = Column(String(50), default="neutral")  # 'trusted', 'neutral', 'suspicious', 'blacklisted'
    reportcount = Column(Integer, default=0)
    lastcheckedat = Column(DateTime, default=datetime.utcnow)


class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, index=True)
    analysisid = Column(Integer, ForeignKey("analyses.id"), nullable=False, index=True)
    userid = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    expectedlabel = Column(String(50), nullable=False)  # 'accurate', 'false_positive', 'missed_scam'
    comments = Column(Text, nullable=True)
    createdat = Column(DateTime, default=datetime.utcnow)

    analysis = relationship("Analysis", back_populates="feedback")
    user = relationship("User", back_populates="feedback")


class ModelVersion(Base):
    __tablename__ = "modelversions"

    id = Column(Integer, primary_key=True, index=True)
    version = Column(String(50), unique=True, nullable=False)
    metrics = Column(JSON, nullable=True)  # {'precision': 0.91, 'recall': 0.95, 'f1': 0.93}
    trainingdate = Column(DateTime, default=datetime.utcnow)
    active = Column(Boolean, default=False)


class AuditLog(Base):
    __tablename__ = "auditlogs"

    id = Column(Integer, primary_key=True, index=True)
    actorid = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False)
    entitytype = Column(String(100), nullable=False)
    entityid = Column(Integer, nullable=True)
    details = Column(JSON, nullable=True)
    createdat = Column(DateTime, default=datetime.utcnow, index=True)
