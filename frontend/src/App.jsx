import { RouterProvider } from "react-router";
import { router } from "./app.routes.jsx";
import { AuthProvider } from "./features/auth/auth.context.jsx";

// This component wraps the website in auth state and routing.
// It is useful if the app is imported from App.jsx instead of main.jsx.
function App() {
  return (
    <AuthProvider>
      {/* This block renders whichever page matches the current browser URL. */}
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

// This export lets other files import the App component.
export default App;
