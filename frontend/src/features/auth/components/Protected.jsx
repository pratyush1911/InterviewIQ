import { useAuth } from "../hooks/useAuth";
import { Navigate } from "react-router-dom";

// This component protects pages that require login.
// It wraps pages like Dashboard, Home, Interview, and LiveInterview.
const Protected = ({ children }) => {
  // This block reads whether the app is checking auth and whether a user exists.
  const { loading, user } = useAuth();

  // This block shows a temporary loading state while /get-me is running.
  if (loading) {
    return (
      <main>
        <h1>loading...</h1>
      </main>
    );
  }

  // This block redirects logged-out visitors to the login page.
  if (!user) {
    return <Navigate to={"/login"} />;
  }

  // This line renders the protected page after login is confirmed.
  return children;
};

// This export lets routes wrap private pages with <Protected>.
export default Protected;
