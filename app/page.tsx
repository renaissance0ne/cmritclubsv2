import { AuthButtons } from "@/components/ui/auth-buttons"
import { HeroSection } from "@/components/ui/hero"
import { auth } from "@clerk/nextjs/server"

export default async function Home() {
  const { userId } = await auth()
  const isLoggedIn = !!userId
  
  return (
    <HeroSection
      title="cmritclubs"
      subtitle={{
        regular: "Streamline your college's",
        gradient: " event approvals digitally",
      }}
      description="Replace manual event permission workflows with a transparent, automated system. Connect clubs, mentors, and college officials in one unified platform for seamless event management."
      authButtons={<AuthButtons isLoggedIn={isLoggedIn} />}
      bottomImage={{
        light: "https://www.launchuicomponents.com/app-light.png",
        dark: "https://www.launchuicomponents.com/app-dark.png",
      }}
      gridOptions={{
        angle: 65,
        opacity: 0.4,
        cellSize: 50,
        lightLineColor: "#4a4a4a",
        darkLineColor: "#2a2a2a",
      }}
    />
  )
}