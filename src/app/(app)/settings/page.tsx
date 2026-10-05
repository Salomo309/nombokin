import { redirect } from "next/navigation";
import { getAuthFromCookies } from "@/lib/auth";
import SettingsClient from "./SettingsClient";

// Gate server: anggota (MEMBER) tidak boleh me-render tab langganan sama sekali.
// API billing sudah digate OWNER/ADMIN; ini mencegah konten terkirim ke client.
export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
  if (params.tab === "langganan") {
    const auth = await getAuthFromCookies();
    if (auth?.role === "MEMBER") {
      redirect("/settings?tab=profil");
    }
  }

  return <SettingsClient />;
}
