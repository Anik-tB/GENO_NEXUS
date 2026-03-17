"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import styles from "./forms.module.css";

type ErrorMap = Record<string, string>;

function getPasswordStrength(password: string) {
  let score = 0;

  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password) || password.length >= 12) score += 1;

  const levels = [
    { label: "Weak", color: "var(--gn-red)", width: "25%" },
    { label: "Fair", color: "var(--gn-gold)", width: "50%" },
    { label: "Good", color: "var(--gn-blue-mid)", width: "75%" },
    { label: "Strong", color: "var(--gn-green)", width: "100%" }
  ];

  return levels[Math.max(score - 1, 0)];
}

function validateEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function ErrorText({ message }: { message?: string }) {
  return message ? <p className="fieldError">{message}</p> : null;
}

function StatusMessage({
  error,
  status,
  fallback
}: {
  error?: string;
  status?: string;
  fallback?: React.ReactNode;
}) {
  if (error === "invalid_credentials") {
    return <div className="errorBanner">Invalid email or password.</div>;
  }

  if (error === "email_exists") {
    return <div className="errorBanner">An account with this email already exists.</div>;
  }

  if (error === "validation") {
    return <div className="errorBanner">Please correct the highlighted form details and try again.</div>;
  }

  if (error === "service_unavailable") {
    return (
      <div className="errorBanner">
        The authentication service is currently unavailable. Check your PostgreSQL connection and
        try again.
      </div>
    );
  }

  if (status === "sent") {
    return (
      <div className="statusBanner">
        If an account exists for that email, a reset link will be sent shortly.
      </div>
    );
  }

  if (status === "signed_out") {
    return <div className="statusBanner">You have been signed out.</div>;
  }

  if (status === "session_required") {
    return <div className="statusBanner">Please sign in to access your dashboard.</div>;
  }

  return fallback ? <>{fallback}</> : null;
}

interface FormMessageProps {
  error?: string;
  status?: string;
}

export function LoginForm({
  attempts,
  error,
  status
}: {
  attempts: number;
} & FormMessageProps) {
  const [errors, setErrors] = useState<ErrorMap>({});

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget);
    const nextErrors: ErrorMap = {};

    if (!validateEmail(String(formData.get("email") ?? ""))) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (String(formData.get("password") ?? "").length < 8) {
      nextErrors.password = "Password must be at least 8 characters.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      event.preventDefault();
    }
  }

  return (
    <form className={styles.form} action="/api/auth/login" method="post" onSubmit={handleSubmit}>
      <StatusMessage error={error} status={status} />

      <div>
        <label className="fieldLabel" htmlFor="login-email">
          Email address
        </label>
        <input
          className="fieldInput"
          id="login-email"
          name="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          required
        />
        <ErrorText message={errors.email} />
      </div>

      <div>
        <label className="fieldLabel" htmlFor="login-password">
          Password
        </label>
        <input
          className="fieldInput"
          id="login-password"
          name="password"
          type="password"
          placeholder="Enter your password"
          autoComplete="current-password"
          required
        />
        <ErrorText message={errors.password} />
      </div>

      <div className={styles.metaRow}>
        <label className={styles.checkbox}>
          <input name="remember" type="checkbox" value="true" />
          <span>Remember me on this device</span>
        </label>
        <Link className={styles.link} href="/reset-password">
          Forgot password?
        </Link>
      </div>

      {attempts >= 3 ? (
        <div className="statusBanner">Having trouble? Reset your password and try again.</div>
      ) : null}

      <button className={`buttonPrimary ${styles.submit}`} type="submit">
        Sign In to GenoNexus
      </button>

      <div className={styles.separator}>or continue with</div>

      <button className={`buttonGhost ${styles.socialButton}`} type="button">
        Google OAuth
      </button>

      <p className={styles.switchLine}>
        New to GenoNexus? <Link className={styles.link} href="/register">Create your account</Link>
      </p>
    </form>
  );
}

export function RegisterForm({ error, status }: FormMessageProps) {
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<ErrorMap>({});

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget);
    const nextErrors: ErrorMap = {};
    const firstName = String(formData.get("firstName") ?? "").trim();
    const lastName = String(formData.get("lastName") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const passwordValue = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");
    const termsAccepted = formData.get("termsAccepted");
    const medicalAcknowledged = formData.get("medicalAcknowledged");

    if (firstName.length < 2) nextErrors.firstName = "First name must be at least 2 characters.";
    if (lastName.length < 2) nextErrors.lastName = "Last name must be at least 2 characters.";
    if (!validateEmail(email)) nextErrors.email = "Enter a valid email address.";
    if (passwordValue.length < 12) {
      nextErrors.password = "Use at least 12 characters for a stronger password.";
    }
    if (passwordValue !== confirmPassword) {
      nextErrors.confirmPassword = "Passwords must match.";
    }
    if (!termsAccepted) nextErrors.termsAccepted = "You must accept the Terms of Service.";
    if (!medicalAcknowledged) {
      nextErrors.medicalAcknowledged = "You must acknowledge the medical-use disclaimer.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      event.preventDefault();
    }
  }

  return (
    <form className={styles.form} action="/api/auth/register" method="post" onSubmit={handleSubmit}>
      <StatusMessage error={error} status={status} />

      <div className={styles.row}>
        <div>
          <label className="fieldLabel" htmlFor="register-first-name">
            First name
          </label>
          <input
            className="fieldInput"
            id="register-first-name"
            name="firstName"
            type="text"
            autoComplete="given-name"
            required
          />
          <ErrorText message={errors.firstName} />
        </div>

        <div>
          <label className="fieldLabel" htmlFor="register-last-name">
            Last name
          </label>
          <input
            className="fieldInput"
            id="register-last-name"
            name="lastName"
            type="text"
            autoComplete="family-name"
            required
          />
          <ErrorText message={errors.lastName} />
        </div>
      </div>

      <div>
        <label className="fieldLabel" htmlFor="register-email">
          Email address
        </label>
        <input
          className="fieldInput"
          id="register-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="care@yourclinic.com"
          required
        />
        <ErrorText message={errors.email} />
      </div>

      <div>
        <label className="fieldLabel" htmlFor="register-password">
          Password
        </label>
        <input
          className="fieldInput"
          id="register-password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="Create a secure password"
          minLength={12}
          required
          onChange={(event) => setPassword(event.target.value)}
        />
        <div className={styles.strengthWrap}>
          <div className={styles.strengthMeta}>
            <span>Password strength</span>
            <strong>{password ? strength.label : "Start typing"}</strong>
          </div>
          <div className={styles.strengthTrack}>
            <div
              className={styles.strengthFill}
              style={{
                width: password ? strength.width : "0%",
                backgroundColor: strength.color
              }}
            />
          </div>
          <div className={styles.helperList}>
            <span>Use 12+ characters, upper/lowercase letters, a number, and a symbol.</span>
          </div>
        </div>
        <ErrorText message={errors.password} />
      </div>

      <div>
        <label className="fieldLabel" htmlFor="register-confirm-password">
          Confirm password
        </label>
        <input
          className="fieldInput"
          id="register-confirm-password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
        />
        <ErrorText message={errors.confirmPassword} />
      </div>

      <label className={styles.checkbox}>
        <input id="termsAccepted" name="termsAccepted" type="checkbox" value="true" required />
        <span>
          I agree to the Terms of Service and Privacy Policy for GenoNexus.
          <ErrorText message={errors.termsAccepted} />
        </span>
      </label>

      <label className={styles.checkbox}>
        <input
          id="medicalAcknowledged"
          name="medicalAcknowledged"
          type="checkbox"
          value="true"
          required
        />
        <span>
          I understand GenoNexus does not replace my doctor, pharmacist, or emergency care.
          <ErrorText message={errors.medicalAcknowledged} />
        </span>
      </label>

      <button className={`buttonPrimary ${styles.submit}`} type="submit">
        Create My Secure Account
      </button>

      <p className={styles.switchLine}>
        Already have access? <Link className={styles.link} href="/login">Sign in here</Link>
      </p>
    </form>
  );
}

export function ResetPasswordForm({ error: queryError, status }: FormMessageProps) {
  const [error, setError] = useState<string>();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");

    if (!validateEmail(email)) {
      setError("Enter a valid email address.");
      event.preventDefault();
      return;
    }

    setError(undefined);
  }

  return (
    <form
      className={styles.form}
      action="/api/auth/reset-password"
      method="post"
      onSubmit={handleSubmit}
    >
      <StatusMessage
        error={queryError}
        status={status}
        fallback={
          <div className="statusBanner">
            Enter your account email and we will send reset instructions if the account exists.
          </div>
        }
      />

      <div>
        <label className="fieldLabel" htmlFor="reset-email">
          Account email
        </label>
        <input
          className="fieldInput"
          id="reset-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
        />
        {error ? <p className="fieldError">{error}</p> : null}
      </div>

      <button className={`buttonPrimary ${styles.submit}`} type="submit">
        Send Reset Link
      </button>

      <p className={styles.switchLine}>
        Remembered your password? <Link className={styles.link} href="/login">Back to sign in</Link>
      </p>
    </form>
  );
}
