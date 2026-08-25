import { useState } from "react";
import { Link, useLocation } from "react-router";
import { useAuth } from "../context/AuthContext";
import { CheckIcon, TriangleAlertIcon } from "lucide-react";
import InputBox from "../common/InputBox";
import Label from "../common/Label";

export default function AuthForm() {
  const { signIn, signUp } = useAuth();
  const location = useLocation();
  const isSignUpMode = location.pathname === "/signup";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setSubmitting(true);

    const { error: authError } = isSignUpMode
      ? await signUp(email, password)
      : await signIn(email, password);

    setSubmitting(false);

    if (authError) {
      setError(authError);
      return;
    }

    if (isSignUpMode) {
      setSuccessMessage("Account created! Check your email for confirmation.");
    } else {
      window.location.href = "/";
    }
  };

  return (
    <div className="bg-primary flex min-h-screen items-center justify-center px-4 py-12 transition-colors duration-300">
      <div className="bg-secondary border-border-subtle w-full max-w-md rounded-2xl border p-10 shadow-[0_8px_30px_rgb(0,0,0,0.02)] transition-all duration-300">
        {/* Header Block */}
        <div className="mb-8 text-center">
          <h2 className="text-text-primary text-3xl font-extrabold tracking-tight">
            {isSignUpMode ? "Create your account" : "Sign in to account"}
          </h2>
          <p className="text-text-muted mt-2 text-sm">
            {isSignUpMode
              ? "Start pasting your clipboard today"
              : "Welcome back! Enter your details below"}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-critical/5 text-critical border-critical/10 animate-fade-in mb-6 flex items-center gap-3 rounded-xl border p-4 text-sm font-medium shadow-sm">
            <TriangleAlertIcon />
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div className="bg-success/5 text-success border-success/10 animate-fade-in mb-6 flex items-center gap-3 rounded-xl border p-4 text-sm font-medium shadow-sm">
            <CheckIcon />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Input Wrapper */}
          <div className="space-y-2">
            <Label htmlFor="email-input" text="Email Address" />

            <InputBox
              id={"email-input"}
              type={"email"}
              required={true}
              value={email}
              onChange={setEmail}
              placeholder={"name@company.com"}
              disabled={submitting}
            />
          </div>

          {/* Password Input Wrapper */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor={"password-input"} text={"Password"} />
              {!isSignUpMode && (
                <Link
                  to="/forgot"
                  className="text-link text-xs font-semibold underline-offset-2 hover:underline"
                >
                  Forgot password?
                </Link>
              )}
            </div>

            <InputBox
              id={"password-input"}
              type={"password"}
              required={true}
              value={password}
              onChange={setPassword}
              placeholder={"••••••••••••"}
              disabled={submitting}
            />
          </div>

          {/* Primary Action Button (Uses brand accent variables) */}
          <button
            type="submit"
            disabled={submitting}
            className="bg-accent text-accent-foreground shadow-accent/10 w-full cursor-pointer rounded-xl py-4 text-center font-semibold shadow-md transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-40"
          >
            {submitting
              ? "Verifying..."
              : isSignUpMode
                ? "Create Free Account"
                : "Sign In to Workspace"}
          </button>
        </form>

        {/* Dynamic Interface Links */}
        <div className="border-border-subtle text-text-muted mt-8 border-t pt-6 text-center text-sm">
          {isSignUpMode ? (
            <p>
              Already have an account?{" "}
              <Link
                to="/signin"
                onClick={() => {
                  setSuccessMessage(null);
                  setError(null);
                }}
                className="text-link font-bold underline-offset-4 transition hover:underline"
              >
                Sign in
              </Link>
            </p>
          ) : (
            <p>
              Don't have an account?{" "}
              <Link
                to="/signup"
                onClick={() => {
                  setSuccessMessage(null);
                  setError(null);
                }}
                className="text-link font-bold underline-offset-4 transition hover:underline"
              >
                Create an account
              </Link>
            </p>
          )}
          <p>
            Or{" "}
            <Link
              to="/"
              className="font-medium underline-offset-4 transition hover:underline"
            >
              Continue as Guest
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
