import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

async function getAuditLogs() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  
  if (!session) {
    redirect('/ops-x7f9a2b4c8d1/login');
  }

  const res = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/+$/, '')}/internal-ops/api/audit-log`, {
    headers: {
      'Cookie': `admin_session=${session.value}`
    },
    cache: 'no-store'
  });

  if (!res.ok) {
    if (res.status === 401) redirect('/ops-x7f9a2b4c8d1/login');
    return [];
  }

  return res.json();
}

export default async function AuditLog() {
  const logs = await getAuditLogs();

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy-deep mb-6">Audit Log</h1>
      
      <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
        <table className="w-full text-left text-sm text-text-muted">
          <thead className="bg-muted border-b border-border">
            <tr>
              <th className="px-6 py-4 font-semibold text-navy-deep">Date</th>
              <th className="px-6 py-4 font-semibold text-navy-deep">Action</th>
              <th className="px-6 py-4 font-semibold text-navy-deep">Admin User ID</th>
              <th className="px-6 py-4 font-semibold text-navy-deep">Target Account</th>
              <th className="px-6 py-4 font-semibold text-navy-deep">IP Address</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log: any) => (
              <tr key={log.id} className="border-b border-border hover:bg-muted/50 transition">
                <td className="px-6 py-4">{new Date(log.created_at).toLocaleString()}</td>
                <td className="px-6 py-4 font-medium text-text-dark">{log.action}</td>
                <td className="px-6 py-4 font-mono text-xs">{log.admin_user_id?.substring(0, 8)}...</td>
                <td className="px-6 py-4 font-mono text-xs">{log.target_account_id ? log.target_account_id.substring(0, 8) + '...' : '-'}</td>
                <td className="px-6 py-4">{log.ip_address}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-text-muted">No logs found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
