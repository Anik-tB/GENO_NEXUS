"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
    { label: "Weak", color: "var(--risk-high)", width: "25%", bgColor: "rgba(239, 68, 68, 0.2)" },
    { label: "Fair", color: "var(--risk-moderate)", width: "50%", bgColor: "rgba(245, 158, 11, 0.2)" },
    { label: "Good", color: "#0ea5e9", width: "75%", bgColor: "rgba(14, 165, 233, 0.2)" },
    { label: "Strong", color: "var(--risk-low)", width: "100%", bgColor: "rgba(16, 185, 129, 0.2)" }
  ];

  return levels[Math.max(score - 1, 0)];
}

function validateEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function ErrorText({ message }: { message?: string }) {
  return message ? <p className={styles.fieldError}>{message}</p> : null;
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
    return <div className={styles.errorBanner}>Invalid email or password.</div>;
  }
  if (error === "email_exists") {
    return <div className={styles.errorBanner}>An account with this email already exists.</div>;
  }
  if (error === "validation") {
    return <div className={styles.errorBanner}>Please correct the highlighted form details and try again.</div>;
  }
  if (error === "service_unavailable") {
    return (
      <div className={styles.errorBanner}>
        The authentication service is currently unavailable. Check your PostgreSQL connection and try again.
      </div>
    );
  }
  if (status === "sent") {
    return (
      <div className={styles.statusBanner}>
        If an account exists for that email, a reset link will be sent shortly.
      </div>
    );
  }
  if (status === "signed_out") {
    return <div className={styles.statusBanner}>You have been signed out.</div>;
  }
  if (status === "session_required") {
    return <div className={styles.statusBanner}>Please sign in to access your dashboard.</div>;
  }

  return fallback ? <>{fallback}</> : null;
}

interface FormMessageProps {
  error?: string;
  status?: string;
}

/* =========================================
   AUTH TABS UI
   ========================================= */
function AuthTabs() {
  const pathname = usePathname();
  const isLogin = pathname === "/login";
  
  return (
    <div className={styles.tabContainer}>
      <Link href="/login" className={`${styles.tab} ${isLogin ? styles.tabActive : ""}`}>
        Login
      </Link>
      <Link href="/register" className={`${styles.tab} ${!isLogin ? styles.tabActive : ""}`}>
        Register
      </Link>
    </div>
  );
}

/* =========================================
   LOGIN FORM
   ========================================= */
export function LoginForm({
  attempts,
  error,
  status
}: {
  attempts: number;
} & FormMessageProps) {
  const [errors, setErrors] = useState<ErrorMap>({});
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="animate-fade-in-up">
      <AuthTabs />
      
      <div className={styles.headerBlock}>
        <h1 className={styles.title}>Sign in with confidence</h1>
        <p className={styles.subtitle}>Access your secure GenoNexus workspace and continue your medication safety analysis.</p>
      </div>

      <form className={styles.form} action="/api/auth/login" method="post" onSubmit={handleSubmit}>
        <StatusMessage error={error} status={status} />

        <div className={styles.fieldWrapper}>
          <svg className={styles.inputIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
            <polyline points="22,6 12,13 2,6"></polyline>
          </svg>
          <input
            className={`${styles.floatInput} ${styles.hasIcon}`}
            id="login-email"
            name="email"
            type="email"
            placeholder=" "
            autoComplete="email"
            required
          />
          <label className={`${styles.floatingLabel} ${styles.hasIconLabel}`} htmlFor="login-email">
            Email Address
          </label>
          <ErrorText message={errors.email} />
        </div>

        <div className={styles.fieldWrapper}>
          <svg className={styles.inputIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          <input
            className={`${styles.floatInput} ${styles.hasIcon}`}
            id="login-password"
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder=" "
            autoComplete="current-password"
            required
          />
          <label className={`${styles.floatingLabel} ${styles.hasIconLabel}`} htmlFor="login-password">
            Password
          </label>
          
          <button 
            type="button" 
            className={styles.eyeIconBtn} 
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            )}
          </button>
          <ErrorText message={errors.password} />
        </div>

        <div className={styles.metaRow}>
          <label className={styles.checkbox}>
            <input name="remember" type="checkbox" value="true" />
            <div className={styles.checkboxIndicator}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <span>Remember this device</span>
          </label>
          <Link className={styles.link} href="/reset-password">
            Forgot password?
          </Link>
        </div>

        {attempts >= 3 ? (
          <div className={styles.statusBanner}>Having trouble? Reset your password and try again.</div>
        ) : null}

        <button className={styles.submitBtn} type="submit">
          Sign In to GenoNexus
        </button>
        
        <p className={styles.switchLine}>
          Don&apos;t have an account? <Link className={styles.link} href="/register">Create account</Link>
        </p>

        <div className={styles.separator}>or continue with</div>

        <div className={styles.socialGrid}>
          <button className={styles.socialBtn} type="button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#3b82f6"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34d399"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#fbbf24"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#f87171"/>
            </svg>
            Google
          </button>
          <button className={styles.socialBtn} type="button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            GitHub
          </button>
        </div>
      </form>
    </div>
  );
}

/* =========================================
   REGISTER FORM
   ========================================= */
export function RegisterForm({ error, status }: FormMessageProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<ErrorMap>({});

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget);
    const nextErrors: ErrorMap = {};
    const fullName = String(formData.get("fullName") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const passwordValue = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");
    const termsAccepted = formData.get("termsAccepted");

    if (fullName.split(" ").length < 2) nextErrors.fullName = "Please enter your first and last name.";
    if (!validateEmail(email)) nextErrors.email = "Enter a valid email address.";
    if (passwordValue.length < 12) {
      nextErrors.password = "Use at least 12 characters.";
    }
    if (passwordValue !== confirmPassword) {
      nextErrors.confirmPassword = "Passwords must match.";
    }
    if (!termsAccepted) nextErrors.termsAccepted = "You must accept the Terms of Service.";

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      event.preventDefault();
    }
  }

  return (
    <div className="animate-fade-in-up">
      <AuthTabs />

      <div className={styles.headerBlock}>
        <h1 className={styles.title}>Create your GenoNexus account</h1>
        <p className={styles.subtitle}>Join the platform and unlock personalized medication safety insights from your DNA data.</p>
      </div>

      <form className={styles.form} action="/api/auth/register" method="post" onSubmit={handleSubmit}>
        <StatusMessage error={error} status={status} />

        <div className={styles.fieldWrapper}>
          <svg className={styles.inputIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          <input
            className={`${styles.floatInput} ${styles.hasIcon}`}
            id="register-fullName"
            name="fullName"
            type="text"
            autoComplete="name"
            placeholder=" "
            required
          />
          <label className={`${styles.floatingLabel} ${styles.hasIconLabel}`} htmlFor="register-fullName">
            Full Name
          </label>
          <ErrorText message={errors.fullName} />
        </div>

        <div className={styles.row}>
          <div className={styles.fieldWrapper}>
            <svg className={styles.inputIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
            <input
              className={`${styles.floatInput} ${styles.hasIcon}`}
              id="register-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder=" "
              required
            />
            <label className={`${styles.floatingLabel} ${styles.hasIconLabel}`} htmlFor="register-email">
              Email Address
            </label>
            <ErrorText message={errors.email} />
          </div>

          <div className={styles.selectWrapper}>
             <svg className={styles.inputIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
             </svg>
             <select id="register-role" name="role" className={`${styles.floatInput} ${styles.hasIcon} ${styles.select}`} required defaultValue="" aria-label="Role">
                <option value="" disabled hidden></option>
                <option value="patient">Patient</option>
                <option value="doctor">Doctor</option>
                <option value="researcher">Researcher</option>
             </select>
             <label className={`${styles.floatingLabel} ${styles.hasIconLabel} ${styles.selectLabel}`} htmlFor="register-role">
                Select Role
             </label>
          </div>
        </div>

        <div className={styles.fieldWrapper}>
          <svg className={styles.inputIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          <input
            className={`${styles.floatInput} ${styles.hasIcon}`}
            id="register-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder=" "
            minLength={12}
            required
            onChange={(event) => setPassword(event.target.value)}
          />
          <label className={`${styles.floatingLabel} ${styles.hasIconLabel}`} htmlFor="register-password">
            Create password
          </label>
          <button 
            type="button" 
            className={styles.eyeIconBtn} 
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            )}
          </button>
          
          <ErrorText message={errors.password} />
          
          <div className={styles.strengthWrap}>
            <div className={styles.strengthTrack} style={{ background: strength.bgColor }}>
              <div
                className={styles.strengthFill}
                style={{
                  width: password ? strength.width : "0%",
                  backgroundColor: strength.color,
                  boxShadow: `0 0 10px ${strength.color}`
                }}
              />
            </div>
            <div className={styles.strengthMeta}>
              <span>{password ? strength.label : "Password strength"}</span>
              <span>12+ chars, upper/lower, number</span>
            </div>
          </div>
        </div>

        <div className={styles.fieldWrapper}>
          <svg className={styles.inputIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
             <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
          </svg>
          <input
            className={`${styles.floatInput} ${styles.hasIcon}`}
            id="register-confirm-password"
            name="confirmPassword"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder=" "
            required
          />
          <label className={`${styles.floatingLabel} ${styles.hasIconLabel}`} htmlFor="register-confirm-password">
            Confirm password
          </label>
          <ErrorText message={errors.confirmPassword} />
        </div>

        <label className={styles.checkbox}>
          <input id="termsAccepted" name="termsAccepted" type="checkbox" value="true" required />
          <div className={styles.checkboxIndicator}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
          <span>
            I agree to the Terms of Service and Privacy Policy for GenoNexus.
            <ErrorText message={errors.termsAccepted} />
          </span>
        </label>

        <button className={styles.submitBtn} type="submit">
          Create Account
        </button>

        <p className={styles.switchLine}>
          Already have an account? <Link className={styles.link} href="/login">Sign in here</Link>
        </p>
      </form>
    </div>
  );
}

/* =========================================
   RESET PASSWORD FORM
   ========================================= */
export function ResetPasswordForm({ error, status }: FormMessageProps) {
  const [errors, setErrors] = useState<ErrorMap>({});

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
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
        <p className={styles.subtitle}>Enter your email and, if the account exists, GenoNexus will send secure reset instructions.</p>
      </div>

      <form className={styles.form} action="/api/auth/reset-password" method="post" onSubmit={handleSubmit}>
        <StatusMessage error={error} status={status} />

        <div className={styles.fieldWrapper}>
          <svg className={styles.inputIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
            <polyline points="22,6 12,13 2,6"></polyline>
          </svg>
          <input
            className={`${styles.floatInput} ${styles.hasIcon}`}
            id="reset-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder=" "
            required
          />
          <label className={`${styles.floatingLabel} ${styles.hasIconLabel}`} htmlFor="reset-email">
            Email Address
          </label>
          <ErrorText message={errors.email} />
        </div>

        <button className={styles.submitBtn} type="submit">
          Send Reset Link
        </button>

        <p className={styles.switchLine}>
          Remember your password? <Link className={styles.link} href="/login">Sign in here</Link>
        </p>

        <div className={styles.separator}>Security Note</div>
        <p className={styles.switchLine} style={{ fontSize: "0.85rem" }}>
          Password resets always use an ambiguous confirmation message to avoid exposing whether an account exists.
        </p>
      </form>
    </div>
  );
}
