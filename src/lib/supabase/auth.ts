import { supabase } from "../supabase";
import { User } from "@supabase/supabase-js";

export async function signUp(email: string, password: string) {
  // Validate password strength
  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters long");
  }

  if (!/[A-Z]/.test(password)) {
    throw new Error("Password must contain at least one uppercase letter");
  }

  if (!/[a-z]/.test(password)) {
    throw new Error("Password must contain at least one lowercase letter");
  }

  if (!/[0-9]/.test(password)) {
    throw new Error("Password must contain at least one number");
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    throw new Error("Password must contain at least one special character");
  }

  try {
    // First check if user already exists to provide better error message
    const { data: existingUser, error: checkError } =
      await supabase.auth.signInWithPassword({
        email,
        password: "dummy-password-for-check", // Use a dummy password for the check
      });

    // If we get a user back, it means the email exists (even though the password was wrong)
    if (existingUser?.user) {
      throw new Error(
        "This email is already registered. Please try logging in instead.",
      );
    }

    // Proceed with signup if user doesn't exist
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;
    return data;
  } catch (error) {
    // If the error is from our dummy check but not about existing user, ignore it
    if (
      error.message?.includes("Invalid login credentials") ||
      error.message?.includes("Invalid email or password")
    ) {
      // This is expected from our dummy check, proceed with signup
      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signupError) throw signupError;
      return data;
    }

    // Otherwise, rethrow the error
    throw error;
  }
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser(): Promise<User | null> {
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });

  if (error) throw error;
}

export async function updatePassword(password: string) {
  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) throw error;
}
