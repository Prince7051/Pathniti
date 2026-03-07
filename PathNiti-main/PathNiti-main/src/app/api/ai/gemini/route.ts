import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { usageMonitor } from "@/lib/usage-monitor";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  generationConfig: {
    maxOutputTokens: 1000, // Limit output to stay within free tier
    temperature: 0.7,
  },
});

export async function POST(request: NextRequest) {
  try {
    const { prompt, context, type = "general" } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 },
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Gemini API key not configured" },
        { status: 500 },
      );
    }

    // Check if we can make a request without exceeding free tier limits
    if (!usageMonitor.canMakeRequest()) {
      return NextResponse.json(
        {
          error: "API usage limit reached. Please try again later.",
          usage: usageMonitor.getUsageStats(),
        },
        { status: 429 },
      );
    }

    // Create enhanced prompt based on type
    let enhancedPrompt = prompt;

    if (type === "career_advice") {
      enhancedPrompt = `
You are an expert career counselor for Indian students. Provide personalized career advice based on the following context:

Context: ${context || "No additional context provided"}

User Question: ${prompt}

Please provide:
1. Specific, actionable advice
2. Consider the Indian education system and job market
3. Mention relevant skills to develop
4. Suggest concrete next steps
5. Be encouraging and realistic

Format your response in a clear, structured way.
`;
    } else if (type === "stream_selection") {
      enhancedPrompt = `
You are an expert academic counselor for Indian students. Help with stream selection based on:

Context: ${context || "No additional context provided"}

User Question: ${prompt}

Please provide:
1. Analysis of different stream options
2. Pros and cons of each stream
3. Career opportunities for each stream
4. Required subjects and skills
5. Future prospects in the Indian context

Be specific and practical in your advice.
`;
    } else if (type === "college_guidance") {
      enhancedPrompt = `
You are an expert college counselor for Indian students. Provide college guidance based on:

Context: ${context || "No additional context provided"}

User Question: ${prompt}

Please provide:
1. College recommendations based on the student's profile
2. Admission requirements and cut-offs
3. Course details and specializations
4. Campus life and facilities
5. Placement statistics and career prospects

Focus on Indian colleges and universities.
`;
    }

    const result = await model.generateContent(enhancedPrompt);
    const response = await result.response;
    const text = response.text();

    // Record successful API usage
    usageMonitor.recordRequest();

    // Get usage stats
    const stats = usageMonitor.getUsageStats();
    const remaining = usageMonitor.getRemainingRequestsToday();

    return NextResponse.json({
      response: text,
      type,
      timestamp: new Date().toISOString(),
      usage: {
        requestsToday: stats.requestsToday,
        remainingToday: remaining,
        isApproachingLimit: usageMonitor.isApproachingLimit(),
      },
    });
  } catch (error) {
    console.error("Gemini API error:", error);
    return NextResponse.json(
      { error: "Failed to generate AI response" },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Gemini AI API endpoint",
    status: "active",
    model: "gemini-1.5-flash",
  });
}
