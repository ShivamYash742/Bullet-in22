import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createGroq } from '@ai-sdk/groq';
import { generateText } from 'ai';
import dbConnect from '@/lib/mongodb';
import InterviewSession from '@/lib/models/InterviewSession';
import InterviewReport from '@/lib/models/InterviewReport';
import Interview from '@/lib/models/Interview';
import { STANDARD_MARKING_SCHEMA, getMentorById } from '@/components/mentors';

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY || '',
});

// Helper function to generate AI feedback for specific Q&A pairs
async function generateQAFeedback(
  question: string,
  userResponse: string,
  jobTitle: string,
  userSummary: string
) {
  const prompt = `
You are an expert interview coach analyzing a specific question-answer pair from a mock interview.

**Job Title:** ${jobTitle}
**User Background:** ${userSummary}
**Interview Question:** ${question}
**User Response:** ${userResponse}

Please analyze this specific Q&A pair and provide feedback in the following JSON format:
{
  "feedback": "Detailed analysis of the user's response to this specific question",
  "score": 0-100,
  "suggestions": ["specific suggestion 1", "specific suggestion 2", "specific suggestion 3"]
}

Focus on:
- How well the response answers the question
- Relevance to the job role
- Clarity and structure of the response
- Use of specific examples
- Areas for improvement

Return ONLY valid JSON, no additional text or formatting.`;

  try {
    const result = await generateText({
      model: groq("llama-3.1-8b-instant"),
      prompt,
      temperature: 0.4,
    });

    const cleanedText = result.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const feedback = JSON.parse(cleanedText);
    
    return {
      feedback: feedback.feedback || 'Good response overall.',
      score: feedback.score || 75,
      suggestions: feedback.suggestions || ['Provide more specific examples', 'Structure your answer better']
    };
  } catch (error) {
    console.error('Error generating Q&A feedback:', error);
    // Fallback feedback
    return {
      feedback: 'Your response shows understanding of the question. Consider providing more specific examples.',
      score: 75,
      suggestions: ['Provide more specific examples', 'Structure your answer better', 'Show more enthusiasm']
    };
  }
}

// Helper function to calculate metrics from messages if not provided
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function calculateMetricsFromMessages(messages: any[]) {
  const userMessages = messages.filter(msg => msg.sender === 'user');
  
  // Calculate basic metrics
  const totalMessages = messages.length;
  const userMessageCount = userMessages.length;
  const avgWordsPerMessage = userMessages.reduce((acc, msg) => acc + (msg.text?.split(' ').length || 0), 0) / Math.max(userMessageCount, 1);
  
  // Estimate metrics based on message content
  const estimatedDuration = totalMessages * 30000; // 30 seconds per message average
  const estimatedUserSpeakingTime = userMessageCount * 15000; // 15 seconds per user message
  const estimatedFillerWords = userMessages.reduce((acc, msg) => {
    const fillers = (msg.text?.match(/\b(um|uh|like|you know|actually|basically|literally)\b/gi) || []).length;
    return acc + fillers;
  }, 0);
  
  return {
    totalDuration: estimatedDuration,
    userSpeakingTime: estimatedUserSpeakingTime,
    interviewerSpeakingTime: estimatedDuration - estimatedUserSpeakingTime,
    totalPauses: Math.max(userMessageCount - 1, 0),
    averagePauseLength: 2000, // 2 seconds average
    longestPause: 5000, // 5 seconds max
    averageResponseTime: 3000, // 3 seconds average
    wordsPerMinute: Math.round(avgWordsPerMessage * 2), // Rough estimate
    interruptionCount: 0,
    fillerWordsCount: estimatedFillerWords,
    confidenceScore: Math.max(0.6, Math.min(0.9, 1 - (estimatedFillerWords * 0.1))), // Based on filler words
    emotionalTone: {
      positive: 0.6,
      neutral: 0.3,
      negative: 0.1,
      confident: 0.7,
      nervous: 0.3
    }
  };
}

// Helper function to analyze conversation with AI
async function analyzeConversationWithAI(
  messages: any[],
  metrics: any,
  jobTitle: string,
  userSummary: string,
  jobSummary: string
) {
  const conversationText = messages
    .map(msg => `${msg.sender}: ${msg.text}`)
    .join('\n');

  // Use calculated metrics if original metrics are all zeros or missing
  const hasValidMetrics = metrics && (
    metrics.totalDuration > 0 || 
    metrics.userSpeakingTime > 0 || 
    metrics.confidenceScore > 0 ||
    metrics.fillerWordsCount > 0
  );
  
  const finalMetrics = hasValidMetrics ? metrics : calculateMetricsFromMessages(messages);

  const prompt = `
You are an expert interview coach analyzing a mock interview session. Please provide a comprehensive analysis based on the following data:

**Job Title:** ${jobTitle}
**User Background:** ${userSummary}
**Job Requirements:** ${jobSummary}

**Interview Conversation:**
${conversationText}

**Interview Metrics:**
- Total Duration: ${Math.round(finalMetrics.totalDuration / 1000 / 60)} minutes
- User Speaking Time: ${Math.round(finalMetrics.userSpeakingTime / 1000)} seconds
- Total Pauses: ${finalMetrics.totalPauses}
- Average Pause Length: ${finalMetrics.averagePauseLength}ms
- Longest Pause: ${finalMetrics.longestPause}ms
- Average Response Time: ${finalMetrics.averageResponseTime}ms
- Words Per Minute: ${finalMetrics.wordsPerMinute}
- Filler Words Count: ${finalMetrics.fillerWordsCount}
- Confidence Score: ${finalMetrics.confidenceScore}

Please provide a detailed analysis in the following JSON format:
{
  "performanceAnalysis": {
    "communicationSkills": {
      "score": 0-100,
      "strengths": ["strength1", "strength2"],
      "improvements": ["improvement1", "improvement2"],
      "feedback": "detailed feedback"
    },
    "technicalKnowledge": {
      "score": 0-100,
      "strengths": ["strength1", "strength2"],
      "improvements": ["improvement1", "improvement2"],
      "feedback": "detailed feedback"
    },
    "problemSolving": {
      "score": 0-100,
      "strengths": ["strength1", "strength2"],
      "improvements": ["improvement1", "improvement2"],
      "feedback": "detailed feedback"
    },
    "confidence": {
      "score": 0-100,
      "analysis": "confidence analysis",
      "recommendations": ["rec1", "rec2"]
    },
    "bodyLanguage": {
      "score": 0-100,
      "observations": ["obs1", "obs2"],
      "recommendations": ["rec1", "rec2"]
    }
  },
  "detailedFeedback": {
    "overallScore": 0-100,
    "summary": "overall performance summary",
    "keyStrengths": ["strength1", "strength2", "strength3"],
    "areasForImprovement": ["area1", "area2", "area3"],
    "behavioralInsights": {
      "pauseAnalysis": "analysis of pauses and their impact",
      "speechPaceAnalysis": "analysis of speaking pace",
      "confidenceAnalysis": "analysis of confidence levels",
      "emotionalStateAnalysis": "analysis of emotional state"
    },
    "recommendations": {
      "immediate": ["immediate action 1", "immediate action 2"],
      "shortTerm": ["short term goal 1", "short term goal 2"],
      "longTerm": ["long term goal 1", "long term goal 2"]
    }
  }
}

Focus on:
1. Communication clarity and effectiveness
2. Technical knowledge demonstration
3. Problem-solving approach
4. Confidence and composure
5. Response timing and pauses
6. Use of filler words
7. Overall interview performance
8. Specific actionable feedback

Be constructive, specific, and provide actionable insights.`;

  try {
    const fullPrompt = `You are an expert interview coach. Provide detailed, constructive feedback in valid JSON format only.

${prompt}

IMPORTANT: Return ONLY valid JSON, no additional text or formatting.`;

    const result = await generateText({
      model: groq("llama-3.1-8b-instant"),
      prompt: fullPrompt,
      temperature: 0.3,
    });

    const analysisText = result.text;
    
    if (!analysisText) {
      throw new Error('No analysis generated');
    }

    // Clean the response and parse JSON
    const cleanedText = analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const analysis = JSON.parse(cleanedText);
    return analysis;
  } catch (error) {
    console.error('Error analyzing conversation with AI:', error);
    
    // Use calculated metrics for fallback if needed
    const calculatedMetrics = hasValidMetrics ? metrics : calculateMetricsFromMessages(messages);
    
    // Generate scores based on standardized marking schema
    const communicationScore = calculatedMetrics.fillerWordsCount < 5 ? 85 : 65;
    const technicalScore = Math.round(
      (calculatedMetrics.confidenceScore * 100 + 
       (calculatedMetrics.averageResponseTime < 3000 ? 80 : 70)) / 2
    );
    const problemSolvingScore = calculatedMetrics.averageResponseTime < 3000 ? 80 : 70;
    const confidenceScore = Math.round(calculatedMetrics.confidenceScore * 100);
    
    // Calculate weighted average using standard schema
    const avgScore = Math.round(
      (communicationScore * STANDARD_MARKING_SCHEMA.communicationSkills.weight) +
      (technicalScore * STANDARD_MARKING_SCHEMA.technicalKnowledge.weight) +
      (problemSolvingScore * STANDARD_MARKING_SCHEMA.problemSolving.weight) +
      (confidenceScore * STANDARD_MARKING_SCHEMA.confidence.weight)
    );

    return {
      performanceAnalysis: {
        communicationSkills: {
          score: communicationScore,
          strengths: calculatedMetrics.fillerWordsCount < 5 ? 
            STANDARD_MARKING_SCHEMA.communicationSkills.criteria.slice(0, 2) : 
            ['Understandable communication'],
          improvements: calculatedMetrics.fillerWordsCount >= 5 ? 
            ['Reduce filler words', 'Practice smoother delivery'] : 
            ['Add more specific examples'],
          feedback: `Communication clarity was ${calculatedMetrics.fillerWordsCount < 5 ? 'excellent' : 'good'} with ${calculatedMetrics.fillerWordsCount} filler words detected. Scoring based on: ${STANDARD_MARKING_SCHEMA.communicationSkills.criteria.join(', ')}.`
        },
        technicalKnowledge: {
          score: technicalScore,
          strengths: ['Relevant responses', 'Job-related knowledge'],
          improvements: ['Provide more technical depth', 'Use industry terminology'],
          feedback: `Demonstrated understanding of the role requirements. Evaluation criteria: ${STANDARD_MARKING_SCHEMA.technicalKnowledge.criteria.join(', ')}.`
        },
        problemSolving: {
          score: problemSolvingScore,
          strengths: calculatedMetrics.averageResponseTime < 3000 ? 
            STANDARD_MARKING_SCHEMA.problemSolving.criteria.slice(0, 2) : 
            ['Thoughtful responses'],
          improvements: calculatedMetrics.averageResponseTime > 5000 ? 
            ['Reduce response time', 'Practice common scenarios'] : 
            ['Structure answers better'],
          feedback: `Response timing averaged ${Math.round(calculatedMetrics.averageResponseTime / 1000)} seconds, showing ${calculatedMetrics.averageResponseTime < 3000 ? 'quick' : 'thoughtful'} processing. Assessed on: ${STANDARD_MARKING_SCHEMA.problemSolving.criteria.join(', ')}.`
        },
        confidence: {
          score: confidenceScore,
          analysis: `Confidence level was ${calculatedMetrics.confidenceScore > 0.8 ? 'high' : calculatedMetrics.confidenceScore > 0.6 ? 'moderate' : 'developing'} throughout the interview. Evaluated based on: ${STANDARD_MARKING_SCHEMA.confidence.criteria.join(', ')}.`,
          recommendations: calculatedMetrics.confidenceScore < 0.7 ? 
            ['Practice mock interviews', 'Work on reducing pauses'] : 
            ['Maintain current confidence level', 'Continue practicing']
        },
        bodyLanguage: {
          score: 75,
          observations: ['Professional demeanor maintained'],
          recommendations: ['Continue professional presentation']
        }
      },
      detailedFeedback: {
        overallScore: avgScore,
        summary: `Performance was ${avgScore > 80 ? 'excellent' : avgScore > 70 ? 'good' : 'developing'} with specific areas identified for improvement. All mentors use the same standardized marking criteria to ensure fair and consistent evaluation.`,
        keyStrengths: [
          calculatedMetrics.confidenceScore > 0.7 ? 'Strong confidence' : 'Professional demeanor',
          calculatedMetrics.fillerWordsCount < 5 ? 'Clear communication' : 'Understandable responses',
          'Relevant experience sharing'
        ],
        areasForImprovement: [
          calculatedMetrics.fillerWordsCount >= 5 ? 'Reduce filler words' : 'Add more examples',
          calculatedMetrics.averageResponseTime > 5000 ? 'Improve response timing' : 'Enhance answer structure',
          calculatedMetrics.confidenceScore < 0.7 ? 'Build confidence' : 'Maintain consistency'
        ],
        behavioralInsights: {
          pauseAnalysis: `Interview had ${calculatedMetrics.totalPauses} pauses with longest being ${Math.round(calculatedMetrics.longestPause / 1000)} seconds.`,
          speechPaceAnalysis: `Speaking pace was appropriate with ${calculatedMetrics.wordsPerMinute || 'normal'} words per minute.`,
          confidenceAnalysis: `Confidence score of ${Math.round(calculatedMetrics.confidenceScore * 100)}% indicates ${calculatedMetrics.confidenceScore > 0.7 ? 'strong' : 'developing'} self-assurance.`,
          emotionalStateAnalysis: 'Maintained professional composure throughout the interview.'
        },
        recommendations: {
          immediate: [
            calculatedMetrics.fillerWordsCount >= 5 ? 'Practice reducing filler words' : 'Prepare more specific examples',
            'Review common interview questions'
          ],
          shortTerm: [
            calculatedMetrics.confidenceScore < 0.7 ? 'Build confidence through practice' : 'Refine technical explanations',
            'Work on answer structuring'
          ],
          longTerm: [
            'Continue mock interview practice',
            'Develop stronger personal brand narrative'
          ]
        }
      }
    };
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { interviewId, sessionId } = await req.json();

    if (!interviewId || !sessionId) {
      return NextResponse.json(
        { error: 'Interview ID and Session ID are required' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Get interview and session data
    // @ts-ignore - Mongoose typing issue
    const [interview, session] = await Promise.all([
      // @ts-ignore - Mongoose typing issue
      Interview.findById(interviewId).exec(),
      // @ts-ignore - Mongoose typing issue
      InterviewSession.findById(sessionId).exec()
    ]);

    if (!interview || !session) {
      return NextResponse.json(
        { error: 'Interview or session not found' },
        { status: 404 }
      );
    }

    // Verify user owns this interview
    if (interview.userId !== userId || session.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if report already exists
    // @ts-ignore - Mongoose typing issue
    const existingReport = await InterviewReport.findOne({ interviewId }).exec();
    if (existingReport) {
      return NextResponse.json({
        success: true,
        report: existingReport,
        message: 'Report already exists'
      });
    }

    // Get mentor information and ensure consistent marking schema
    const mentor = getMentorById(interview.mentorId);
    const mentorName = mentor ? mentor.name : 'AI Interviewer';
    
    // Use standard marking schema for consistency
    const markingSchema = STANDARD_MARKING_SCHEMA;

    // Generate AI analysis
    const aiAnalysis = await analyzeConversationWithAI(
      session.messages,
      session.metrics,
      interview.jobTitle,
      interview.userSummary,
      interview.jobSummary
    );

    // Create detailed feedback with AI analysis for each question
    const specificFeedback = await Promise.all(
      session.messages
        .filter(msg => msg.sender === 'interviewer')
        .slice(0, 5) // Analyze first 5 questions
        .map(async (question, index) => {
          const userResponse = session.messages.find(
            (msg, msgIndex) => 
              msg.sender === 'user' && 
              msgIndex > session.messages.indexOf(question)
          );

          // Generate AI feedback for this specific Q&A pair
          const qaFeedback = await generateQAFeedback(
            question.text,
            userResponse?.text || 'No response recorded',
            interview.jobTitle,
            interview.userSummary
          );

          return {
            questionId: `q${index + 1}`,
            question: question.text,
            userResponse: userResponse?.text || 'No response recorded',
            feedback: qaFeedback.feedback,
            score: qaFeedback.score,
            suggestions: qaFeedback.suggestions
          };
        })
    );

    // Create the report
    const report = new InterviewReport({
      interviewId,
      sessionId,
      userId,
      jobTitle: interview.jobTitle,
      mentorName,
      performanceAnalysis: aiAnalysis.performanceAnalysis,
      detailedFeedback: {
        ...aiAnalysis.detailedFeedback,
        specificFeedback
      },
      interviewDuration: session.metrics.totalDuration || 0,
      generatedAt: new Date(),
      reportVersion: '1.0',
    });

    await report.save();

    // Update interview and session
    // @ts-ignore - Mongoose typing issue
    await Promise.all([
      // @ts-ignore - Mongoose typing issue
      Interview.findByIdAndUpdate(interviewId, {
        reportId: report._id,
        reportGenerated: true,
      }).exec(),
      // @ts-ignore - Mongoose typing issue
      InterviewSession.findByIdAndUpdate(sessionId, {
        reportGenerated: true,
      }).exec()
    ]);

    return NextResponse.json({
      success: true,
      report,
      message: 'Report generated successfully'
    });
  } catch (error) {
    console.error('Error generating interview report:', error);
    return NextResponse.json(
      { error: 'Failed to generate interview report' },
      { status: 500 }
    );
  }
}

// Get existing report
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const interviewId = searchParams.get('interviewId');
    const reportId = searchParams.get('reportId');

    if (!interviewId && !reportId) {
      return NextResponse.json(
        { error: 'Interview ID or Report ID is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    let report;
    if (reportId) {
      // @ts-ignore - Mongoose typing issue
      report = await InterviewReport.findById(reportId).exec();
    } else {
      // @ts-ignore - Mongoose typing issue
      report = await InterviewReport.findOne({ interviewId }).exec();
    }

    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    // Verify user owns this report
    if (report.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error('Error fetching interview report:', error);
    return NextResponse.json(
      { error: 'Failed to fetch interview report' },
      { status: 500 }
    );
  }
}
