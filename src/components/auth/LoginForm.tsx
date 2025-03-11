import { useState, useEffect } from "react";
import { signIn } from "@/lib/supabase/auth";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card } from "../ui/card";
import { useToast } from "../ui/use-toast";
import { useNavigate, useLocation } from "react-router-dom";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [loginSuccess, setLoginSuccess] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if user was redirected from signup
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const fromSignup = params.get("fromSignup");
    if (fromSignup === "true") {
      toast({
        title: "Account created",
        description: "Your account has been created. Please log in.",
      });
    }
  }, [location, toast]);

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!password) {
      errors.password = "Password is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await signIn(email, password);
      setLoginSuccess(true);
      toast({
        title: "Login successful",
        description: "Welcome back! You have been logged in.",
      });

      // Delay navigation to show success state
      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (error) {
      console.error("Login error:", error);

      // Provide more user-friendly error messages
      if (
        error.message?.includes("Invalid login") ||
        error.message?.includes("Invalid email") ||
        error.message?.includes("Invalid password")
      ) {
        toast({
          title: "Invalid credentials",
          description: "The email or password you entered is incorrect",
          variant: "destructive",
        });
      } else if (error.message?.includes("Email not confirmed")) {
        toast({
          title: "Email not confirmed",
          description:
            "Please check your email and confirm your account before logging in",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Login failed",
          description:
            error.message || "Please check your credentials and try again",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (loginSuccess) {
    return (
      <Card className="w-full max-w-md p-6 mx-auto">
        <div className="text-center space-y-4">
          <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
          <h2 className="text-2xl font-bold">Login Successful!</h2>
          <p className="text-gray-600">
            Welcome back! You are now being redirected to your dashboard.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md p-6 mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">Log In</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="flex justify-between">
            <span>Email</span>
            {formErrors.email && (
              <span className="text-red-500 text-xs flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                {formErrors.email}
              </span>
            )}
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your.email@example.com"
            required
            className={formErrors.email ? "border-red-500" : ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" className="flex justify-between">
            <span>Password</span>
            {formErrors.password && (
              <span className="text-red-500 text-xs flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                {formErrors.password}
              </span>
            )}
          </Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={formErrors.password ? "border-red-500" : ""}
          />
          <div className="flex justify-end">
            <a
              href="/reset-password"
              className="text-xs text-blue-600 hover:underline"
            >
              Forgot password?
            </a>
          </div>
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Logging in..." : "Log In"}
        </Button>
        <div className="text-center text-sm mt-4">
          <a href="/signup" className="text-blue-600 hover:underline">
            Don't have an account? Sign up
          </a>
        </div>
      </form>
    </Card>
  );
}
