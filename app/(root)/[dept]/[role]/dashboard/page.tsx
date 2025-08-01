import { notFound } from 'next/navigation';

interface DashboardPageProps {
  params: {
    dept: string;
    role: string;
  };
}

const VALID_DEPTS = ['hs', 'cse', 'csm', 'csd', 'ece'];
const VALID_ROLES = ['hod', 'dean', 'director', 'tpo', 'student', 'mentor'];

export default function DashboardPage({ params }: DashboardPageProps) {
  const { dept, role } = params;

  if (!VALID_DEPTS.includes(dept.toLowerCase()) || !VALID_ROLES.includes(role.toLowerCase())) {
    notFound();
  }

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mt-4">Welcome to the dashboard.</p>
      <div className="mt-6 p-4 border rounded-lg bg-secondary/50">
        <p><strong>Department:</strong> {dept.toUpperCase()}</p>
        <p><strong>Role:</strong> {role.charAt(0).toUpperCase() + role.slice(1)}</p>
      </div>
    </main>
  );
}
