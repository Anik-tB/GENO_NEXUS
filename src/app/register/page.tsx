import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/forms";

interface RegisterPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = await searchParams;

  return (
    <AuthShell
      title="Create your secure account"
      description="Set up a privacy-first GenoNexus account to store your results, manage future uploads, and keep medication insights in one place."
      footer={
        <>
          By creating an account, you are preparing the secure profile foundation needed for future DNA upload and report workflows.
        </>
      }
    >
      <RegisterForm
        error={getSingleParam(params.error)}
        status={getSingleParam(params.status)}
      />
    </AuthShell>
  );
}
