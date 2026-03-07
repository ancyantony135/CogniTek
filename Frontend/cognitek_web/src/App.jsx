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

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/" replace />;
  }
  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <AutoRecordProvider>
        <BrowserRouter>
          <InstallPrompt />
          <Routes>
            {/* Unified Auth Page for Login, Register, Recovery */}
            <Route path="/" element={<AuthPage />} />
            <Route path="/register" element={<AuthPage />} />
            <Route path="/forgot-password" element={<AuthPage />} />

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

            {/* Record Page (No Bottom Bar) */}
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
