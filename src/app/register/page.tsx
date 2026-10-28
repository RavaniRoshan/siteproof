import { redirect } from "next/navigation";
import Link from "next/link";
import { Button, Card, Input, Label, Alert } from "@/components/ui";
import { registerSchema } from "@/lib/validation";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { ensureOrganizationForUser } from "@/lib/auth/context";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";

async function registerAction(formData: FormData) {
  "use server";
  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    name: formData.get("name") || undefined,
    organizationName: formData.get("organizationName"),
  });
  if (!parsed.success) {
    redirect("/register?error=invalid");
  }
  const { email, password, name, organizationName } = parsed.data;
  const existing = await db.query.users.findFirst({ where: (u, { eq }) => eq(u.email, email) });
  if (existing) redirect("/register?error=exists");
  const id = crypto.randomUUID();
  await db.insert(users).values({ id, email, passwordHash: await hashPassword(password), name: name ?? null });
  const orgId = await ensureOrganizationForUser(id, organizationName);
  await createSession({ userId: id, email });
  redirect("/dashboard");
}

export default function RegisterPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  return (
    <div className="mx-auto max-w-md p-4">
      <Card>
        <h1 className="mb-4 text-xl font-semibold">Create your SiteProof account</h1>
        <form action={registerAction} className="space-y-3">
          <div><Label htmlFor="name">Your name</Label><Input id="name" name="name" /></div>
          <div><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" required /></div>
          <div><Label htmlFor="password">Password</Label><Input id="password" name="password" type="password" required minLength={8} /></div>
          <div><Label htmlFor="organizationName">Organization name</Label><Input id="organizationName" name="organizationName" required /></div>
          <Button type="submit" className="w-full">Create account</Button>
        </form>
        <p className="mt-3 text-sm">Already have an account? <Link href="/login" className="text-blue-600">Log in</Link></p>
      </Card>
    </div>
  );
}
