import React, { Suspense, lazy } from "react";
import { HashRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import ErrorBoundary from "./components/ErrorBoundary";

// Code-split every route so only the current page is downloaded on first load
const Login    = lazy(() => import("./components/Login/Login"));
const Register = lazy(() => import("./components/Register/Register"));
const Home     = lazy(() => import("./components/Home/Home"));
const Profile  = lazy(() => import("./components/Profile/Profile"));
const PostDetail = lazy(() => import("./components/postdetail/postdetail"));
const Messenger  = lazy(() => import("./components/messenger/messenger"));

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
      <AuthProvider>
        <Router>
          <Suspense fallback={<div style={{ padding: "2rem", textAlign: "center" }}>Loading…</div>}>
            <Routes>
              {/* Public Routes */}
              <Route path="/login"    element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Private Routes */}
              <Route element={<PrivateRoute />}>
                <Route path="/home"              element={<Home />} />
                <Route path="/profile/:userId"   element={<Profile />} />
                <Route path="/post/:postId"       element={<PostDetail />} />
                <Route path="/messenger"         element={<Messenger />} />
              </Route>

              {/* Redirect Root */}
              <Route path="/" element={<RootRedirect />} />

              {/* 404 */}
              <Route path="*" element={<p style={{ padding: "2rem" }}>404 — Page not found</p>} />
            </Routes>
          </Suspense>
        </Router>
      </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

const PrivateRoute = () => {
  const { currentUser, loading } = useAuth();
  if (loading) return <div style={{ padding: "2rem", textAlign: "center" }}>Loading…</div>;
  return currentUser ? <Outlet /> : <Navigate to="/login" />;
};

const RootRedirect = () => {
  const { currentUser, loading } = useAuth();
  if (loading) return null;
  return currentUser ? <Navigate to="/home" /> : <Navigate to="/login" />;
};

export default App;
