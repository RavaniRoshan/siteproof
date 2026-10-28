import { redirect } from "next/navigation";
import Link from "next/link";
import { Button, Card, Input, Label } from "@/components/ui";
import { loginSchema } from "@/lib/validation";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

async function loginAction(formData: FormData) {
  "use server";
  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) redirect("/login?error=invalid");
  const { email, password } = parsed.data;
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user || !(await verifyPassword(password, user.passwordHash))) redirect("/login?error=invalid");
  await createSession({ userId: user.id, email: user.email });
  redirect("/dashboard");
}

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md p-4">
      <Card>
        <h1 className="mb-4 text-xl font-semibold">Log in to SiteProof</h1>
        <form action={loginAction} className="space-y-3">
          <div><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" required /></div>
          <div><Label htmlFor="password">Password</Label><Input id="password" name="password" type="password" required /></div>
          <Button type="submit" className="w-full">Log in</Button>
        </form>
        <p className="mt-3 text-sm">New here? <Link href="/register" className="text-blue-600">Create account</Link></p>
      </Card>
    </div>
  );
}
