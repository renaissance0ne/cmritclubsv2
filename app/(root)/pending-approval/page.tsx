import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getUserProfile } from '@/lib/actions/user.actions';
import { StatusBadge } from '@/components/ui/status-badge';

export default async function PendingApprovalPage() {
  const user = await currentUser();

  if (!user) {
    redirect('/sign-in');
  }

  const result = await getUserProfile(user.id);

  if (!result.success || !result.data) {
    // Handle error or case where profile doesn't exist
    return (
      <main className="mx-auto flex max-w-3xl flex-col justify-center py-20">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-4xl font-bold">Error</h1>
          <p className="text-muted-foreground">
            Could not retrieve your application status. Please try again later.
          </p>
        </div>
      </main>
    );
  }

  const { approval_status } = result.data;

  return (
    <main className="mx-auto flex max-w-3xl flex-col justify-center py-20">
      <div className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-4xl font-bold">Application Status</h1>
        <StatusBadge status={approval_status as 'pending' | 'approved' | 'rejected'} />
        <p className="text-muted-foreground">
          Your application to become a club lead is currently{' '}
          <strong>{approval_status}</strong>.
        </p>
        {approval_status === 'pending' && (
          <p className="text-muted-foreground">
            You will be notified once a decision has been made by the officials.
          </p>
        )}
        {approval_status === 'approved' && (
          <p className="text-muted-foreground">
            Congratulations! Your application has been approved. You now have full access to the platform.
          </p>
        )}
        {approval_status === 'rejected' && (
          <p className="text-muted-foreground">
            We regret to inform you that your application has been rejected.
          </p>
        )}
      </div>
    </main>
  );
}
