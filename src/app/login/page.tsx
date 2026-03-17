import { cookies } from "next/headers";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/forms";

interface LoginPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const cookieStore = await cookies();
  const params = await searchParams;
  const attempts = Number(cookieStore.get("geno_login_attempts")?.value ?? "0");

  return (
    <AuthShell
      title="Sign in with confidence"
      description="Access your secure GenoNexus workspace, review medication safety results, and continue where you left off."
      footer={
        <>
          Need access for a new account? <a href="/register">Create one here</a>.
        </>
      }
    >
      <LoginForm
        attempts={attempts}
        error={getSingleParam(params.error)}
        status={getSingleParam(params.status)}
      />
    </AuthShell>
  );
}
