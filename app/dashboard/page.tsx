import { UserButton } from "@clerk/nextjs";

export default function DashboardPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gray-100 dark:bg-gray-800 shadow-sm p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>
      <main className="flex-grow p-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-xl mb-4">Welcome to your dashboard!</h2>
          <p>This is a protected page.</p>
        </div>
      </main>
    </div>
  );
}
