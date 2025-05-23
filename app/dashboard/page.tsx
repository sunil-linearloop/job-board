'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function Dashboard() {
  const { data: session } = useSession();

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h1 className="text-2xl font-semibold text-gray-900 mb-4">
        Welcome, {session?.user?.name}!
      </h1>

      {session?.user?.role === 'JOB_PROVIDER' ? (
        <div className="space-y-4">
          <p className="text-gray-600">
            As a job provider, you can post new jobs and manage your existing job listings.
          </p>
          <div className="flex space-x-4">
            <Link
              href="/dashboard/provider/post"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Post a New Job
            </Link>
            <Link
              href="/dashboard/jobs"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              View All Jobs
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-gray-600">
            As a job seeker, you can browse available jobs and save interesting positions.
          </p>
          <div className="flex space-x-4">
            <Link
              href="/dashboard/jobs"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Browse Jobs
            </Link>
            <Link
              href="/dashboard/seeker/saved"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              View Saved Jobs
            </Link>
          </div>
        </div>
      )}
    </div>
  );
} 