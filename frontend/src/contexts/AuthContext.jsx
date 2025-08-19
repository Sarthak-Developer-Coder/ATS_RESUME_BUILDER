import { createContext, useContext, useEffect, useState } from 'react';
import { 
  auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider
} from '../firebase/config';
import axios from 'axios';
import { api_url } from '../helper/Helper';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [authMode, setAuthMode] = useState(
    localStorage.getItem('authMode') || process.env.REACT_APP_AUTH_MODE || 'firebase'
  );

  // Allow pages (e.g., Profile) to update the in-memory user and localStorage
  const updateAuthUser = (partial) => {
    setUser((prev) => {
      const next = { ...(prev || {}), ...(partial || {}) };
      try {
        localStorage.setItem('user', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Keep axios Authorization header in sync on mount
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  useEffect(() => {
    if (authMode === 'firebase') {
      if (!auth) {
        console.warn('Firebase auth mode selected but Firebase is not initialized');
        setLoading(false);
        return;
      }
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          try {
            const idToken = await firebaseUser.getIdToken();
            // Try syncing user to backend (non-blocking)
            try {
              await axios.post(`${api_url}/api/sync-firebase-user`, {
                firebaseUser: {
                  uid: firebaseUser.uid,
                  email: firebaseUser.email,
                  displayName: firebaseUser.displayName,
                  photoURL: firebaseUser.photoURL
                },
                idToken: idToken
              });
            } catch (_) {}

            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL
            });
            setToken(idToken);
            localStorage.setItem('token', idToken);
            axios.defaults.headers.common['Authorization'] = `Bearer ${idToken}`;
          } catch (error) {
            console.error('❌ Error getting user token:', error);
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL
            });
          }
        } else {
          setUser(null);
          setToken(null);
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];
        }
        setLoading(false);
      });

      // Ensure header on mount if token existed
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }

      return unsubscribe;
    } else {
      // Backend mode: restore from localStorage
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      if (storedToken && storedUser) {
        setToken(storedToken);
        axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        try {
          const parsed = JSON.parse(storedUser);
          const normalized = {
            uid: parsed.uid || parsed._id,
            email: parsed.email,
            displayName: parsed.displayName,
            photoURL: parsed.photoURL
          };
          setUser(normalized);
        } catch {
          setUser(null);
        }
      }
      setLoading(false);
    }
  }, [authMode, token]);

  const login = async (email, password) => {
    if (authMode === 'backend') {
      const { data } = await axios.post(`${api_url}/api/login`, { email, password });
      const { token: jwtToken, user: backendUser } = data;
      localStorage.setItem('token', jwtToken);
      localStorage.setItem('authMode', 'backend');
      const normalized = {
        uid: backendUser._id,
        email: backendUser.email,
        displayName: backendUser.displayName,
        photoURL: backendUser.photoURL
      };
      localStorage.setItem('user', JSON.stringify(normalized));
      setAuthMode('backend');
      setToken(jwtToken);
  setUser(normalized);
      axios.defaults.headers.common['Authorization'] = `Bearer ${jwtToken}`;
      return { user: backendUser };
    }
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result;
    } catch (error) {
      console.error('❌ Login failed:', error);
      throw error;
    }
  };

  const signup = async (email, password) => {
    if (authMode === 'backend') {
      try {
        const { data } = await axios.post(`${api_url}/api/register`, { email, password });
        const { token: jwtToken, user: backendUser } = data;
        localStorage.setItem('token', jwtToken);
        localStorage.setItem('authMode', 'backend');
        const normalized2 = {
          uid: backendUser._id,
          email: backendUser.email,
          displayName: backendUser.displayName,
          photoURL: backendUser.photoURL
        };
        localStorage.setItem('user', JSON.stringify(normalized2));
        setAuthMode('backend');
        setToken(jwtToken);
        setUser(normalized2);
        axios.defaults.headers.common['Authorization'] = `Bearer ${jwtToken}`;
        return { user: backendUser };
      } catch (err) {
        const message = err?.response?.data?.error || 'Failed to register user';
        throw new Error(message);
      }
    }
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      return result;
    } catch (error) {
      // Helpful guidance for common Firebase config issue
      if (error?.code === 'auth/operation-not-allowed') {
        console.error('⚠️ Email/Password sign-in is disabled in Firebase project');
      }
      console.error('❌ Signup failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log('🔄 Logging out user');
      if (authMode === 'backend') {
        // Just clear local state
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete axios.defaults.headers.common['Authorization'];
        return;
      }
      await signOut(auth);
      setUser(null);
      setToken(null);
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      console.log('✅ Logout successful');
    } catch (error) {
      console.error('❌ Logout failed:', error);
      throw error;
    }
  };

  const loginWithGoogle = () => {
    try {
      if (authMode === 'backend') {
        throw new Error('Google login is only available in Firebase auth mode');
      }
      console.log('🔄 Attempting Google login');
      const provider = new GoogleAuthProvider();
      return signInWithPopup(auth, provider);
    } catch (error) {
      console.error('❌ Google login failed:', error);
      throw error;
    }
  };

  const value = {
    user,
    token,
    login,
    signup,
    logout,
    loginWithGoogle,
    loading,
    authMode,
  setAuthMode,
  updateAuthUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}