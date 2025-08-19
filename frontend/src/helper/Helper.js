// Determine API base URL
const isProd = process.env.NODE_ENV === 'production';
const DEFAULT_DEV = 'http://localhost:8001';
const DEFAULT_PROD = 'https://ats-resume-builder-66et.onrender.com';

// Prefer environment variable set by CRA (frontend/.env or Vercel env)
export const api_url =
	process.env.REACT_APP_API_URL || (isProd ? DEFAULT_PROD : DEFAULT_DEV);

// Notes:
// - For local development set REACT_APP_API_URL in frontend/.env (e.g. http://localhost:8001)
// - In production your hosting platform (Vercel/Netlify) should set REACT_APP_API_URL to the backend URL
// - If not set in production, it defaults to your Render backend URL
