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
    <AuthShell
      title="Reset your password"
      description="Enter your email and, if the account exists, GenoNexus will send secure reset instructions."
      footer={
        <>
          Password resets always use an ambiguous confirmation message to avoid exposing whether an account exists.
        </>
      }
    >
      <ResetPasswordForm
        error={getSingleParam(params.error)}
        status={getSingleParam(params.status)}
      />
    </AuthShell>
  );
}
