import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createGroq } from '@ai-sdk/groq';
import { generateText } from 'ai';
import dbConnect from '@/lib/mongodb';
import UserProfile from '@/lib/models/User';

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY || '',
});

export async function POST(req: NextRequest) {
  console.log('🚀 Process resume API called');
  try {
    const { userId } = await auth();
    console.log('👤 User ID:', userId);

    if (!userId) {
      console.log('❌ No user ID - unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fileUrl, fileContent, fileName } = await req.json();
    console.log('📄 Request data:', { fileUrl: !!fileUrl, fileContent: !!fileContent, fileName });

    if (!fileUrl || !fileContent) {
      console.log('❌ Missing required data');
      return NextResponse.json(
        { error: 'File URL and content are required' },
        { status: 400 }
      );
    }

    // Truncate file content to avoid Groq API size limits (max ~8000 chars)
    const truncatedContent = fileContent.length > 8000 
      ? fileContent.substring(0, 8000) + '\n\n[Content truncated due to length]'
      : fileContent;

    // Generate resume summary using Groq
    console.log('🤖 Calling Groq AI...');
    const { text: resumeSummary } = await generateText({
      model: groq('llama-3.1-8b-instant'),
      prompt: `Please analyze this resume and provide a concise summary (2-3 sentences) highlighting the candidate's key skills, experience, and qualifications:\n\n${truncatedContent}`,
    });

    console.log('✅ Resume summary generated:', resumeSummary);

    // Connect to database and save/update user profile
    await dbConnect();

    const userProfile = await (UserProfile as any).findOneAndUpdate(
      { userId },
      {
        resumeUrl: fileUrl,
        resumeSummary,
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      fileUrl,
      resumeSummary,
      userProfile,
      fileName,
    });
  } catch (error) {
    console.error('❌ Error processing resume:', error);
    
    // Check if it's a Groq API error
    if (error instanceof Error && error.message.includes('API')) {
      console.error('🔑 Possible API key issue or rate limit');
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to process resume',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
