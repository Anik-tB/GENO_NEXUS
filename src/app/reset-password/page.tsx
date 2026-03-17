import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/forms";

interface ResetPasswordPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ResetPasswordPage({
  searchParams
}: ResetPasswordPageProps) {
  const params = await searchParams;

  return (
    <AuthShell>
      <ResetPasswordForm
        error={getSingleParam(params.error)}
        status={getSingleParam(params.status)}
      />
    </AuthShell>
  );
}
