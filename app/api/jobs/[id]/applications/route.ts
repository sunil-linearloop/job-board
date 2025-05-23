import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '../../../auth/[...nextauth]/route';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'JOB_PROVIDER') {
      return NextResponse.json(
        { message: 'Only job providers can view applications' },
        { status: 403 }
      );
    }

    // Verify that the job belongs to this provider
    const job = await prisma.job.findUnique({
      where: {
        id: params.id,
        providerId: session.user.id,
      },
    });

    if (!job) {
      return NextResponse.json(
        { message: 'Job not found or unauthorized' },
        { status: 404 }
      );
    }

    // Fetch all applications for this job
    const applications = await prisma.jobApplication.findMany({
      where: {
        jobId: params.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(applications);
  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json(
      { message: 'Error fetching applications' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'JOB_PROVIDER') {
      return NextResponse.json(
        { message: 'Only job providers can update application status' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { applicationId, status } = body;

    if (!applicationId || !status) {
      return NextResponse.json(
        { message: 'Application ID and status are required' },
        { status: 400 }
      );
    }

    // Verify that the job belongs to this provider
    const application = await prisma.jobApplication.findUnique({
      where: {
        id: applicationId,
      },
      include: {
        job: true,
      },
    });

    if (!application || application.job.providerId !== session.user.id) {
      return NextResponse.json(
        { message: 'Application not found or unauthorized' },
        { status: 404 }
      );
    }

    // Update the application status
    const updatedApplication = await prisma.jobApplication.update({
      where: {
        id: applicationId,
      },
      data: {
        status,
      },
    });

    return NextResponse.json(updatedApplication);
  } catch (error) {
    console.error('Error updating application status:', error);
    return NextResponse.json(
      { message: 'Error updating application status' },
      { status: 500 }
    );
  }
} 