import AdminNav from "@/components/AdminNav";
import TeamManager from "@/components/TeamManager";
import { MIN_ADMIN_PASSWORD_LENGTH, requireAdminPage } from "@/lib/admin";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminTeamPage() {
  const session = await requireAdminPage({ ownerOnly: true });
  const admins = await prisma.adminUser.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      username: true,
      createdBy: true,
      createdAt: true,
      _count: { select: { sessions: { where: { expiresAt: { gt: new Date() } } } } },
    },
  });

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <AdminNav session={session} current="team" />
      <h1 className="text-2xl font-bold text-ink">Admin team</h1>
      <p className="mb-6 mt-1 text-sm text-muted">
        Everyone here can moderate, delete posts and export data. Only you (the owner) can add or
        remove admins. Every admin action is recorded in the audit log under their username.
      </p>
      <TeamManager
        minPasswordLength={MIN_ADMIN_PASSWORD_LENGTH}
        admins={admins.map((admin) => ({
          id: admin.id,
          username: admin.username,
          createdBy: admin.createdBy,
          createdAt: admin.createdAt.toISOString(),
          activeSessions: admin._count.sessions,
        }))}
      />
    </div>
  );
}
