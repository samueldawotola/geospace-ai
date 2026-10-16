import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";
import { syncUser } from "@/db/users";
import { updateProfile } from "@/lib/actions";
import TimeOfDayBackground from "@/components/time-of-day-background";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

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
    <div className="mx-auto max-w-2xl space-y-6">
      <TimeOfDayBackground />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Your profile</h1>
        <p className="text-muted-foreground mt-1">
          The more we know, the sharper every itinerary gets.
        </p>
      </div>

      <Card className="tod-card border ring-0 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-base">Travel preferences</CardTitle>
          <CardDescription>These details tune what we generate for you.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateProfile} className="grid gap-5 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="display_name">Name</Label>
              <Input id="display_name" name="display_name" defaultValue={dbUser.displayName ?? ""} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="date_of_birth">Date of birth</Label>
              <Input id="date_of_birth" type="date" name="date_of_birth" defaultValue={dbUser.dateOfBirth ?? ""} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="nationality">Nationality</Label>
              <Input id="nationality" name="nationality" defaultValue={dbUser.nationality ?? ""} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="travel_style">Travel style</Label>
              <Select name="travel_style" defaultValue={dbUser.travelStyle ?? undefined}>
                <SelectTrigger id="travel_style">
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="resort">Resort</SelectItem>
                  <SelectItem value="exploring">Exploring</SelectItem>
                  <SelectItem value="tours">Tours</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="fitness">Fitness</Label>
              <Select name="fitness" defaultValue={dbUser.fitness ?? undefined}>
                <SelectTrigger id="fitness">
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="budget">Budget</Label>
              <Select name="budget" defaultValue={dbUser.budget ?? undefined}>
                <SelectTrigger id="budget">
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="budget">Budget</SelectItem>
                  <SelectItem value="mid-range">Mid-range</SelectItem>
                  <SelectItem value="luxury">Luxury</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="accessibility">Accessibility needs</Label>
              <Textarea id="accessibility" name="accessibility" rows={2} defaultValue={dbUser.accessibility ?? ""} />
            </div>

            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="family_pets">Family / pets</Label>
              <Textarea id="family_pets" name="family_pets" rows={2} defaultValue={dbUser.familyPets ?? ""} />
            </div>

            <div className="flex items-center gap-2 sm:col-span-2">
              <Checkbox id="has_passport" name="has_passport" defaultChecked={dbUser.hasPassport ?? false} />
              <Label htmlFor="has_passport" className="font-normal">I have a valid passport</Label>
            </div>

            {/* Same time-of-day gradient as the dashboard's Generate button. */}
            <Button
              type="submit"
              className="sm:col-span-2 justify-self-start h-10 rounded-xl border border-white/15 px-5 font-semibold text-white bg-[linear-gradient(45deg,var(--tod-btn-from),var(--tod-btn-to))] hover:brightness-110"
            >
              Save profile
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}