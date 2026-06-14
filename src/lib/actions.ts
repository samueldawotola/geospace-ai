"use server";

import { auth0 } from "@/lib/auth0";
import { generateTripContent } from "@/lib/llm";
import { syncUser } from "@/db/users";
import { db } from "@/index";
import { trips } from "@/db/schema";

export async function generateTrip(destination: string) {
  
  const session = await auth0.getSession();
  if (!session) {
    throw new Error("Not authenticated");
  }

  if (!session.user.email) {
    throw new Error("No email is associated with this account");
  }
  
  if (!destination || destination.trim().length === 0) {
    throw new Error("Destination is required");
  }

  const dbUser = await syncUser(session.user.sub, session.user.email);

  const content = await generateTripContent(destination);

  const [savedTrip] = await db
    .insert(trips)
    .values({
      userId: dbUser.id,
      destination: destination.trim(),
      content,
    })
    .returning();

  return savedTrip;
}