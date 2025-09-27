/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import dbConnect from '@/lib/mongodb';
import InterviewSession from '@/lib/models/InterviewSession';
import Interview from '@/lib/models/Interview';

// Create or update interview session
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { interviewId, action, messageData, metricsData } = await req.json();

    if (!interviewId || !action) {
      return NextResponse.json(
        { error: 'Interview ID and action are required' },
        { status: 400 }
      );
    }

    await dbConnect();

    let session;

    switch (action) {
      case 'start':
        // Create new session
        session = new InterviewSession({
          interviewId,
          userId,
          messages: [],
          startTime: new Date(),
          status: 'active',
        });
        await session.save();

        // Update interview status
        await (Interview.findByIdAndUpdate(interviewId, {
          status: 'in-progress',
          startDateTime: new Date(),
          sessionId: session._id,
        }) as any).exec();
        break;

      case 'add_message':
        if (!messageData) {
          return NextResponse.json(
            { error: 'Message data is required' },
            { status: 400 }
          );
        }

        session = await (InterviewSession.findOne({
          interviewId,
          status: 'active',
        }) as any).exec();

        if (!session) {
          return NextResponse.json(
            { error: 'Active session not found' },
            { status: 404 }
          );
        }

        // Add message to session
        session.messages.push({
          id: messageData.id || Date.now().toString(),
          sender: messageData.sender,
          text: messageData.text,
          timestamp: new Date(messageData.timestamp || Date.now()),
          duration: messageData.duration,
          pauseBefore: messageData.pauseBefore,
          confidence: messageData.confidence,
          emotion: messageData.emotion,
          volume: messageData.volume,
        });

        await session.save();
        break;

      case 'update_metrics':
        if (!metricsData) {
          return NextResponse.json(
            { error: 'Metrics data is required' },
            { status: 400 }
          );
        }

        session = await (InterviewSession.findOne({
          interviewId,
          status: 'active',
        }) as any).exec();

        if (!session) {
          return NextResponse.json(
            { error: 'Active session not found' },
            { status: 404 }
          );
        }

        // Ensure metrics object exists and merge properly
        if (!session.metrics) {
          session.metrics = {};
        }
        
        // Update metrics with validation
        const updatedMetrics = {
          ...session.metrics,
          ...metricsData,
          // Ensure numeric values are properly set
          totalDuration: metricsData.totalDuration || session.metrics.totalDuration || 0,
          userSpeakingTime: metricsData.userSpeakingTime || session.metrics.userSpeakingTime || 0,
          confidenceScore: metricsData.confidenceScore !== undefined ? metricsData.confidenceScore : (session.metrics.confidenceScore || 0.7),
          fillerWordsCount: metricsData.fillerWordsCount !== undefined ? metricsData.fillerWordsCount : (session.metrics.fillerWordsCount || 0),
          wordsPerMinute: metricsData.wordsPerMinute || session.metrics.wordsPerMinute || 120
        };
        
        session.metrics = updatedMetrics;
        await session.save();
        break;

      case 'end':
        session = await (InterviewSession.findOne({
          interviewId,
          status: 'active',
        }) as any).exec();

        if (!session) {
          return NextResponse.json(
            { error: 'Active session not found' },
            { status: 404 }
          );
        }

        // End session
        session.endTime = new Date();
        session.status = 'completed';
        
        // Calculate final metrics if not provided
        if (metricsData) {
          session.metrics = { ...session.metrics, ...metricsData };
        } else if (session.messages && session.messages.length > 0) {
          // Calculate basic metrics from messages if no metrics provided
          const userMessages = session.messages.filter(msg => msg.sender === 'user');
          const totalDuration = (session.endTime.getTime() - session.startTime.getTime());
          const estimatedUserSpeakingTime = userMessages.length * 15000; // 15 seconds per message
          const fillerWords = userMessages.reduce((acc, msg) => {
            const fillers = (msg.text?.match(/\b(um|uh|like|you know|actually|basically|literally)\b/gi) || []).length;
            return acc + fillers;
          }, 0);
          
          session.metrics = {
            ...session.metrics,
            totalDuration: totalDuration > 0 ? totalDuration : session.messages.length * 30000,
            userSpeakingTime: estimatedUserSpeakingTime,
            fillerWordsCount: fillerWords,
            confidenceScore: Math.max(0.6, Math.min(0.9, 1 - (fillerWords * 0.1))),
            totalPauses: Math.max(userMessages.length - 1, 0),
            averageResponseTime: 3000,
            wordsPerMinute: Math.round((userMessages.reduce((acc, msg) => acc + (msg.text?.split(' ').length || 0), 0) / Math.max(userMessages.length, 1)) * 2)
          };
        }

        await session.save();

        // Update interview status
        await (Interview.findByIdAndUpdate(interviewId, {
          status: 'completed',
          endDateTime: new Date(),
        }) as any).exec();
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      session: session ? {
        id: session._id,
        status: session.status,
        messageCount: session.messages?.length || 0,
      } : null,
    });
  } catch (error) {
    console.error('Error managing interview session:', error);
    return NextResponse.json(
      { error: 'Failed to manage interview session' },
      { status: 500 }
    );
  }
}

// Get interview session data
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const interviewId = searchParams.get('interviewId');
    const sessionId = searchParams.get('sessionId');

    if (!interviewId && !sessionId) {
      return NextResponse.json(
        { error: 'Interview ID or Session ID is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    let session;
    if (sessionId) {
      session = await (InterviewSession.findById(sessionId) as any).exec();
    } else {
      session = await (InterviewSession.findOne({ interviewId }) as any).exec();
    }

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Verify user owns this session
    if (session.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      session,
    });
  } catch (error) {
    console.error('Error fetching interview session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch interview session' },
      { status: 500 }
    );
  }
}
