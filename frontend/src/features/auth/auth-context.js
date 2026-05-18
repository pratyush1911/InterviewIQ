import { createContext } from "react";

// This context is a shared box for authentication state.
// Any component can read it through useAuth instead of passing props through every page.
export const AuthContext = createContext(null);
