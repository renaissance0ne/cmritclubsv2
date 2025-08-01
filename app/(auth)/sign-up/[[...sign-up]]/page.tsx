'use client'

import { SignUp } from '@clerk/nextjs';
import Image from 'next/image';
import React, { useState, ChangeEvent } from 'react';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');

  const handleUsernameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row w-full">
      {/* Sign-up component - Full width on mobile, half width on desktop */}
      <div className="w-full md:w-1/2 flex flex-col items-center justify-center bg-black p-4 md:p-8">
        
        <SignUp fallbackRedirectUrl="/onboarding" />
        {/* Added text below the component */}
        <div className="mt-6 text-center max-w-md">
          <p className="text-gray-400 text-xs">
            By creating an account, you agree to our <a href="/terms" className="text-purple-400 hover:text-purple-300">Terms of Service</a> and <a href="/privacy" className="text-purple-400 hover:text-purple-300">Privacy Policy</a>.
          </p>
          <p className="text-gray-500 text-xs mt-4">
            © 2025 CMritClub. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right half - Image only on medium screens and larger */}
      <div className="hidden md:block md:w-1/2 relative">
        <Image 
          src="/img1.svg" 
          alt="Sign-up background" 
          fill 
          className="object-cover" 
          priority
        />
      </div>
    </div>
  );
}