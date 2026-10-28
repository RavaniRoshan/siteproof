import { redirect } from "next/navigation";
import Link from "next/link";
export const dynamic = "force-dynamic";
import { getAuthContext } from "@/lib/auth/context";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  return (
    <div className="min-h-screen">
      <header className="border-b bg-white">
        <nav className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-4 py-3 text-sm">
          <Link href="/dashboard" className="font-semibold text-blue-600">SiteProof</Link>
          <Link href="/projects">Projects</Link>
          <Link href="/variations">Variations</Link>
          <Link href="/packets">Packets</Link>
          <Link href="/settings">Settings</Link>
          <form action="/api/logout" method="post" className="ml-auto">
            <button className="text-slate-600 hover:underline" type="submit">Log out</button>
          </form>
        </nav>
      </header>
      <main className="mx-auto max-w-5xl p-4">{children}</main>
    </div>
  );
}
