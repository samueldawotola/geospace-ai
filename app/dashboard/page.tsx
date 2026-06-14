import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";
import { syncUser } from "@/db/users";
import { generateTrip } from "@/lib/actions";

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

      <form
        action={async (formData: FormData) => {
          "use server";
          const dest = formData.get("destination") as string;
          const saved = await generateTrip(dest);
          console.log("Saved trip:", saved);
        }}
      >
        <input name="destination" placeholder="e.g. Kyoto, Japan" />
        <button type="submit">Generate</button>
      </form>
    </div>
  );
}