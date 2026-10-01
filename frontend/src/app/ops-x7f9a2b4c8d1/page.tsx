import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

async function getOverview() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  
  if (!session) {
    redirect('/ops-x7f9a2b4c8d1/login');
  }

  const res = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/+$/, '')}/internal-ops/api/overview`, {
    headers: {
      'Cookie': `admin_session=${session.value}`
    },
    cache: 'no-store'
  });

  if (!res.ok) {
    if (res.status === 401) redirect('/ops-x7f9a2b4c8d1/login');
    throw new Error('Failed to fetch data');
  }

  return res.json();
}

export default async function AdminDashboard() {
  const data = await getOverview();

  return (
    <div>
      <h1 className="text-3xl font-bold text-navy-deep mb-8">Hello, {data.user.email}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">
          <p className="text-sm font-medium text-text-muted mb-1">Total Accounts</p>
          <p className="text-3xl font-bold text-navy-deep">{data.totalAccounts}</p>
        </div>
        
        <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">
          <p className="text-sm font-medium text-text-muted mb-1">Active Subscriptions</p>
          <p className="text-3xl font-bold text-sea">{data.activeSubscriptions}</p>
        </div>
        
        <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">
          <p className="text-sm font-medium text-text-muted mb-1">Trialing Accounts</p>
          <p className="text-3xl font-bold text-sea-bright">{data.trialingSubscriptions}</p>
        </div>
      </div>

      <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden p-6">
         <h2 className="text-lg font-semibold text-navy-deep mb-4">Quick Actions</h2>
         <p className="text-sm text-text-muted">Navigate using the top menu to view accounts, billing, or audit logs.</p>
      </div>
    </div>
  );
}
