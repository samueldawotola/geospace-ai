"use server";

import { auth0 } from "@/lib/auth0";
import { generateTripContent } from "@/lib/llm";
import { syncUser } from "@/db/users";
import { db } from "@/index";
import { trips } from "@/db/schema";
import { revalidatePath } from "next/cache";

export async function generateTrip(destination: string) {
  
  const session = await auth0.getSession();
  if (!session) {
    throw new Error("Not authenticated");
  }
  if (!session.user.email) {
    throw new Error("No email associated with this account");
  }

  if (!destination || destination.trim().length === 0) {
    return { error: "Please enter a destination." };
  }

  try {
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

    revalidatePath("/dashboard");
    return { trip: savedTrip };
  } catch (err) {
    
    console.error("generateTrip failed:", err);
    return { error: "Couldn't generate your trip right now. Please try again." };
  }
}