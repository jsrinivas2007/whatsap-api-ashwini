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

export default async function BillingPage() {
  const accounts = await getAccounts();
  
  // Flatten subscriptions
  let subscriptions: any[] = [];
  accounts.forEach((acc: any) => {
    if (acc.subscriptions && acc.subscriptions.length > 0) {
      acc.subscriptions.forEach((sub: any) => {
        subscriptions.push({ ...sub, account_name: acc.name, account_id: acc.id });
      });
    }
  });

  // Sort by created at descending
  subscriptions.sort((a, b) => new Date(b.created_at || b.current_period_end || b.trial_ends_at).getTime() - new Date(a.created_at || a.current_period_end || a.trial_ends_at).getTime());

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy-deep mb-6">Subscriptions & Billing</h1>
      
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 font-semibold text-slate-900">Account</th>
              <th className="px-6 py-4 font-semibold text-slate-900">Plan</th>
              <th className="px-6 py-4 font-semibold text-slate-900">Status</th>
              <th className="px-6 py-4 font-semibold text-slate-900">Period / Expiry</th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.map((sub: any) => (
              <tr key={sub.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                <td className="px-6 py-4 font-medium text-slate-900">
                  <Link href={`/ops-x7f9a2b4c8d1/accounts/${sub.account_id}`} className="hover:text-sea hover:underline">{sub.account_name}</Link>
                </td>
                <td className="px-6 py-4 capitalize">{sub.plan_id}</td>
                <td className="px-6 py-4">
                  <span className={`capitalize text-xs font-semibold px-2 py-1 rounded ${sub.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{sub.status}</span>
                </td>
                <td className="px-6 py-4">
                  {sub.status === 'trialing' ? 
                    `Ends ${new Date(sub.trial_ends_at).toLocaleDateString()}` : 
                    `Renews ${new Date(sub.current_period_end).toLocaleDateString()}`
                  }
                </td>
              </tr>
            ))}
            {subscriptions.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-500">No subscriptions found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
