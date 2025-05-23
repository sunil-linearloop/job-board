import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { authOptions } from '../auth/[...nextauth]/route';

const jobSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  company: z.string().min(1, 'Company name is required'),
  location: z.string().min(1, 'Location is required'),
  type: z.string().min(1, 'Job type is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  salary: z.string().optional(),
});

export async function GET() {
  try {
    const jobs = await prisma.job.findMany({
      include: {
        provider: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(jobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json(
      { message: 'Error fetching jobs' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
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
        { message: 'Only job providers can post jobs' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = jobSchema.parse(body);

    console.log('Session user:', session.user);

    const job = await prisma.job.create({
      data: {
        ...validatedData,
        provider: {
          connect: {
            email: session.user.email
          }
        }
      },
    });

    if (!job) {
      return NextResponse.json(
        { message: 'Failed to create job' },
        { status: 500 }
      );
    }

    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    console.error('Error creating job:', error && typeof error === 'object' ? JSON.stringify(error) : String(error));
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: (error && error.message) ? error.message : 'Error creating job' },
      { status: 500 }
    );
  }
} 