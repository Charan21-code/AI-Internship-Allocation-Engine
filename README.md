# 🤖 AI-Based Internship Allocation Engine

> A smart, Firebase-powered web platform that uses **Google Gemini AI** to match students with the best internship opportunities — automatically and fairly.

---

## 🚀 Overview

This project is an **AI-driven internship management system** that connects **students**, **recruiters**, and **admins** on a single dashboard.

Built using:
- **HTML + Tailwind CSS** (Frontend UI)
- **Firebase Authentication** (Login & Registration)
- **Firestore Database** (Data storage)
- **Firebase Storage** (Resume uploads)
- **Google Gemini AI API** (AI resume–job matching engine)

---

## 🌟 Key Features

### 🎓 Student Portal
- Create an account & manage your AI profile.
- Paste your **resume text** for AI analysis.
- Upload a **formatted resume (PDF/DOCX)** for recruiters.
- Apply to internships — your resume is **AI-scanned** against job descriptions.
- View your **application history** with real-time status updates.

### 💼 Recruiter Portal
- Post new internship opportunities.
- View all applicants for your jobs in real time.
- See **AI match scores** and summaries for each applicant.
- Accept or reject candidates directly from your dashboard.

### 🛠️ Admin Portal
- Manage all users, recruiters, and job postings.
- Monitor applications and platform activity.
- Clean, centralized control panel built with Tailwind UI.

---

## 🧠 How the AI Matching Works

When a student applies to a job:
1. The system grabs their **resume text** and the **job description**.
2. Sends both to **Google Gemini API**.
3. Gemini returns:
   ```json
   {
     "matchPercentage": 86,
     "summary": "The candidate has relevant data analysis skills and Python experience."
   }
