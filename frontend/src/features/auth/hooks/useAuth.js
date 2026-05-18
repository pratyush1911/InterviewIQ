import { useContext, useEffect } from "react";
import { AuthContext } from "../auth-context";
import { login, register, logout, getMe } from "../services/auth.api";

// This custom hook is the main auth helper used by pages.
// It gives pages the current user plus login, register, and logout functions.
export const useAuth = () => {
  // This block reads the shared auth state from AuthProvider.
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  const { user, setUser, loading, setLoading } = context;

  // This block logs in a user and saves the returned user in React state.
  const handleLogin = async ({ email, password }) => {
    try {
      const data = await login({ email, password });
      setUser(data.user);
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.msg || "Unable to log in";
      console.warn(message);
      setUser(null);
      return { success: false, message };
    }
  };

  // This block registers a user and then treats them as logged in.
  const handleRegister = async ({ username, email, password }) => {
    try {
      const data = await register({ username, email, password });
      setUser(data.user);
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.msg || "Unable to create account";
      console.warn(message);
      setUser(null);
      return { success: false, message };
    }
  };

  // This block logs out through the backend and clears the frontend user state.
  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.msg || "Unable to sign out";
      console.warn(message);
      return { success: false, message };
    }
  };

  // This effect runs once when the app loads.
  // It checks whether the browser already has a valid login cookie.
  useEffect(() => {
    let cancelled = false;

    // This inner function calls /get-me and updates auth state.
    const getAndSetUser = async () => {
      try {
        const data = await getMe();
        if (!cancelled) {
          setUser(data.user);
        }
      } catch {
        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    getAndSetUser();
    // This cleanup prevents React state updates after the component unmounts.
    return () => {
      cancelled = true;
    };
  }, [setLoading, setUser]);

  // This return value is what pages receive when they call useAuth().
  return { user, loading, handleLogin, handleLogout, handleRegister };
};
