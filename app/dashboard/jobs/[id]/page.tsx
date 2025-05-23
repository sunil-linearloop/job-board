'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { use } from 'react';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  description: string;
  salary?: string;
  createdAt: string;
  provider: {
    name: string;
    email: string;
  };
}

interface Application {
  id: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export default function JobDetail({ params }: { params: { id: string } }) {
  const jobId = use(params).id;
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const response = await fetch(`/api/jobs/${jobId}`);
        if (!response.ok) {
          throw new Error('Job not found');
        }
        const data = await response.json();
        setJob(data);
      } catch (error: any) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    const checkIfSaved = async () => {
      if (session?.user?.role === 'JOB_SEEKER') {
        try {
          const response = await fetch(`/api/jobs/${jobId}/saved`);
          if (response.ok) {
            const data = await response.json();
            setIsSaved(data.isSaved);
          }
        } catch (error) {
          console.error('Error checking saved status:', error);
        }
      }
    };

    const checkIfApplied = async () => {
      if (session?.user?.role === 'JOB_SEEKER') {
        try {
          const response = await fetch(`/api/jobs/${jobId}/apply`);
          if (response.ok) {
            const data = await response.json();
            setHasApplied(data.hasApplied);
            setApplicationStatus(data.status);
          }
        } catch (error) {
          console.error('Error checking application status:', error);
        }
      }
    };

    const fetchApplications = async () => {
      if (session?.user?.role === 'JOB_PROVIDER') {
        try {
          const response = await fetch(`/api/jobs/${jobId}/applications`);
          if (response.ok) {
            const data = await response.json();
            setApplications(data);
          }
        } catch (error) {
          console.error('Error fetching applications:', error);
        }
      }
    };

    fetchJob();
    checkIfSaved();
    checkIfApplied();
    fetchApplications();
  }, [jobId, session?.user?.role]);

  const handleSaveJob = async () => {
    try {
      const response = await fetch(`/api/jobs/${jobId}/save`, {
        method: isSaved ? 'DELETE' : 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to update saved status');
      }

      setIsSaved(!isSaved);
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleApply = async () => {
    try {
      setIsApplying(true);
      const response = await fetch(`/api/jobs/${jobId}/apply`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to apply for job');
      }

      setHasApplied(true);
      setApplicationStatus('PENDING');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsApplying(false);
    }
  };

  const handleUpdateStatus = async (applicationId: string, newStatus: string) => {
    try {
      setIsUpdatingStatus(true);
      const response = await fetch(`/api/jobs/${jobId}/applications`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          applicationId,
          status: newStatus,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update application status');
      }

      // Update the applications list with the new status
      setApplications(applications.map(app => 
        app.id === applicationId ? { ...app, status: newStatus as 'PENDING' | 'ACCEPTED' | 'REJECTED' } : app
      ));
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          {error || 'Job not found'}
        </h2>
        <Link
          href="/dashboard/jobs"
          className="text-indigo-600 hover:text-indigo-500"
        >
          Back to Jobs
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {/* Header Section */}
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{job.title}</h1>
              <p className="mt-1 text-sm text-gray-500">
                {job.company} • {job.location}
              </p>
            </div>
            <div className="flex space-x-3">
              {session?.user?.role === 'JOB_SEEKER' && (
                <>
                  <button
                    onClick={handleSaveJob}
                    className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                      isSaved
                        ? 'bg-gray-600 hover:bg-gray-700'
                        : 'bg-indigo-600 hover:bg-indigo-700'
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                  >
                    {isSaved ? 'Saved' : 'Save Job'}
                  </button>
                  {!hasApplied ? (
                    <button
                      onClick={handleApply}
                      disabled={isApplying}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      {isApplying ? 'Applying...' : 'Apply Now'}
                    </button>
                  ) : (
                    <span className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md bg-gray-100 text-gray-800">
                      Applied • {applicationStatus?.toLowerCase()}
                    </span>
                  )}
                </>
              )}
              {session?.user?.role === 'JOB_PROVIDER' &&
                session.user.id === job.provider.id && (
                  <Link
                    href={`/dashboard/provider/jobs/${job.id}/edit`}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Edit Job
                  </Link>
                )}
            </div>
          </div>
        </div>

        {/* Job Details */}
        <div className="px-4 py-5 sm:px-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Job Type</dt>
              <dd className="mt-1 text-sm text-gray-900">{job.type}</dd>
            </div>
            {job.salary && (
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Salary</dt>
                <dd className="mt-1 text-sm text-gray-900">{job.salary}</dd>
              </div>
            )}
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Description</dt>
              <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                {job.description}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Posted by</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {job.provider.name} ({job.provider.email})
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Posted on</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(job.createdAt).toLocaleDateString()}
              </dd>
            </div>
          </dl>
        </div>

        {/* Applications Section (visible only to job provider) */}
        {session?.user?.role === 'JOB_PROVIDER' && session.user.id === job.provider.id && (
          <div className="border-t border-gray-200">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg font-medium text-gray-900">Applications</h3>
              {applications.length === 0 ? (
                <p className="mt-1 text-sm text-gray-500">No applications yet</p>
              ) : (
                <div className="mt-4 divide-y divide-gray-200">
                  {applications.map((application) => (
                    <div key={application.id} className="py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">{application.user.name}</h4>
                          <p className="text-sm text-gray-500">{application.user.email}</p>
                          <p className="text-xs text-gray-500">
                            Applied on {new Date(application.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <select
                            value={application.status}
                            onChange={(e) => handleUpdateStatus(application.id, e.target.value)}
                            disabled={isUpdatingStatus}
                            className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          >
                            <option value="PENDING">Pending</option>
                            <option value="ACCEPTED">Accept</option>
                            <option value="REJECTED">Reject</option>
                          </select>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            application.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                            application.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {application.status.toLowerCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-4 py-4 sm:px-6 bg-gray-50 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <Link
              href="/dashboard/jobs"
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              ← Back to Jobs
            </Link>
            {session?.user?.role === 'JOB_SEEKER' && !hasApplied && (
              <button
                onClick={handleApply}
                disabled={isApplying}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                {isApplying ? 'Applying...' : 'Apply Now'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 