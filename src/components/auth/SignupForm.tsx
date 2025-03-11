import { useState } from "react";
import { signUp } from "@/lib/supabase/auth";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card } from "../ui/card";
import { useToast } from "../ui/use-toast";
import { useNavigate } from "react-router-dom";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export default function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Password validation
  const validatePassword = (password: string) => {
    const errors = [];
    if (password.length < 8) {
      errors.push("Password must be at least 8 characters long");
    }
    if (!/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter");
    }
    if (!/[a-z]/.test(password)) {
      errors.push("Password must contain at least one lowercase letter");
    }
    if (!/[0-9]/.test(password)) {
      errors.push("Password must contain at least one number");
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      errors.push("Password must contain at least one special character");
    }
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset errors
    setFormErrors({});
    const errors: Record<string, string> = {};

    // Validate email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Please enter a valid email address";
    }

    // Validate password
    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      errors.password = passwordErrors[0];
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords don't match";
    }

    // If there are errors, show them and stop
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setLoading(true);

    try {
      await signUp(email, password);
      setSuccess(true);
      toast({
        title: "Account created successfully",
        description: "Please check your email to confirm your account",
        variant: "default",
      });

      // Delay navigation to show success state
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error) {
      console.error("Signup error:", error);

      // Handle the case where user already exists
      if (
        error.message?.includes("already registered") ||
        error.message?.includes("already exists") ||
        error.message?.includes("already created")
      ) {
        toast({
          title: "Email already registered",
          description:
            "This email is already registered. Please try logging in instead.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Signup failed",
          description:
            error.message || "There was an error creating your account",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="w-full max-w-md p-6 mx-auto">
        <div className="text-center space-y-4">
          <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
          <h2 className="text-2xl font-bold">Account Created!</h2>
          <p className="text-gray-600">
            Your account has been created successfully. Please check your email
            to confirm your account.
          </p>
          <p className="text-gray-600">Redirecting to login page...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md p-6 mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">Create Account</h2>
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
          <div className="text-xs text-gray-500 space-y-1 mt-1">
            <p>Password must:</p>
            <ul className="list-disc pl-5 space-y-0.5">
              <li className={password.length >= 8 ? "text-green-600" : ""}>
                Be at least 8 characters long
              </li>
              <li className={/[A-Z]/.test(password) ? "text-green-600" : ""}>
                Contain at least one uppercase letter
              </li>
              <li className={/[a-z]/.test(password) ? "text-green-600" : ""}>
                Contain at least one lowercase letter
              </li>
              <li className={/[0-9]/.test(password) ? "text-green-600" : ""}>
                Contain at least one number
              </li>
              <li
                className={
                  /[^A-Za-z0-9]/.test(password) ? "text-green-600" : ""
                }
              >
                Contain at least one special character
              </li>
            </ul>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="flex justify-between">
            <span>Confirm Password</span>
            {formErrors.confirmPassword && (
              <span className="text-red-500 text-xs flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                {formErrors.confirmPassword}
              </span>
            )}
          </Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className={formErrors.confirmPassword ? "border-red-500" : ""}
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creating account..." : "Sign Up"}
        </Button>

        <div className="text-center text-sm mt-4">
          <a href="/login" className="text-blue-600 hover:underline">
            Already have an account? Log in
          </a>
        </div>
      </form>
    </Card>
  );
}
