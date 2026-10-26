import { requireUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { PageHeader } from "@/features/admin/module-pages";
import { PasswordForm, SettingsForm } from "@/features/admin/forms";

export const metadata = { title: "Settings" };
export default async function SettingsPage() {
  const me = await requireUser();
  const s = await getSettings();
  return (
    <div className="space-y-8">
      <PageHeader title="Settings" desc={me.role === "SUPER_ADMIN" ? "Pengaturan situs dan keamanan akun." : "Keamanan akun."} />
      {me.role === "SUPER_ADMIN" && <SettingsForm values={s} />}
      <PasswordForm />
    </div>
  );
}
