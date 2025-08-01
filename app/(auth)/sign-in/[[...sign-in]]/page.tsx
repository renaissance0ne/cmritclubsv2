'use client'

import { SignIn } from '@clerk/nextjs';
import React, { useState, ChangeEvent, ReactElement } from 'react';
import Image from 'next/image';

export default function SignInPage(): ReactElement {
  const [identifier, setIdentifier] = useState<string>('');

  const handleIdentifierChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setIdentifier(e.target.value);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row w-full">
      {/* Sign-in component - Full width on mobile, half width on desktop */}
      <div className="w-full md:w-1/2 flex flex-col items-center justify-center bg-black p-4 md:p-8">
        <SignIn fallbackRedirectUrl="/dashboard" />

        {/* Added text below the component */}
        <div className="mt-6 md:mt-8 text-center max-w-md px-4">
          <p className="text-gray-400 text-sm">
            By signing in, you agree to our <a href="/terms" className="text-purple-400 hover:text-purple-300">Terms of Service</a> and <a href="/privacy" className="text-purple-400 hover:text-purple-300">Privacy Policy</a>.
          </p>
          <p className="text-gray-400 text-sm mt-4">
            CMritClub provides secure access to your data. We use industry-standard encryption to protect your information.
          </p>
          <p className="text-gray-500 text-xs mt-6">
            © 2025 CMritClub. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right half - Full image (hidden on mobile) */}
      <div className="hidden md:block w-1/2 relative">
        <Image 
          src="/img1.svg" 
          alt="Sign-in background" 
          fill 
          className="object-cover" 
          priority
        />
      </div>
    </div>
  );
}