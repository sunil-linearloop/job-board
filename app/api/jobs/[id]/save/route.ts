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
        { message: 'Only job seekers can save jobs' },
        { status: 403 }
      );
    }

    await prisma.savedJob.create({
      data: {
        userId: session.user.id,
        jobId: params.id,
      },
    });

    return NextResponse.json({ message: 'Job saved successfully' });
  } catch (error) {
    console.error('Error saving job:', error);
    return NextResponse.json(
      { message: 'Error saving job' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
        { message: 'Only job seekers can unsave jobs' },
        { status: 403 }
      );
    }

    await prisma.savedJob.delete({
      where: {
        userId_jobId: {
          userId: session.user.id,
          jobId: params.id,
        },
      },
    });

    return NextResponse.json({ message: 'Job unsaved successfully' });
  } catch (error) {
    console.error('Error unsaving job:', error);
    return NextResponse.json(
      { message: 'Error unsaving job' },
      { status: 500 }
    );
  }
} 