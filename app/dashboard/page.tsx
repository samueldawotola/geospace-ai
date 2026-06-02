import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";

export default async function Dashboard() {
  const session = await auth0.getSession();

  if (!session) {
    redirect("/auth/login");
  }

  return (
    <div>
      <h1>Dashboard (protected)</h1>
      <p>Logged in as {session.user.email}</p>
    </div>
  );
}