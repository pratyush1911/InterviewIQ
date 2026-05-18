import api from "../../../lib/api";

// This function sends the register form data to the backend.
export async function register({ username, email, password }) {
  const response = await api.post("/api/auth/register", {
    username,
    email,
    password,
  });
  return response.data;
}

// This function sends the login form data to the backend.
export async function login({ email, password }) {
  const response = await api.post("/api/auth/login", {
    email,
    password,
  });
  return response.data;
}

// This function asks the backend to clear the login cookie.
export async function logout() {
  const response = await api.get("/api/auth/logout");
  return response.data;
}

// This function asks the backend who is currently logged in.
export async function getMe() {
  const response = await api.get("/api/auth/get-me");
  return response.data;
}
