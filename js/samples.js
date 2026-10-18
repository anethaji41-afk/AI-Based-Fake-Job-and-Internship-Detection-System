/**
 * SENTINELGUARD AI - TEST PRESET JOB LISTINGS
 * Real-world calibrated test cases representing verified scams,
 * ambiguous startups, and legitimate corporate postings.
 */

const PRESET_SAMPLES = {
  scam_fee: {
    title: "Remote Data Entry & Back Office Assistant",
    company: "Global Business Process Pvt Ltd",
    salary: "₹45,000 / month ($600/wk)",
    location: "Remote (Work from Home)",
    workType: "remote",
    email: "globalhr.recruitment2026@gmail.com",
    url: "https://bit.ly/data-entry-apply-fast",
    description: `URGENT OPENING! JOIN IMMEDIATELY! LIMITED VACANCIES AVAILABLE!
We are hiring Freshers and Students for Remote Data Entry and Back Office Assistant roles. 
No prior technical experience required. Earn up to ₹45,000 per month with flexible 2-hour daily shifts. 
Tasks include copying text, entering Excel tables, and submitting reports.

NOTE TO APPLICANTS:
Selected candidates must deposit a one-time refundable training & software license fee of ₹2,499 for security clearance and laptop configuration. The fee is 100% refundable with your first month stipend. 

Send your Aadhaar card copy, bank account number, and UPI transfer screenshot immediately to our HR team to confirm your slot before seats fill up!`
  },

  scam_telegram: {
    title: "Digital Media Marketing & Review Promoter",
    company: "Apex Media International",
    salary: "$350 - $600 per day",
    location: "Remote Worldwide",
    workType: "remote",
    email: "careers@apexmedia-intl.online",
    url: "https://tinyurl.com/apex-daily-earn",
    description: `Great part-time work opportunity for students and college graduates! 
Earn $300 to $600 daily simply by liking YouTube videos, reviewing hotel listings, and clicking product affiliate links. 
Payments are disbursed daily via Crypto USDT or UPI. 
No interview needed! No resume required! Immediate start today!

HOW TO APPLY:
Do not email back. Connect directly with our Senior Recruitment Coordinator on Telegram: 
Telegram username: @Apex_HR_Manager_2026 or WhatsApp +1-829-445-9812. 
Message code: "WORK2026" to receive your first trial task and instant $25 bonus.`
  },

  safe_corporate: {
    title: "Associate Software Engineer - Frontend (React / TypeScript)",
    company: "Datadog Technologies Inc.",
    salary: "$95,000 - $115,000 per annum + Equity",
    location: "New York, NY (Hybrid)",
    workType: "hybrid",
    email: "careers@datadoghq.com",
    url: "https://careers.datadoghq.com/detail/req-89211",
    description: `About the Role:
We are seeking an enthusiastic Associate Software Engineer to join our Core Web Platform team in New York. You will collaborate with product designers, backend engineers, and site reliability engineers to build high-performance data visualizations and observability dashboards.

Key Responsibilities:
• Develop responsive, accessible web components using TypeScript, React, and CSS.
• Write robust unit and integration tests using Jest and Playwright.
• Participate in architectural code reviews and sprint planning.
• Optimize client-side rendering performance and browser caching.

Qualifications:
• Bachelor's degree in Computer Science, Software Engineering, or equivalent practical experience.
• Solid fundamentals in JavaScript (ES6+), HTML5, CSS3, and DOM manipulation.
• Familiarity with modern Git workflows, RESTful APIs, and CI/CD pipelines.
• Strong written and verbal communication skills.

Interview Process:
1. Recruiter Screen (30 min video call)
2. Technical Coding Assessment via interactive platform
3. Virtual Onsite: System design discussion and team culture alignment
Note: Datadog never charges any application fees, equipment costs, or software onboarding deposits.`
  },

  startup_unverified: {
    title: "Junior Full Stack Developer Intern",
    company: "NovaFlow AI Labs",
    salary: "₹25,000 / month stipend",
    location: "Bangalore, India (Remote)",
    workType: "remote",
    email: "founders@novaflow-labs.ai",
    url: "https://novaflow-labs.ai/careers",
    description: `NovaFlow is a seed-stage generative AI startup building intelligent document processing workflows. 
We are looking for a hungry, self-driven Junior Full Stack Developer Intern for a 6-month engagement with full-time conversion opportunities.

What you will do:
• Build internal admin dashboards using Next.js and Tailwind.
• Integrate LLM APIs (OpenAI, Anthropic) into Python FastAPI microservices.
• Assist with database schema migrations in PostgreSQL.

Requirements:
• Hands-on portfolio projects on GitHub showing React and Python experience.
• Ability to learn quickly and adapt to fast-paced startup velocity.

Interview steps:
1. Quick 20-minute Google Meet call with the founders.
2. 48-hour take-home coding challenge.
We provide all cloud computing credits and work equipment.`
  }
};
