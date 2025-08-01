import { OnboardingForm } from '@/components/forms/onboarding-form';
import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function OnboardingPage() {
  const user = await currentUser();

  if (!user) {
    redirect('/sign-in');
  }

  // Check if the user has already completed onboarding
  // and redirect them if they have.

  return (
    <main className="mx-auto flex max-w-3xl flex-col justify-center py-20">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-4xl font-bold">Club Leader Onboarding</h1>
        <p className="text-muted-foreground">
          Please fill out the form below to complete your onboarding.
        </p>
      </div>
      <div className="mt-8 w-full">
        <OnboardingForm />
      </div>
    </main>
  );
}
