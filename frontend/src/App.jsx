import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";

import Sidebar from "./components/layout/Sidebar";
import Navbar from "./components/layout/Navbar";
import Dashboard from "./components/pages/Dashboard";
import OrganizationSetup from "./components/pages/OrganizationSetup";
import AssetDirectory from "./components/pages/AssetDirectory";
import AssetDetail from "./components/pages/AssetDetail";
import Allocations from "./components/pages/Allocations";
import Maintenance from "./components/pages/Maintenance";
import Notifications from "./components/pages/Notifications";
import ResourceBooking from "./components/ui/ResourceBooking";
import AuthLayout from "./components/AuthLayout";
import Login from "./components/Login";
import Signup from "./components/Signup";

import "./Auth.css";

// ----------------------
// Auth Pages
// ----------------------

function LoginPage() {
  const navigate = useNavigate();

  return (
    <AuthLayout>
      <Login onNavigateToSignup={() => navigate("/signup")} />
    </AuthLayout>
  );
}

function SignupPage() {
  const navigate = useNavigate();

  return (
    <AuthLayout>
      <Signup onNavigateToLogin={() => navigate("/login")} />
    </AuthLayout>
  );
}

// ----------------------
// Main Layout
// ----------------------

function MainLayout({ children }) {
  return (
    <div className="flex h-screen bg-surface">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

// ----------------------
// App
// ----------------------

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Authentication */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Dashboard */}
        <Route
          path="/"
          element={
            <MainLayout>
              <Dashboard />
            </MainLayout>
          }
        />

        <Route
          path="/organization"
          element={
            <MainLayout>
              <OrganizationSetup />
            </MainLayout>
          }
        />

        <Route
          path="/assets"
          element={
            <MainLayout>
              <AssetDirectory />
            </MainLayout>
          }
        />

        <Route
          path="/assets/:id"
          element={
            <MainLayout>
              <AssetDetail />
            </MainLayout>
          }
        />

        <Route
          path="/allocations"
          element={
            <MainLayout>
              <Allocations />
            </MainLayout>
          }
        />

        <Route
          path="/bookings"
          element={
            <MainLayout>
              <ResourceBooking />
            </MainLayout>
          }
        />

        <Route
          path="/notifications"
          element={
            <MainLayout>
              <Notifications />
            </MainLayout>
          }
        />
        <Route path="/maintenance" element={<MainLayout><Maintenance /></MainLayout>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;