import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

let firebaseInitialized = false;

const parseServiceAccountFromEnv = () => {
  try {
    // Prefer full JSON (plain string)
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    }
    // Or base64-encoded full JSON
    if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
      const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8');
      return JSON.parse(decoded);
    }
  } catch (e) {
    console.error('❌ Failed to parse Firebase service account JSON:', e.message);
  }
  return null;
};

const hasFirebaseEnv = () => {
  const hasFullJson = Boolean(
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON || process.env.FIREBASE_SERVICE_ACCOUNT_BASE64
  );
  const hasDiscrete = Boolean(
    process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY
  );
  return hasFullJson || hasDiscrete;
};

const initializeFirebase = () => {
  try {
    if (!hasFirebaseEnv()) {
      console.log('ℹ️ Firebase Admin not configured (missing env vars). Skipping initialization.');
      firebaseInitialized = false;
      return;
    }

    if (!admin.apps.length) {
      const saFromJson = parseServiceAccountFromEnv();
      const credential = saFromJson
        ? admin.credential.cert({
            ...saFromJson,
            private_key: (saFromJson.private_key || saFromJson.privateKey || '').replace(/\\n/g, '\n'),
          })
        : admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          });

      admin.initializeApp({
        credential,
      });
      firebaseInitialized = true;
      console.log('✅ Firebase Admin initialized from environment variables');
    }
  } catch (error) {
    console.error('❌ Firebase Admin initialization failed:', error.message);
    firebaseInitialized = false;
  }
};

const canVerifyFirebaseTokens = () => firebaseInitialized;

export { initializeFirebase, canVerifyFirebaseTokens };
export default admin;



// import admin from 'firebase-admin';
// import { createRequire } from 'module';
// const require = createRequire(import.meta.url);

// const serviceAccount = require('./serviceAccountKey.json');

// let firebaseInitialized = false;

// const initializeFirebase = () => {
//   try {
//     if (!admin.apps.length) {
//       admin.initializeApp({
//         credential: admin.credential.cert(serviceAccount)
//       });
//       firebaseInitialized = true;
//       console.log('✅ Firebase Admin initialized from file');
//     }
//   } catch (error) {
//     console.error('❌ Firebase Admin initialization failed:', error.message);
//     firebaseInitialized = false;
//   }
// };

// const canVerifyFirebaseTokens = () => firebaseInitialized;

// export { initializeFirebase, canVerifyFirebaseTokens };
// export default admin;
