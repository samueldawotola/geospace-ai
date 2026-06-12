import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";
import { syncUser } from "@/db/users";

export default async function Dashboard() {
  const session = await auth0.getSession();

  if (!session) {
    redirect("/auth/login");
  }
  
  if (!session.user.email) {
    throw new Error("No email is associated with this account");
  }

  const dbUser = await syncUser(session.user.sub, session.user.email);

  return (
    <div>
      <h1>Protected Dashboard</h1>
      <p>Welcome, {session.user.email}</p>
      <p>Your database ID: {dbUser.id}</p>
    </div>
  );
}