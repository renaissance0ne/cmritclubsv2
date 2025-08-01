'use client'

import { SignOutButton } from "@clerk/nextjs"
import Link from "next/link"
import { Button } from "./button"

interface AuthButtonsProps {
  isLoggedIn: boolean
}

export function AuthButtons({ isLoggedIn }: AuthButtonsProps) {
  return (
    <div className="flex items-center gap-x-3">
      {isLoggedIn ? (
        <SignOutButton>
          <Button variant="outline">Sign Out</Button>
        </SignOutButton>
      ) : (
        <>
          <Link href="/sign-in">
            <Button variant="outline">Sign In</Button>
          </Link>
          <Link href="/sign-up">
            <Button>Sign Up</Button>
          </Link>
        </>
      )}
    </div>
  )
}
