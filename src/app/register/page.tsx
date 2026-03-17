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
    <AuthShell>
      <RegisterForm
        error={getSingleParam(params.error)}
        status={getSingleParam(params.status)}
      />
    </AuthShell>
  );
}
