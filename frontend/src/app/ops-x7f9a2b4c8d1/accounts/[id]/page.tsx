"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AccountDetail({ params }: { params: Promise<{ id: string }> }) {
  const [account, setAccount] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [accountId, setAccountId] = useState('');
  const router = useRouter();

  useEffect(() => {
    params.then(p => {
      setAccountId(p.id);
      fetchAccount(p.id);
    });
  }, [params]);

  const fetchAccount = async (id: string) => {
    try {
      const res = await fetch(`/internal-ops/api/accounts/${id}`, { cache: 'no-store' });
      if (!res.ok) {
        if (res.status === 401) router.push('/ops-x7f9a2b4c8d1/login');
        throw new Error('Failed to fetch account');
      }
      const data = await res.json();
      setAccount(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const extendTrial = async () => {
    if (!confirm('Extend trial by 7 days?')) return;
    try {
      const res = await fetch(`/internal-ops/api/accounts/${accountId}/extend-trial`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days: 7 })
      });
      if (!res.ok) throw new Error('Failed to extend trial');
      alert('Trial extended successfully');
      fetchAccount(accountId);
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return <div className="p-8 text-text-muted">Loading...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;
  if (!account) return <div className="p-8 text-text-muted">Account not found</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy-deep mb-6">Account: {account.name}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
          <h2 className="text-lg font-semibold text-navy-deep mb-4">Users</h2>
          <div className="space-y-4">
            {account.users?.map((user: any) => (
              <div key={user.id} className="border-b border-border pb-2">
                <p className="font-medium text-text-dark">{user.full_name || 'No Name'} <span className="text-xs text-text-muted bg-muted px-2 py-0.5 rounded-md">{user.role}</span></p>
                <p className="text-sm text-text-muted">{user.email}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
          <h2 className="text-lg font-semibold text-navy-deep mb-4">Subscriptions</h2>
          <div className="space-y-4 mb-6">
            {account.subscriptions?.map((sub: any) => (
              <div key={sub.id} className="border-b border-border pb-2">
                <p className="font-medium text-text-dark capitalize">{sub.status} <span className="text-xs text-text-muted bg-muted px-2 py-0.5 rounded-md ml-2">{sub.plan_id}</span></p>
                {sub.status === 'trialing' && (
                  <p className="text-sm text-text-muted">Ends: {new Date(sub.trial_ends_at).toLocaleDateString()}</p>
                )}
                {sub.status === 'active' && (
                  <p className="text-sm text-text-muted">Period end: {new Date(sub.current_period_end).toLocaleDateString()}</p>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-4">
            {account.subscriptions?.some((s: any) => s.status === 'trialing') && (
              <button 
                onClick={extendTrial}
                className="text-sm bg-sea text-white px-4 py-2 rounded-lg hover:bg-sea-bright transition font-medium"
              >
                Extend Trial (+7 Days)
              </button>
            )}
            <button className="text-sm border border-border text-text-dark px-4 py-2 rounded-lg hover:bg-muted transition font-medium">Change Plan</button>
            <button className="text-sm border border-red-300 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition font-medium">Suspend</button>
          </div>
        </div>
      </div>
    </div>
  );
}
