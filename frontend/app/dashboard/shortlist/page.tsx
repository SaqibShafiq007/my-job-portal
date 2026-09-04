// frontend/app/dashboard/shortlist/page.tsx
import { apiFetch } from '@/lib/api';
import Link from 'next/link';

type ShortlistItem = {
  id: string;
  job_id: string;
  title: string;
  job_status: string;
  company_name: string;
  created_at: string;
};

export default async function ShortlistPage() {
  const res = await apiFetch('/api/applicants/shortlist');
  const data: { shortlist: ShortlistItem[] } = await res.json();

  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold mb-4">My Shortlist</h1>
      {data.shortlist.length === 0 ? (
        <p className="text-gray-500">No jobs shortlisted yet.</p>
      ) : (
        <ul className="space-y-2">
          {data.shortlist.map((item) => (
            <li key={item.id} className="border-b pb-2">
              <Link href={`/jobs/${item.job_id}`} className="text-blue-600 hover:underline">
                {item.title} — {item.company_name}
              </Link>
              <span className="ml-2 text-xs text-gray-500">({item.job_status})</span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}