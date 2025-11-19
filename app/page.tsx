import { auth } from "@clerk/nextjs/server";
import LandingPageClient from "@/components/landing/LandingPageClient";

export default async function LandingPage() {
  const { userId, sessionClaims } = await auth();

  let redirectPath = "/sign-up";

  if (userId) {
    const { role, college, department, official_role } = sessionClaims?.publicMetadata as {
      role?: string;
      college?: string;
      department?: string;
      official_role?: string;
    } || {};

    if (role === "Official") {
      if (college && official_role) {
        if (department) {
          redirectPath = `/${college}/hod/${official_role}/dashboard`;
        } else {
          redirectPath = `/${college}/official/${official_role}/dashboard`;
        }
      } else {
        redirectPath = "/dashboard"; // Fallback for officials with incomplete data
      }
    } else {
      redirectPath = "/dashboard"; // Default for club leaders
    }
  }

  return <LandingPageClient redirectPath={redirectPath} />;
}