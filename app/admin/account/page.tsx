import AdminNav from "@/components/AdminNav";
import ChangePasswordForm from "@/components/ChangePasswordForm";
import { MIN_ADMIN_PASSWORD_LENGTH, requireAdminPage } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function AdminAccountPage() {
  const session = await requireAdminPage();

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <AdminNav session={session} current="account" />
      <h1 className="text-2xl font-bold text-ink">My account</h1>
      {session.isOwner ? (
        <div className="mt-4 max-w-xl rounded-2xl border border-border-subtle bg-card p-5 text-sm leading-6 text-muted shadow-card">
          <p>
            You&apos;re signed in as the <span className="font-semibold text-ink">owner</span>. The owner
            password is the <code className="rounded bg-card-muted px-1 text-ink">ADMIN_PASSWORD</code>{" "}
            environment variable in Vercel. To change it, update that variable and redeploy — every
            owner session made with the old password is signed out automatically.
          </p>
        </div>
      ) : (
        <>
          <p className="mb-5 mt-1 text-sm text-muted">
            Signed in as <span className="font-semibold text-ink">{session.actor}</span>. Changing your
            password signs you out everywhere else.
          </p>
          <ChangePasswordForm minLength={MIN_ADMIN_PASSWORD_LENGTH} />
        </>
      )}
    </div>
  );
}
