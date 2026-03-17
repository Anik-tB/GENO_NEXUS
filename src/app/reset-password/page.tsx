import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm, SetNewPasswordForm } from "@/components/auth/forms";

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
  const token = getSingleParam(params.token);

  return (
    <AuthShell>
      {token ? (
        <SetNewPasswordForm
          token={token}
          error={getSingleParam(params.error)}
          status={getSingleParam(params.status)}
        />
      ) : (
        <ResetPasswordForm
          error={getSingleParam(params.error)}
          status={getSingleParam(params.status)}
        />
      )}
    </AuthShell>
  );
}
