import { useState } from "react";
import { AuthContext } from "./auth-context";

// This provider stores auth data for the whole website.
// children means "whatever pages/components are placed inside this provider."
export const AuthProvider = ({ children }) => {
  // This state stores the logged-in user object, or null when logged out.
  const [user, setUser] = useState(null);
  // This state tracks whether the app is still checking the current login cookie.
  const [loading, setLoading] = useState(true);

  return (
    // This block makes user, setUser, loading, and setLoading available everywhere.
    <AuthContext.Provider value={{ user, setUser, loading, setLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
