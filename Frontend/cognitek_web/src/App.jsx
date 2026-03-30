import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AutoRecordProvider } from "./context/AutoRecordContext";
import AppLayout from "./layouts/AppLayout";
import InstallPrompt from "./components/InstallPrompt";
import SplashScreen from "./components/SplashScreen";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, fontFamily: "sans-serif" }}>
          <h2 style={{ color: "red" }}>App Crashed</h2>
          <details style={{ whiteSpace: "pre-wrap" }}>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo?.componentStack}
          </details>
          <button onClick={() => { localStorage.clear(); window.location.href = "/"; }} style={{ marginTop: 20, padding: 10 }}>Clear Storage & Reload</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Pages
import AuthPage from "./pages/AuthPage";
import Home from "./pages/Home";
import Study from "./pages/Study";
import Schedule from "./pages/Schedule";
import Profile from "./pages/Profile";
import Record from "./pages/Record";
import Sylens from "./pages/Sylens";
import Onboarding from "./pages/Onboarding";
import ExamMode from "./pages/ExamMode";
import ResearchMode from "./pages/ResearchMode";

// ── Route guard: must be logged in ──────────────────────────────────────────
const ProtectedRoute = ({ children }) => {
  const { user, profileComplete } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  if (!profileComplete) return <Navigate to="/onboarding" replace />;
  return children;
};

// ── Onboarding-only gate ─────────────────────────────────────────────────────
const OnboardingRoute = ({ children }) => {
  const { user, profileComplete } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  if (profileComplete) return <Navigate to="/dashboard" replace />;
  return children;
};

function AppRoutes() {
  return (
    <>
      <InstallPrompt />
      <Routes>
        {/* Auth */}
        <Route path="/" element={<AuthPage />} />
        <Route path="/register" element={<AuthPage />} />
        <Route path="/forgot-password" element={<AuthPage />} />

        {/* Onboarding */}
        <Route
          path="/onboarding"
          element={
            <OnboardingRoute>
              <Onboarding />
            </OnboardingRoute>
          }
        />

        {/* Protected App Routes */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Home />} />
          <Route path="/study" element={<Study />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/sylens" element={<Sylens />} />
          <Route path="/exam-mode" element={<ExamMode />} />
          <Route path="/research-mode" element={<ResearchMode />} />
        </Route>

        {/* Record Page (no Bottom Bar) */}
        <Route
          path="/record"
          element={
            <ProtectedRoute>
              <Record />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}

export default function App() {
  // Use sessionStorage so splash only shows ONCE per browser session,
  // not on every hard-refresh (which resets useState to false)
  const [splashDone, setSplashDone] = useState(
    () => sessionStorage.getItem("splash_shown") === "1"
  );

  const handleSplashDone = () => {
    sessionStorage.setItem("splash_shown", "1");
    setSplashDone(true);
  };

  return (
    <ErrorBoundary>
      <AuthProvider>
        <AutoRecordProvider>
          <BrowserRouter>
            {!splashDone && <SplashScreen onDone={handleSplashDone} />}
            {splashDone && <AppRoutes />}
          </BrowserRouter>
        </AutoRecordProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
