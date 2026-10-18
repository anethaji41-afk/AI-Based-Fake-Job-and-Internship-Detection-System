"""
Pydantic Request & Response Schemas for SentinelGuard API.
"""

from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, EmailStr, HttpUrl


class JobAnalysisRequest(BaseModel):
    title: str = Field(..., min_length=2, max_length=255, description="Job or internship title")
    company: str = Field(..., min_length=2, max_length=255, description="Declared employer/organization name")
    description: str = Field(..., min_length=10, description="Full job description or recruiter message")
    salary: Optional[str] = Field(None, description="Stated compensation or stipend")
    location: Optional[str] = Field(None, description="Geographic location or remote status")
    worktype: Optional[str] = Field("unspecified", description="remote, hybrid, onsite, or unspecified")
    recruiteremail: Optional[str] = Field(None, description="Recruiter or contact email address")
    sourceurl: Optional[str] = Field(None, description="Application or job posting URL")


class RiskSignalSchema(BaseModel):
    code: str
    name: str
    severity: str  # 'low', 'medium', 'high'
    explanation: str
    contribution: Optional[float] = 0.0


class TrustSignalSchema(BaseModel):
    code: str
    name: str
    explanation: str


class RecommendationSchema(BaseModel):
    num: str
    title: str
    text: str


class AnalysisResponse(BaseModel):
    id: str
    jobtitle: str
    company: str
    riskscore: int  # 0 to 100
    risklevel: str  # 'low', 'medium', 'high', 'very_high'
    confidence: float
    headline: str
    summary: str
    breakdown: Dict[str, int]
    warningsignals: List[RiskSignalSchema]
    trustsignals: List[TrustSignalSchema]
    recommendations: List[RecommendationSchema]
    createdat: datetime


class ReportCreateRequest(BaseModel):
    listingid: Optional[int] = None
    title: str = Field(..., min_length=2)
    company: str = Field(..., min_length=2)
    category: str = Field(..., description="upfront_fee, telegram_task, impersonation, phishing, other")
    description: str = Field(..., min_length=15)
    contacthandle: Optional[str] = None


class ReportResponse(BaseModel):
    id: int
    title: str
    company: str
    category: str
    status: str
    createdat: datetime


class FeedbackRequest(BaseModel):
    expectedlabel: str = Field(..., description="accurate, false_positive, missed_scam")
    comments: Optional[str] = None


class UserRegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(..., min_length=8)


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_name: str
    role: str
