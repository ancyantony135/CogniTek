import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AutoRecordProvider } from "./context/AutoRecordContext";
import AppLayout from "./layouts/AppLayout";
import InstallPrompt from "./components/InstallPrompt";

// Pages
import AuthPage from "./pages/AuthPage";
import Home from "./pages/Home";
import Study from "./pages/Study";
import Schedule from "./pages/Schedule";
import Profile from "./pages/Profile";
import Record from "./pages/Record";
import Sylens from "./pages/Sylens";
import Onboarding from "./pages/Onboarding";

// ── Route guard: must be logged in ──────────────────────────────────────────
const ProtectedRoute = ({ children }) => {
  const { user, profileComplete } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  // Redirect to onboarding if profile not yet completed
  if (!profileComplete) return <Navigate to="/onboarding" replace />;
  return children;
};

// ── Onboarding-only gate: logged in but profile not done ─────────────────────
const OnboardingRoute = ({ children }) => {
  const { user, profileComplete } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  if (profileComplete) return <Navigate to="/dashboard" replace />;
  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <AutoRecordProvider>
        <BrowserRouter>
          <InstallPrompt />
          <Routes>
            {/* Auth */}
            <Route path="/" element={<AuthPage />} />
            <Route path="/register" element={<AuthPage />} />
            <Route path="/forgot-password" element={<AuthPage />} />

            {/* Onboarding (blocking — only for users without a profile) */}
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
        </BrowserRouter>
      </AutoRecordProvider>
    </AuthProvider>
  );
}
