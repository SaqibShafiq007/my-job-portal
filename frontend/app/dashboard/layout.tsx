// frontend/app/dashboard/layout.tsx
import Link from 'next/link';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <nav className="w-48 border-r p-4 space-y-2">
        <p className="text-xs font-semibold uppercase text-gray-400 mb-3">Company</p>
        <Link href="/dashboard/jobs" className="block text-sm hover:text-blue-600">
          Jobs
        </Link>
        <Link href="/dashboard/members" className="block text-sm hover:text-blue-600">
          Members
        </Link>
      </nav>
      <main className="flex-1">{children}</main>
    </div>
  );
}