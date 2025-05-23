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

    if (session.user.role !== 'JOB_SEEKER') {
      return NextResponse.json(
        { message: 'Only job seekers can check saved status' },
        { status: 403 }
      );
    }

    const savedJob = await prisma.savedJob.findUnique({
      where: {
        userId_jobId: {
          userId: session.user.id,
          jobId: params.id,
        },
      },
    });

    return NextResponse.json({
      isSaved: !!savedJob,
    });
  } catch (error) {
    console.error('Error checking saved status:', error);
    return NextResponse.json(
      { message: 'Error checking saved status' },
      { status: 500 }
    );
  }
} 