import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function GET() {
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
        { message: 'Only job seekers can view saved jobs' },
        { status: 403 }
      );
    }

    const savedJobs = await prisma.savedJob.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        job: {
          include: {
            provider: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(savedJobs.map(saved => saved.job));
  } catch (error) {
    console.error('Error fetching saved jobs:', error);
    return NextResponse.json(
      { message: 'Error fetching saved jobs' },
      { status: 500 }
    );
  }
} 