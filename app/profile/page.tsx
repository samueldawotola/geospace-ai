import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";
import { syncUser } from "@/db/users";
import { updateProfile } from "@/lib/actions";

export default async function ProfilePage() {
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
      <h1>Your Profile</h1>
      <p>These details help tailor your itineraries.</p>

      <form action={updateProfile}>
        <p>
          <label>Name<br />
            <input name="display_name" defaultValue={dbUser.displayName ?? ""} />
          </label>
        </p>
        <p>
          <label>Date of birth<br />
            <input type="date" name="date_of_birth" defaultValue={dbUser.dateOfBirth ?? ""} />
          </label>
        </p>
        <p>
          <label>Nationality<br />
            <input name="nationality" defaultValue={dbUser.nationality ?? ""} />
          </label>
        </p>
        <p>
          <label>Travel style<br />
            <select name="travel_style" defaultValue={dbUser.travelStyle ?? ""}>
              <option value="">—</option>
              <option value="resort">Resort</option>
              <option value="exploring">Exploring</option>
              <option value="tours">Tours</option>
            </select>
          </label>
        </p>
        <p>
          <label>Fitness<br />
            <select name="fitness" defaultValue={dbUser.fitness ?? ""}>
              <option value="">—</option>
              <option value="low">Low</option>
              <option value="moderate">Moderate</option>
              <option value="high">High</option>
            </select>
          </label>
        </p>
        <p>
          <label>Budget<br />
            <select name="budget" defaultValue={dbUser.budget ?? ""}>
              <option value="">—</option>
              <option value="budget">Budget</option>
              <option value="mid-range">Mid-range</option>
              <option value="luxury">Luxury</option>
            </select>
          </label>
        </p>
        <p>
          <label>Accessibility needs<br />
            <input name="accessibility" defaultValue={dbUser.accessibility ?? ""} />
          </label>
        </p>
        <p>
          <label>Family / pets<br />
            <input name="family_pets" defaultValue={dbUser.familyPets ?? ""} />
          </label>
        </p>
        <p>
          <label>
            <input type="checkbox" name="has_passport" defaultChecked={dbUser.hasPassport ?? false} />
            {" "}I have a valid passport
          </label>
        </p>
        <button type="submit">Save profile</button>
      </form>
    </div>
  );
}