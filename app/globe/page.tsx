import { auth0 } from "@/lib/auth0";
import { syncUser } from "@/db/users";
import ImmersiveGlobe from "@/components/immersive-globe";
import TimeOfDayBackground from "@/components/time-of-day-background";

export const metadata = {
  title: "Immersive Globe",
  description: "See the world before it changes.",
};

export default async function GlobePage() {
  const session = await auth0.getSession();

  // Public view — no auth gate. syncUser() inserts a users row, so it is the
  // one per-user side effect here and only runs for a signed-in visitor.
  if (session?.user.email) {
    await syncUser(session.user.sub, session.user.email);
  }

  return (
    <div className="p-4">
      <TimeOfDayBackground />
      <h1 className="mb-3 text-2xl font-semibold">Immersive Globe</h1>
      {/* Subtract your nav shell height here if 4rem isn't right */}
      <div className="h-[calc(100vh-9rem)] w-full">
        <ImmersiveGlobe />
      </div>
    </div>
  );
}
