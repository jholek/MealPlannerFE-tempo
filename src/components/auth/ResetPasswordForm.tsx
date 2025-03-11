import { useState } from "react";
import { resetPassword } from "@/lib/supabase/auth";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card } from "../ui/card";
import { useToast } from "../ui/use-toast";

export default function ResetPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await resetPassword(email);
      setSubmitted(true);
      toast({
        title: "Reset link sent",
        description: "Check your email for a password reset link",
      });
    } catch (error) {
      console.error("Reset password error:", error);
      toast({
        title: "Failed to send reset link",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <Card className="w-full max-w-md p-6 mx-auto">
        <h2 className="text-2xl font-bold mb-4 text-center">
          Check Your Email
        </h2>
        <p className="text-center mb-4">
          We've sent a password reset link to {email}. Please check your inbox.
        </p>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setSubmitted(false)}
        >
          Send another link
        </Button>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md p-6 mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">Reset Password</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your.email@example.com"
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Sending..." : "Send Reset Link"}
        </Button>
        <div className="text-center text-sm mt-4">
          <a href="/login" className="text-blue-600 hover:underline">
            Back to login
          </a>
        </div>
      </form>
    </Card>
  );
}
