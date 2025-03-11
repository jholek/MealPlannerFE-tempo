import { Suspense, lazy } from "react";
import { useRoutes, Routes, Route } from "react-router-dom";
import routes from "tempo-routes";
import { Toaster } from "./components/ui/toaster";
import { AuthProvider } from "./contexts/AuthContext";
import AuthGuard from "./components/auth/AuthGuard";

// Lazy load pages for better performance
const Home = lazy(() => import("./components/home"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const SignupPage = lazy(() => import("./pages/SignupPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const UpdatePasswordPage = lazy(() => import("./pages/UpdatePasswordPage"));
const FirstTimeSetup = lazy(() => import("./components/auth/FirstTimeSetup"));
const SharedListPage = lazy(() => import("./pages/SharedListPage"));

function App() {
  return (
    <AuthProvider>
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
          </div>
        }
      >
        <>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/update-password" element={<UpdatePasswordPage />} />
            <Route path="/shared-list/:shareId" element={<SharedListPage />} />

            {/* First-time setup route */}
            <Route
              path="/setup"
              element={
                <AuthGuard>
                  <FirstTimeSetup />
                </AuthGuard>
              }
            />

            {/* Protected routes */}
            <Route
              path="/"
              element={
                <AuthGuard>
                  <Home />
                </AuthGuard>
              }
            />

            {/* Tempo routes for development */}
            {import.meta.env.VITE_TEMPO === "true" && (
              <Route path="/tempobook/*" element={useRoutes(routes)} />
            )}
          </Routes>
          <Toaster />
        </>
      </Suspense>
    </AuthProvider>
  );
}

export default App;
