import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '../../../auth/[...nextauth]/route';

export async function POST(
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

    if (session.user.role !== 'JOB_SEEKER') {
      return NextResponse.json(
        { message: 'Only job seekers can apply for jobs' },
        { status: 403 }
      );
    }

    // Check if the user has already applied
    const existingApplication = await prisma.jobApplication.findUnique({
      where: {
        userId_jobId: {
          userId: session.user.id,
          jobId: params.id,
        },
      },
    });

    if (existingApplication) {
      return NextResponse.json(
        { message: 'You have already applied for this job' },
        { status: 400 }
      );
    }

    // Create the job application
    await prisma.jobApplication.create({
      data: {
        userId: session.user.id,
        jobId: params.id,
        status: 'PENDING',
      },
    });

    return NextResponse.json({ message: 'Application submitted successfully' });
  } catch (error) {
    console.error('Error applying for job:', error);
    return NextResponse.json(
      { message: 'Error applying for job' },
      { status: 500 }
    );
  }
}

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

    if (session.user.role !== 'JOB_SEEKER') {
      return NextResponse.json(
        { message: 'Only job seekers can check application status' },
        { status: 403 }
      );
    }

    const application = await prisma.jobApplication.findUnique({
      where: {
        userId_jobId: {
          userId: session.user.id,
          jobId: params.id,
        },
      },
    });

    return NextResponse.json({
      hasApplied: !!application,
      status: application?.status || null,
    });
  } catch (error) {
    console.error('Error checking application status:', error);
    return NextResponse.json(
      { message: 'Error checking application status' },
      { status: 500 }
    );
  }
} 