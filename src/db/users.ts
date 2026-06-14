import { db } from "@/index";
import { users, trips } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

// Takes the Auth0 user info, ensures a matching row exists in our DB,
// and returns that row. Safe to call on every login.
export async function syncUser(auth0Sub: string, email: string) {
  // 1. Look for an existing row with this Auth0 sub
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.auth0Sub, auth0Sub))
    .limit(1);

  // 2. If found, return it — nothing to create
  if (existing.length > 0) {
    return existing[0];
  }

  // 3. Not found → create the row, return the newly created one
  const [created] = await db
    .insert(users)
    .values({ auth0Sub, email })
    .returning();

  return created;
}

export async function getUserTrips(userId: string) {
  return await db
    .select()
    .from(trips)
    .where(eq(trips.userId, userId))
    .orderBy(desc(trips.createdAt));
}