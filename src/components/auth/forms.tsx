"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { startTransition, type FormEvent, type ReactNode, useState } from "react";
import { signInWithPopup } from "firebase/auth";
import {
  ACCOUNT_CATEGORIES,
  ACCOUNT_CATEGORY_LABELS
} from "@/lib/auth/account-category";
import {
  createGoogleProvider,
  getFirebaseClientAuth,
  isFirebaseClientConfigured
} from "@/lib/firebase/client";
import styles from "./forms.module.css";

type ErrorMap = Record<string, string>;

const LOGIN_TAGS = ["Secure uploads", "Case review", "Report history"];
const REGISTER_TAGS = ["Verified email", "Provider sign-in", "Clinical-ready safeguards"];

function validateEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function isAccountCategory(value: string) {
  return ACCOUNT_CATEGORIES.includes(value as (typeof ACCOUNT_CATEGORIES)[number]);
}

function getStrongPasswordError(password: string) {
  if (password.length < 12) {
    return "Use at least 12 characters.";
  }

  if (!/[a-z]/.test(password)) {
    return "Include at least one lowercase letter.";
  }

  if (!/[A-Z]/.test(password)) {
    return "Include at least one uppercase letter.";
  }

  if (!/\d/.test(password)) {
    return "Include at least one number.";
  }

  return undefined;
}

function getPasswordAssessment(password: string) {
  const requirements = [
    { label: "12 or more characters", met: password.length >= 12 },
    { label: "Uppercase and lowercase letters", met: /[A-Z]/.test(password) && /[a-z]/.test(password) },
    { label: "At least one number", met: /\d/.test(password) }
  ];

  const score = requirements.filter((requirement) => requirement.met).length;

  if (!password) {
    return {
      label: "Use a strong password",
      width: "0%",
      toneClass: styles.meterIdle,
      requirements
    };
  }

  if (score === 1) {
    return {
      label: "Needs work",
      width: "33%",
      toneClass: styles.meterWeak,
      requirements
    };
  }

  if (score === 2) {
    return {
      label: "Strong",
      width: "66%",
      toneClass: styles.meterGood,
      requirements
    };
  }

  return {
    label: "Excellent",
    width: "100%",
    toneClass: styles.meterExcellent,
    requirements
  };
}

function ErrorText({ id, message }: { id: string; message?: string }) {
  return message ? (
    <p id={id} className={styles.fieldError}>
      {message}
    </p>
  ) : null;
}

function StatusMessage({ error, status }: { error?: string; status?: string }) {
  if (error === "invalid_credentials") {
    return <div className={styles.errorBanner}>The email and password combination did not match our records.</div>;
  }

  if (error === "social_account") {
    return <div className={styles.statusBanner}>This account uses Google or GitHub sign-in. Use one of the provider buttons above.</div>;
  }

  if (error === "email_exists") {
    return <div className={styles.errorBanner}>An account with this email already exists.</div>;
  }

  if (error === "validation") {
    return <div className={styles.errorBanner}>Please correct the highlighted fields and try again.</div>;
  }

  if (error === "service_unavailable") {
    return <div className={styles.errorBanner}>The authentication service is temporarily unavailable. Please try again shortly.</div>;
  }

  if (error === "firebase_not_configured") {
    return <div className={styles.errorBanner}>Google sign-in is not configured yet. Add the Firebase web and server credentials first.</div>;
  }

  if (error === "google_sign_in_failed") {
    return <div className={styles.errorBanner}>Google sign-in could not be completed. Check Firebase Auth, authorized domains, and popup permissions.</div>;
  }

  if (error === "invalid_token") {
    return <div className={styles.errorBanner}>This password reset link is invalid or has expired.</div>;
  }

  if (status === "sent") {
    return <div className={styles.statusBanner}>If the account exists, password reset instructions will arrive shortly.</div>;
  }

  if (status === "signed_out") {
    return <div className={styles.statusBanner}>You have been signed out.</div>;
  }

  if (status === "session_required") {
    return <div className={styles.statusBanner}>Please sign in to access your GenoNexus workspace.</div>;
  }

  if (status === "password_reset") {
    return <div className={styles.statusBanner}>Password updated. Sign in with your new credentials.</div>;
  }

  return null;
}

function AuthTabs() {
  const pathname = usePathname();
  const isLogin = pathname === "/login";

  return (
    <div className={styles.tabContainer}>
      <Link href="/login" className={`${styles.tab} ${isLogin ? styles.tabActive : ""}`}>
        Sign in
      </Link>
      <Link href="/register" className={`${styles.tab} ${!isLogin ? styles.tabActive : ""}`}>
        Create account
      </Link>
    </div>
  );
}

function FieldShell({
  id,
  label,
  error,
  helper,
  action,
  children
}: {
  id: string;
  label: string;
  error?: string;
  helper?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={styles.field}>
      <div className={styles.labelRow}>
        <label className={styles.label} htmlFor={id}>
          {label}
        </label>
        {action}
      </div>
      {children}
      {helper ? <p className={styles.helperText}>{helper}</p> : null}
      <ErrorText id={`${id}-error`} message={error} />
    </div>
  );
}

function PasswordStrengthPanel({ password }: { password: string }) {
  const assessment = getPasswordAssessment(password);

  return (
    <div className={styles.passwordPanel}>
      <div className={styles.meterHeader}>
        <span>Password strength</span>
        <strong>{assessment.label}</strong>
      </div>
      <div className={styles.meterTrack}>
        <div className={`${styles.meterFill} ${assessment.toneClass}`} style={{ width: assessment.width }} />
      </div>
      <div className={styles.requirementList}>
        {assessment.requirements.map((requirement) => (
          <span
            key={requirement.label}
            className={`${styles.requirementItem} ${requirement.met ? styles.requirementMet : ""}`}
          >
            {requirement.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function PasswordToggle({
  showPassword,
  onToggle
}: {
  showPassword: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className={styles.passwordToggle}
      onClick={onToggle}
      aria-label={showPassword ? "Hide password" : "Show password"}
    >
      {showPassword ? "Hide" : "Show"}
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.47a5.54 5.54 0 0 1-2.4 3.64v3.02h3.88c2.27-2.09 3.54-5.18 3.54-8.69Z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.88-3.02c-1.07.72-2.44 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.95H1.27v3.11A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.27 14.27A7.2 7.2 0 0 1 4.9 12c0-.79.14-1.56.37-2.27V6.62H1.27A12 12 0 0 0 0 12c0 1.94.46 3.77 1.27 5.38l4-3.11Z" />
      <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.61 4.58 1.8l3.44-3.44C17.95 1.19 15.23 0 12 0A12 12 0 0 0 1.27 6.62l4 3.11c.95-2.84 3.6-4.96 6.73-4.96Z" />
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

function SocialButton({
  label,
  provider,
  icon,
  onClick,
  disabled = false
}: {
  label: string;
  provider: "google" | "github";
  icon: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      className={`${styles.socialButton} ${
        provider === "google" ? styles.socialButtonGoogle : styles.socialButtonGithub
      }`}
      type="button"
      onClick={onClick}
      disabled={disabled}
    >
      <span className={styles.socialIcon}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function SectionCard({
  title,
  copy,
  children
}: {
  title: string;
  copy: string;
  children: ReactNode;
}) {
  return (
    <section className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>{title}</h2>
        <p className={styles.sectionCopy}>{copy}</p>
      </div>
      {children}
    </section>
  );
}

function GoogleButton({ onError }: { onError: (error?: string) => void }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleClick() {
    onError(undefined);

    if (!isFirebaseClientConfigured()) {
      onError("firebase_not_configured");
      return;
    }

    const auth = getFirebaseClientAuth();
    setIsLoading(true);

    try {
      const result = await signInWithPopup(auth, createGoogleProvider());
      const idToken = await result.user.getIdToken();
      const response = await fetch("/api/auth/firebase/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          idToken,
          remember: true
        })
      });

      const data = (await response.json().catch(() => null)) as { error?: string; redirectTo?: string } | null;

      if (!response.ok) {
        onError(data?.error === "firebase_not_configured" ? "firebase_not_configured" : "google_sign_in_failed");
        return;
      }

      startTransition(() => {
        router.replace(data?.redirectTo || "/dashboard");
        router.refresh();
      });
    } catch (error) {
      console.error("Google sign-in failed:", error);
      onError("google_sign_in_failed");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SocialButton
      label={isLoading ? "Connecting..." : "Continue with Google"}
      provider="google"
      icon={<GoogleIcon />}
      onClick={handleClick}
      disabled={isLoading}
    />
  );
}

function GithubButton() {
  return (
    <SocialButton
      label="Continue with GitHub"
      provider="github"
      icon={<GithubIcon />}
      onClick={() => window.location.assign("/api/auth/github/login")}
    />
  );
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
  const [socialError, setSocialError] = useState<string | undefined>();
  const [errors, setErrors] = useState<ErrorMap>({});
  const [showPassword, setShowPassword] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
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
    <div className="animate-fade-in-up">
      <AuthTabs />

      <div className={styles.headerBlock}>
        <p className={styles.kicker}>Welcome back</p>
        <h1 className={styles.title}>Sign in to GenoNexus</h1>
        <p className={styles.subtitle}>Access your secure workspace for uploads, reports, and medication-safety review.</p>
      </div>

      <div className={styles.tagRow}>
        {LOGIN_TAGS.map((item) => (
          <span key={item} className={styles.tag}>
            {item}
          </span>
        ))}
      </div>

      <div className={styles.statusStack}>
        <StatusMessage error={socialError ?? error} status={status} />
      </div>

      <div className={styles.socialGrid}>
        <GoogleButton onError={setSocialError} />
        <GithubButton />
      </div>

      <div className={styles.divider}>
        <span>Or continue with email</span>
      </div>

      <form className={styles.form} action="/api/auth/login" method="post" onSubmit={handleSubmit} noValidate>
        <FieldShell id="login-email" label="Email address" error={errors.email}>
          <input
            className={`${styles.input} ${errors.email ? styles.inputError : ""}`}
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect="off"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "login-email-error" : undefined}
            autoFocus
            required
          />
        </FieldShell>

        <FieldShell
          id="login-password"
          label="Password"
          error={errors.password}
          action={
            <Link className={styles.inlineLink} href="/reset-password">
              Forgot password?
            </Link>
          }
        >
          <div className={styles.passwordControl}>
            <input
              className={`${styles.input} ${errors.password ? styles.inputError : ""}`}
              id="login-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "login-password-error" : undefined}
              required
            />
            <PasswordToggle showPassword={showPassword} onToggle={() => setShowPassword((value) => !value)} />
          </div>
        </FieldShell>

        <div className={styles.metaRow}>
          <label className={styles.checkbox}>
            <input name="remember" type="checkbox" value="true" />
            <span className={styles.checkboxIndicator} />
            <span className={styles.checkboxText}>Remember this device</span>
          </label>
          <span className={styles.metaHint}>Encrypted session cookies</span>
        </div>

        {attempts >= 3 ? (
          <div className={styles.statusBanner}>
            Multiple unsuccessful attempts detected. Reset your password if you no longer trust the current one.
          </div>
        ) : null}

        <button className={styles.submitBtn} type="submit">
          Sign in
        </button>

        <p className={styles.switchLine}>
          Need an account?{" "}
          <Link className={styles.inlineLink} href="/register">
            Create one
          </Link>
        </p>
      </form>
    </div>
  );
}

export function RegisterForm({ error, status }: FormMessageProps) {
  const [socialError, setSocialError] = useState<string | undefined>();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<ErrorMap>({});

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget);
    const nextErrors: ErrorMap = {};
    const fullName = String(formData.get("fullName") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const accountCategory = String(formData.get("accountCategory") ?? "");
    const passwordValue = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");
    const termsAccepted = formData.get("termsAccepted");
    const medicalAcknowledged = formData.get("medicalAcknowledged");

    if (fullName.split(/\s+/).filter(Boolean).length < 2) {
      nextErrors.fullName = "Enter your first and last name.";
    }

    if (!validateEmail(email)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!isAccountCategory(accountCategory)) {
      nextErrors.accountCategory = "Select the category that best describes you.";
    }

    const passwordError = getStrongPasswordError(passwordValue);
    if (passwordError) {
      nextErrors.password = passwordError;
    }

    if (passwordValue !== confirmPassword) {
      nextErrors.confirmPassword = "Passwords must match.";
    }

    if (!termsAccepted) {
      nextErrors.termsAccepted = "You must accept the Terms of Service.";
    }

    if (!medicalAcknowledged) {
      nextErrors.medicalAcknowledged = "You must acknowledge the clinical-use disclaimer.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      event.preventDefault();
    }
  }

  return (
    <div className="animate-fade-in-up">
      <AuthTabs />

      <div className={styles.headerBlock}>
        <p className={styles.kicker}>Launch your workspace</p>
        <h1 className={styles.title}>Create your account</h1>
        <p className={styles.subtitle}>Open a secure GenoNexus workspace for uploads, reports, and governed access.</p>
      </div>

      <div className={styles.tagRow}>
        {REGISTER_TAGS.map((item) => (
          <span key={item} className={styles.tag}>
            {item}
          </span>
        ))}
      </div>

      <form className={styles.form} action="/api/auth/register" method="post" onSubmit={handleSubmit} noValidate>
        <div className={styles.statusStack}>
          <StatusMessage error={socialError ?? error} status={status} />
        </div>

        <div className={styles.noticeCard}>
          <p className={styles.noticeTitle}>What happens next</p>
          <div className={styles.noticeSteps}>
            <span className={styles.noticeStep}>1. Set up your account details</span>
            <span className={styles.noticeStep}>2. Confirm ownership with a verification email</span>
            <span className={styles.noticeStep}>3. Enter the dashboard immediately after signup</span>
          </div>
        </div>

        <div className={styles.socialGrid}>
          <GoogleButton onError={setSocialError} />
          <GithubButton />
        </div>

        <div className={styles.divider}>
          <span>Or continue with email</span>
        </div>

        <div className={styles.sectionStack}>
          <SectionCard
            title="Identity"
            copy="Use the name and email address that should own this workspace and receive verification messages."
          >
            <div className={styles.row}>
              <FieldShell id="register-fullName" label="Full name" error={errors.fullName}>
                <input
                  className={`${styles.input} ${errors.fullName ? styles.inputError : ""}`}
                  id="register-fullName"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  aria-invalid={Boolean(errors.fullName)}
                  aria-describedby={errors.fullName ? "register-fullName-error" : undefined}
                  required
                />
              </FieldShell>

              <FieldShell id="register-email" label="Email address" error={errors.email}>
                <input
                  className={`${styles.input} ${errors.email ? styles.inputError : ""}`}
                  id="register-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? "register-email-error" : undefined}
                  required
                />
              </FieldShell>
            </div>
          </SectionCard>

          <SectionCard
            title="Workspace profile"
            copy="Pick the account category that best fits how you will use GenoNexus so the workspace can be tailored correctly."
          >
            <FieldShell
              id="register-accountCategory"
              label="Account category"
              error={errors.accountCategory}
              helper="Choose the role that best matches how you will use GenoNexus."
            >
              <select
                className={`${styles.input} ${errors.accountCategory ? styles.inputError : ""}`}
                id="register-accountCategory"
                name="accountCategory"
                defaultValue=""
                aria-invalid={Boolean(errors.accountCategory)}
                aria-describedby={errors.accountCategory ? "register-accountCategory-error" : undefined}
                required
              >
                <option value="" disabled>
                  Select a category
                </option>
                {ACCOUNT_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {ACCOUNT_CATEGORY_LABELS[category]}
                  </option>
                ))}
              </select>
            </FieldShell>
          </SectionCard>

          <SectionCard
            title="Security"
            copy="Choose a strong password for direct email sign-in. Social sign-in remains available above if you prefer it."
          >
            <FieldShell
              id="register-password"
              label="Create password"
              error={errors.password}
              helper="Use a password you do not reuse elsewhere."
            >
              <div className={styles.passwordControl}>
                <input
                  className={`${styles.input} ${errors.password ? styles.inputError : ""}`}
                  id="register-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  minLength={12}
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? "register-password-error" : undefined}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <PasswordToggle showPassword={showPassword} onToggle={() => setShowPassword((value) => !value)} />
              </div>
              <PasswordStrengthPanel password={password} />
            </FieldShell>

            <FieldShell id="register-confirm-password" label="Confirm password" error={errors.confirmPassword}>
              <div className={styles.passwordControl}>
                <input
                  className={`${styles.input} ${errors.confirmPassword ? styles.inputError : ""}`}
                  id="register-confirm-password"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  aria-invalid={Boolean(errors.confirmPassword)}
                  aria-describedby={errors.confirmPassword ? "register-confirm-password-error" : undefined}
                  required
                />
                <PasswordToggle showPassword={showPassword} onToggle={() => setShowPassword((value) => !value)} />
              </div>
            </FieldShell>
          </SectionCard>

          <SectionCard
            title="Clinical and legal acknowledgement"
            copy="These confirmations are required before a workspace can be provisioned."
          >
            <div className={styles.consentPanel}>
              <p className={styles.consentTitle}>Consent and clinical-use acknowledgement</p>

              <label className={styles.checkbox}>
                <input id="termsAccepted" name="termsAccepted" type="checkbox" value="true" required />
                <span className={styles.checkboxIndicator} />
                <span className={styles.checkboxText}>
                  I agree to the GenoNexus Terms of Service and Privacy Policy.
                </span>
              </label>
              <ErrorText id="termsAccepted-error" message={errors.termsAccepted} />

              <label className={styles.checkbox}>
                <input
                  id="medicalAcknowledged"
                  name="medicalAcknowledged"
                  type="checkbox"
                  value="true"
                  required
                />
                <span className={styles.checkboxIndicator} />
                <span className={styles.checkboxText}>
                  I understand GenoNexus provides decision support and does not replace medical advice.
                </span>
              </label>
              <ErrorText id="medicalAcknowledged-error" message={errors.medicalAcknowledged} />
            </div>
          </SectionCard>
        </div>

        <button className={styles.submitBtn} type="submit">
          Create secure account
        </button>

        <p className={styles.switchLine}>
          Already have an account?{" "}
          <Link className={styles.inlineLink} href="/login">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}

export function SetNewPasswordForm({
  error,
  status,
  token
}: FormMessageProps & { token: string }) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<ErrorMap>({});

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget);
    const passwordValue = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");
    const nextErrors: ErrorMap = {};
    const passwordError = getStrongPasswordError(passwordValue);

    if (passwordError) {
      nextErrors.password = passwordError;
    }

    if (passwordValue !== confirmPassword) {
      nextErrors.confirmPassword = "Passwords must match.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      event.preventDefault();
    }
  }

  return (
    <div className="animate-fade-in-up">
      <div className={styles.headerBlock}>
        <h1 className={styles.title}>Choose a new password</h1>
        <p className={styles.subtitle}>Set a fresh password for your GenoNexus account.</p>
      </div>

      <form className={styles.form} action="/api/auth/reset-password" method="post" onSubmit={handleSubmit} noValidate>
        <StatusMessage error={error} status={status} />
        <input name="token" type="hidden" value={token} />

        <FieldShell
          id="reset-password"
          label="New password"
          error={errors.password}
          helper="Use a new password that is unique to this account."
        >
          <div className={styles.passwordControl}>
            <input
              className={`${styles.input} ${errors.password ? styles.inputError : ""}`}
              id="reset-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              minLength={12}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "reset-password-error" : undefined}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <PasswordToggle showPassword={showPassword} onToggle={() => setShowPassword((value) => !value)} />
          </div>
          <PasswordStrengthPanel password={password} />
        </FieldShell>

        <FieldShell id="reset-confirm-password" label="Confirm new password" error={errors.confirmPassword}>
          <div className={styles.passwordControl}>
            <input
              className={`${styles.input} ${errors.confirmPassword ? styles.inputError : ""}`}
              id="reset-confirm-password"
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              aria-invalid={Boolean(errors.confirmPassword)}
              aria-describedby={errors.confirmPassword ? "reset-confirm-password-error" : undefined}
              required
            />
            <PasswordToggle showPassword={showPassword} onToggle={() => setShowPassword((value) => !value)} />
          </div>
        </FieldShell>

        <button className={styles.submitBtn} type="submit">
          Update password
        </button>
      </form>
    </div>
  );
}

export function ResetPasswordForm({ error, status }: FormMessageProps) {
  const [errors, setErrors] = useState<ErrorMap>({});

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const nextErrors: ErrorMap = {};

    if (!validateEmail(email)) {
      nextErrors.email = "Enter a valid email address.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      event.preventDefault();
    }
  }

  return (
    <div className="animate-fade-in-up">
      <div className={styles.headerBlock}>
        <h1 className={styles.title}>Reset your password</h1>
        <p className={styles.subtitle}>Enter your email and GenoNexus will send reset instructions if the account exists.</p>
      </div>

      <form className={styles.form} action="/api/auth/reset-password" method="post" onSubmit={handleSubmit} noValidate>
        <StatusMessage error={error} status={status} />

        <FieldShell
          id="reset-email"
          label="Email address"
          error={errors.email}
          helper="Responses stay intentionally ambiguous to avoid revealing whether an account exists."
        >
          <input
            className={`${styles.input} ${errors.email ? styles.inputError : ""}`}
            id="reset-email"
            name="email"
            type="email"
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect="off"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "reset-email-error" : undefined}
            required
          />
        </FieldShell>

        <button className={styles.submitBtn} type="submit">
          Send reset link
        </button>

        <p className={styles.switchLine}>
          Remembered it?{" "}
          <Link className={styles.inlineLink} href="/login">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
