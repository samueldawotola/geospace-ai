"use server";

import { auth0 } from "@/lib/auth0";
import { generateTripContent } from "@/lib/llm";

export async function generateTrip(destination: string) {
  

  const session = await auth0.getSession();
  if (!session) {
    throw new Error("Not authenticated");
  }

  
  if (!destination || destination.trim().length === 0) {
    throw new Error("Destination is required");
  }

  
  const content = await generateTripContent(destination);

  return { content };
}