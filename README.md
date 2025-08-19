# 🚀 ATS Resume Builder (AI Powered)

Create ATS-optimized, job‑tailored resumes with AI assistance. Upload your PDF, analyze against any JD, weave missing keywords, polish language, and download a clean PDF. Built with React + Node + MongoDB + Gemini AI.

---

## ✨ Highlights

- AI‑powered ATS analysis with actionable fixes
- One‑click “Boost My Resume” (Tailor → Weave Keywords → Polish)
- Professional templates with live preview and PDF export
- Public resume link with daily view analytics
- Admin dashboard and feedback collection

---

## 📦 Quickstart (Local)

Clone and run locally in minutes.

```bash
# 1) Clone
git clone https://github.com/Sarthak-Developer-Coder/ATS_RESUME_BUILDER.git
cd ATS_RESUME_BUILDER

# 2) Backend
cd backend
npm install
# copy your env
# Windows PowerShell
copy .env.example .env   # fill MONGODB_URI, JWT_SECRET, GEMINI_API_KEY, EMAIL_*, FRONTEND_URL
npm start                 # http://localhost:8001

# 3) Frontend (new terminal)
cd ../frontend
npm install
# Windows PowerShell
copy .env.example .env   # set REACT_APP_API_URL=http://localhost:8001
npm start                 # http://localhost:3001
```

Health & docs:
- Backend Health: http://localhost:8001/api/health
- API Docs: http://localhost:8001/api

---

## 🔐 Admin Access

- Admin panel route: `/admin/login`
- To create admin user locally:

```bash
cd backend
npm run create-admin
```

Default (example) creds used in docs: `admin@resumebuilder.com` / `admin123` (change in .env).

---

## 💡 Why This Project?

Most resumes miss ATS filters or lack role‑specific alignment. This tool fixes both: clear builder UX + AI that tailors content to each job.

---

## 🎯 Key Features

- 🔐 Auth: Email/password (Firebase optional)
- 🧑‍🎓 Smart Builder: Stepper UI, manual reorder + AI reorder suggestions
- 🧠 AI Suite:
  - Generate / Polish / Translate Summary
  - ATS Analyze vs JD (scores, suggestions)
  - Keyword Gap + Weave Keywords into bullets responsibly
  - Readability Insights (Flesch score, passive voice, long sentences)
  - Tailor to JD (skill prioritization, summary rewrite)
  - Cover Letter Generator
- 📄 Clean, ATS‑safe PDF export
- 📥 Resume Upload & parsing (PDF)
- 🔗 Public Share with daily view analytics
- 💬 Feedback widget (General, Bug, Feature, Help)
- 👨‍💼 Admin Dashboard (users, resumes, feedback, analytics)
- 🔑 Forgot/Reset Password via email
- 🌐 Responsive Material UI

---

## 🧰 Tech Stack

| Layer       | Technology                                                |
|-------------|------------------------------------------------------------|
| Frontend    | React (CRA), Material UI, Firebase (optional)             |
| AI Engine   | Google Generative AI (Gemini)                              |
| Backend     | Node.js, Express.js, MongoDB, JWT                          |
| PDF Export  | html-pdf-node, pdf-parse                                   |
| Feedback    | EmailJS + Nodemailer                                       |
| Admin       | JWT Auth, Role-based Access                                |

---

## 📁 Project Structure

```
ats-resume-builder/
├── backend/
│   ├── controllers/  # API Logic (Resume, Auth, AI, Admin)
│   ├── models/       # Mongoose Schemas
│   ├── routes/       # Express Routes
│   ├── middleware/   # Auth, Error Handling
│   ├── scripts/      # Admin Creation Script
│   └── utils/        # PDF Parser, Helpers
└── frontend/
    ├── public/       # Static Files
    └── src/
        ├── components/
        ├── pages/
        ├── contexts/
        ├── firebase/
        └── helper/
```

---

## ⚙️ Installation

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/Sarthak-Developer-Coder/ATS_RESUME_BUILDER.git
cd ATS_RESUME_BUILDER
```

### 2️⃣ Install Dependencies

#### Backend
```bash
cd backend
npm install
```

#### Frontend
```bash
cd ../frontend
npm install
```

### 3️⃣ Environment Setup

#### Backend (.env)
```env
PORT=8001
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
GEMINI_API_KEY=your_gemini_api_key
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
FIREBASE_PRIVATE_KEY=your_firebase_private_key
EMAIL_USER=your_gmail_address
EMAIL_PASS=your_gmail_app_password
FRONTEND_URL=http://localhost:3001
```

Helpful: the Firebase Admin private key is multiline. To safely place it in `backend/.env` as a single-line escaped string, use the helper script:

```powershell
# from repo root
node backend/scripts/encode-firebase-key.js C:\path\to\service-account.json
# copy the printed FIREBASE_PRIVATE_KEY=... line and paste into backend/.env
```

#### Frontend (.env)
```env
PORT=3001
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_firebase_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_firebase_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id
REACT_APP_API_URL=http://localhost:8001
```

### 4️⃣ Create Admin User

```bash
cd backend
npm run create-admin
```

---

## 💻 Run the App

You can run the frontend and backend together or separately.

**Backend**
```bash
cd backend
npm start
```

**Frontend**
```bash
cd frontend
npm start
```

Then open http://localhost:3001

---

## 🌐 Deploy

- Backend: Render web service (root `backend/`). Use env vars from `backend/.env.example`.
- Frontend: Vercel project (root `frontend/`). Set `REACT_APP_API_URL` to your Render URL.

---

## 🔧 Fixed Issues (Examples)

### ✅ Admin Credentials
- Email: `admin@resumebuilder.com`
- Password: `admin123`
- Added script to create admin user: `npm run create-admin`

### ✅ Forgot Password Functionality
- Fixed email sending with proper HTML templates
- Added fallback for development (logs reset URL)
- Improved error handling and user feedback
- Added proper token validation and expiration

### ✅ Resume Download PDF Formatting
- Fixed PDF generation to match preview exactly
- Improved responsive design for different content lengths
- Added dynamic font sizing based on content volume
- Enhanced spacing and layout consistency
- Fixed template rendering issues

---

## 📌 Use Cases

- 🧑‍🎓 Freshers: Quickly generate a professional resume with AI help.
- 💼 Working Professionals: Score resumes against job descriptions to increase chances.
- 📝 Resume Review Services: Extract content, improve, and export with ease.
- 📤 Job Portals: Integrate AI scoring as an enhancement.
- 👨‍💼 HR Teams: Admin dashboard for user management and analytics.

---

## 🔑 Email Configuration

For forgot password functionality, configure these environment variables:

```env
EMAIL_USER=your_gmail_address
EMAIL_PASS=your_gmail_app_password
```

To get a Gmail App Password:
1. Enable 2‑Factor Authentication on your Gmail account
2. Google Account Settings → Security → App Passwords
3. Generate a new app password for "Mail"
4. Use this password in `EMAIL_PASS`

---

## 🖼️ Screenshots

Place your images in `docs/screenshots/` with the names below (or adjust paths in this README).

| Login | Profile | Dashboard |
|---|---|---|
| ![Login](https://raw.githubusercontent.com/Sarthak-Developer-Coder/ATS_RESUME_BUILDER/main/docs/screenshots/login.svg) | ![Profile](https://raw.githubusercontent.com/Sarthak-Developer-Coder/ATS_RESUME_BUILDER/main/docs/screenshots/profile.svg) | ![Dashboard](https://raw.githubusercontent.com/Sarthak-Developer-Coder/ATS_RESUME_BUILDER/main/docs/screenshots/dashboard.svg) |

| Upload Resume | ATS Score – Input | ATS Score – Results |
|---|---|---|
| ![Upload](https://raw.githubusercontent.com/Sarthak-Developer-Coder/ATS_RESUME_BUILDER/main/docs/screenshots/upload.svg) | ![JD Input](https://raw.githubusercontent.com/Sarthak-Developer-Coder/ATS_RESUME_BUILDER/main/docs/screenshots/score-input.svg) | ![Results](https://raw.githubusercontent.com/Sarthak-Developer-Coder/ATS_RESUME_BUILDER/main/docs/screenshots/score-results.svg) |

| AI Recommendations & Keywords | Template Select | Summary (AI) |
|---|---|---|
| ![Recommendations](https://raw.githubusercontent.com/Sarthak-Developer-Coder/ATS_RESUME_BUILDER/main/docs/screenshots/recommendations.svg) | ![Templates](https://raw.githubusercontent.com/Sarthak-Developer-Coder/ATS_RESUME_BUILDER/main/docs/screenshots/templates.svg) | ![Summary](https://raw.githubusercontent.com/Sarthak-Developer-Coder/ATS_RESUME_BUILDER/main/docs/screenshots/summary.svg) |

| Resume Preview | Feedback |
|---|---|
| ![Preview](https://raw.githubusercontent.com/Sarthak-Developer-Coder/ATS_RESUME_BUILDER/main/docs/screenshots/preview.svg) | ![Feedback](https://raw.githubusercontent.com/Sarthak-Developer-Coder/ATS_RESUME_BUILDER/main/docs/screenshots/feedback.svg) |

---

## 👨‍💻 Author

Made with ❤️ by **Sarthak Nag**  
📧 sarthakthesde@gmail.com  
🔗 [LinkedIn](https://linkedin.com/in/sarthak-nag-b91861291)

---

## 📃 License

MIT License
