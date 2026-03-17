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
    { label: "Weak", color: "var(--risk-high)", width: "25%" },
    { label: "Fair", color: "var(--risk-moderate)", width: "50%" },
    { label: "Good", color: "var(--gn-primary)", width: "75%" },
    { label: "Strong", color: "var(--risk-low)", width: "100%" }
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

      <div className={styles.fieldWrapper}>
        <input
          className={styles.floatInput}
          id="login-email"
          name="email"
          type="email"
          placeholder=" "
          autoComplete="email"
          required
        />
        <label className={styles.floatingLabel} htmlFor="login-email">
          Email address
        </label>
        <ErrorText message={errors.email} />
      </div>

      <div className={styles.fieldWrapper}>
        <input
          className={styles.floatInput}
          id="login-password"
          name="password"
          type="password"
          placeholder=" "
          autoComplete="current-password"
          required
        />
        <label className={styles.floatingLabel} htmlFor="login-password">
          Password
        </label>
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

      <div className={styles.socialGrid}>
        <button className={`buttonGhost ${styles.socialButton}`} type="button">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Google
        </button>

        <button className={`buttonGhost ${styles.socialButton}`} type="button">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
          </svg>
          GitHub
        </button>
      </div>

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
        <div className={styles.fieldWrapper}>
          <input
            className={styles.floatInput}
            id="register-first-name"
            name="firstName"
            type="text"
            autoComplete="given-name"
            placeholder=" "
            required
          />
          <label className={styles.floatingLabel} htmlFor="register-first-name">
            First name
          </label>
          <ErrorText message={errors.firstName} />
        </div>

        <div className={styles.fieldWrapper}>
          <input
            className={styles.floatInput}
            id="register-last-name"
            name="lastName"
            type="text"
            autoComplete="family-name"
            placeholder=" "
            required
          />
          <label className={styles.floatingLabel} htmlFor="register-last-name">
            Last name
          </label>
          <ErrorText message={errors.lastName} />
        </div>
      </div>

      <div className={styles.fieldWrapper}>
        <input
          className={styles.floatInput}
          id="register-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder=" "
          required
        />
        <label className={styles.floatingLabel} htmlFor="register-email">
          Email address
        </label>
        <ErrorText message={errors.email} />
      </div>

      <div className={styles.fieldWrapper}>
        <input
          className={styles.floatInput}
          id="register-password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder=" "
          minLength={12}
          required
          onChange={(event) => setPassword(event.target.value)}
        />
        <label className={styles.floatingLabel} htmlFor="register-password">
          Create password
        </label>
        <ErrorText message={errors.password} />
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
                backgroundColor: strength.color,
                color: strength.color
              }}
            />
          </div>
          <div className={styles.helperList}>
            <span>Use 12+ characters, upper/lowercase letters, a number, and a symbol.</span>
          </div>
        </div>
      </div>

      <div className={styles.fieldWrapper}>
        <input
          className={styles.floatInput}
          id="register-confirm-password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder=" "
          required
        />
        <label className={styles.floatingLabel} htmlFor="register-confirm-password">
          Confirm password
        </label>
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

      <div className={styles.fieldWrapper}>
        <input
          className={styles.floatInput}
          id="reset-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder=" "
          required
        />
        <label className={styles.floatingLabel} htmlFor="reset-email">
          Account email
        </label>
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
