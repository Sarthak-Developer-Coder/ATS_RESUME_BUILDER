// Prefer environment variable set by CRA (frontend/.env or Vercel env)
const envUrl = process.env.REACT_APP_API_URL || 'http://localhost:8001';

// Fallback production URL
const prodUrl = "https://ats-resume-builder-1.onrender.com";

export const api_url = envUrl || prodUrl;

// Notes:
// - For local development set REACT_APP_API_URL in frontend/.env (e.g. http://localhost:8000)
// - In production your hosting platform (Vercel/Netlify) should set REACT_APP_API_URL to the backend URL
