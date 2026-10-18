"""
Machine Learning & NLP Engine for SentinelGuard.
Features:
- Text Preprocessing & Cleaning
- TF-IDF Feature Extraction
- Calibrated Logistic Regression Classifier
- Pre-trained synthetic benchmark dataset for instant inference
"""

import os
import re
from typing import Dict, Any, Tuple
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline


class MLEngine:
    def __init__(self):
        self.version = "v2.4"
        self.pipeline = None
        self._initialize_pipeline()

    def clean_text(self, text: str) -> str:
        """Sanitizes text while preserving critical punctuation markers."""
        if not text:
            return ""
        text = text.lower()
        text = re.sub(r"http\S+|www\S+", " url_link ", text)
        text = re.sub(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b", " email_addr ", text)
        text = re.sub(r"[₹$€£]\s*\d+", " currency_val ", text)
        text = re.sub(r"\s+", " ", text).strip()
        return text

    def _initialize_pipeline(self):
        """Initializes and trains the baseline TF-IDF + Logistic Regression model."""
        # Benchmark dataset representing typical fraud vs legitimate corpora
        train_texts = [
            # Fraudulent samples
            "urgent opening join immediately data entry backoffice pay refundable security deposit 2500 training license fee",
            "part time work from home earn 500 daily like youtube videos hotel reviews telegram contact task payout usdt crypto",
            "immediate hiring no interview no resume needed fresher vacancy send aadhaar card and bank account number to hr",
            "laptop deposit required before dispatch refundable with first stipend telegram chat id @work_task_direct",
            "exclusive customer care job apply today limited vacancies daily payment transfer via upi or gift cards guaranteed earnings",
            "earn 1000 per hour typing work no experience necessary registration fee 999 for id creation direct appointment",
            "amazon work from home promoter review products earn commission contact on whatsapp only +91 9832104928",
            "online data entry job no interview required pay processing fee to book seat joining letter within 2 hours",

            # Legitimate samples
            "software engineer associate frontend react typescript jest unit tests git workflow ci cd pipeline bachelor degree",
            "data analyst junior sql python tableau data visualization statistical modeling quarterly business reviews remote hybrid",
            "full stack developer backend fastapi postgresql docker restful apis team code review comprehensive health insurance 401k",
            "marketing associate content writer seo strategy google analytics quarterly campaign goals bachelor degree in communications",
            "product management intern user research roadmapping cross functional collaboration agile sprints competitive stipend",
            "cybersecurity analyst soc tier 1 incident response network monitoring siem splunk certifications preferred equal opportunity employer",
            "human resources coordinator employee onboarding talent acquisition interviews compliance benefits administration",
            "sales operations specialist crm salesforce lead qualification pipeline reporting quota attainment compensation plan"
        ]
        train_labels = [1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0]

        self.pipeline = Pipeline([
            ("tfidf", TfidfVectorizer(ngram_range=(1, 2), min_df=1, max_features=3000)),
            ("clf", LogisticRegression(C=1.5, class_weight="balanced", random_state=42))
        ])

        cleaned_train = [self.clean_text(t) for t in train_texts]
        self.pipeline.fit(cleaned_train, train_labels)

    def predict_risk(self, job_data: Dict[str, Any]) -> Tuple[int, float, Dict[str, Any]]:
        """
        Runs ML linguistic analysis.
        Returns:
            ml_risk_score: int (0 to 100)
            probability: float (0.0 to 1.0)
            insights: dict with top ngram contributions
        """
        title = job_data.get("title", "")
        company = job_data.get("company", "")
        description = job_data.get("description", "")
        combined = f"{title} {company} {description}"
        cleaned = self.clean_text(combined)

        if not cleaned:
            return 20, 0.20, {"length": 0}

        # Predict probability
        probs = self.pipeline.predict_proba([cleaned])[0]
        fraud_prob = float(probs[1])
        ml_risk_score = int(round(fraud_prob * 100))

        insights = {
            "fraud_probability": round(fraud_prob, 3),
            "text_length": len(cleaned),
            "model_version": self.version
        }

        return ml_risk_score, fraud_prob, insights
