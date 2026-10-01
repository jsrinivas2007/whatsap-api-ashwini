import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import Link from 'next/link';

async function getAccounts() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  
  if (!session) {
    redirect('/ops-x7f9a2b4c8d1/login');
  }

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/internal-ops/api/accounts`, {
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

export default async function AccountsList() {
  const accounts = await getAccounts();

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy-deep mb-6">Accounts List</h1>
      
      <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
        <table className="w-full text-left text-sm text-text-muted">
          <thead className="bg-muted border-b border-border">
            <tr>
              <th className="px-6 py-4 font-semibold text-navy-deep">Account Name</th>
              <th className="px-6 py-4 font-semibold text-navy-deep">Created At</th>
              <th className="px-6 py-4 font-semibold text-navy-deep">Plan / Status</th>
              <th className="px-6 py-4 font-semibold text-navy-deep text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((account: any) => {
              const sub = account.subscriptions?.[0];
              return (
                <tr key={account.id} className="border-b border-border hover:bg-muted/50 transition">
                  <td className="px-6 py-4 font-medium text-text-dark">{account.name}</td>
                  <td className="px-6 py-4">{new Date(account.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    {sub ? (
                      <div>
                        <span className="capitalize text-xs font-semibold px-2 py-1 bg-muted rounded-md text-text-dark">{sub.plan_id || 'Plan'}</span>
                        <span className={`ml-2 capitalize text-xs font-semibold px-2 py-1 rounded-md ${sub.status === 'active' ? 'bg-sea-foam/30 text-sea' : 'bg-amber-100 text-amber-700'}`}>{sub.status}</span>
                      </div>
                    ) : 'No Sub'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/ops-x7f9a2b4c8d1/accounts/${account.id}`} className="text-sea hover:text-sea-bright font-medium transition">View Details</Link>
                  </td>
                </tr>
              );
            })}
            {accounts.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-text-muted">No accounts found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
