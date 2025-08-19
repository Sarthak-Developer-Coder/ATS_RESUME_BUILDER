// middleware/auth.js

import jwt from 'jsonwebtoken';
import admin, { canVerifyFirebaseTokens } from '../config/firebase.js';
import User from '../models/User.js';

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const isFirebaseToken = token.length > 500;

  if (isFirebaseToken) {
    // Firebase token
    const canVerify = canVerifyFirebaseTokens();

    // Try normal verification if possible
    if (canVerify) {
      try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        let user = await User.findOne({ firebaseUid: decodedToken.uid });

        if (!user) {
          user = new User({
            email: decodedToken.email,
            firebaseUid: decodedToken.uid,
            displayName: decodedToken.name || decodedToken.email?.split('@')[0],
            photoURL: decodedToken.picture,
            password: 'firebase-auth'
          });
          await user.save();
        }

        req.user = {
          _id: user._id,
          email: user.email,
          firebaseUid: decodedToken.uid,
        };

        return next();
      } catch (error) {
        console.error('❌ Firebase token verification failed:', error.message);
        // Fall through to dev-mode decode if enabled
        if (process.env.NODE_ENV !== 'production') {
          console.log('🔓 Dev mode: decoding Firebase token without verification');
        } else {
          return res.status(403).json({ error: 'Invalid Firebase token' });
        }
      }
    } else if (process.env.NODE_ENV === 'production') {
      console.log('❌ Firebase Admin not initialized.');
      // Optional emergency escape hatch: allow insecure decode in production
      // Set ALLOW_INSECURE_FIREBASE_DECODE=true (Render env) to temporarily
      // bypass hard failure while you finish configuring Firebase Admin.
      if (process.env.ALLOW_INSECURE_FIREBASE_DECODE === 'true') {
        console.log('⚠️ ALLOW_INSECURE_FIREBASE_DECODE enabled — falling back to unverified decode');
      } else {
        return res.status(500).json({ error: 'Firebase is not properly configured' });
      }
    }

    // Dev fallback: decode JWT without verification to extract uid/email
    try {
      const decoded = jwt.decode(token) || {};
      const uid = decoded.user_id || decoded.uid; // Firebase tokens use user_id
      const email = decoded.email;

      if (!uid) {
        return res.status(403).json({ error: 'Invalid Firebase token (no uid)' });
      }

      let user = await User.findOne({ $or: [{ firebaseUid: uid }, { email }] });
      if (!user) {
        user = new User({
          email: email || `${uid}@example.local`,
          firebaseUid: uid,
          displayName: decoded.name || (email ? email.split('@')[0] : uid),
          photoURL: decoded.picture,
          password: 'firebase-auth'
        });
        await user.save();
      }

      req.user = { _id: user._id, email: user.email, firebaseUid: uid };
      return next();
    } catch (e) {
      console.error('❌ Dev decode of Firebase token failed:', e.message);
      return res.status(403).json({ error: 'Invalid Firebase token' });
    }
  }

  // JWT token (HS256)
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded._id);

    if (!user) {
      return res.status(403).json({ error: 'User not found' });
    }

    req.user = {
      _id: user._id,
      email: user.email,
    };

    return next();
  } catch (error) {
    console.error('❌ JWT verification failed:', error.message);
    return res.status(403).json({ error: 'Invalid JWT token' });
  }
};
