import { NextResponse } from "next/server";
import {
  getValidatedJsonFromGemini,
  isQuotaError,
  isTimeoutError,
} from "../_lib/gemini";

type ProfileRequestBody = {
  name: string;
  age: string | number;
  level: string;
  interests?: string[];
};

function buildValidationPrompt(
  response: unknown,
  age: string | number,
  level: string,
  interests: string,
) {
  return `You are a strict JSON validator for a student career-assessment question generator.

IMPORTANT:
- Do NOT rewrite the response
- Do NOT add extra commentary
- Return ONLY valid JSON

Student details:
- Age: ${age}
- Academic level: ${level}
- Main interests: ${interests}

Validate the generated response below against these rules:
- It must be valid JSON
- It must contain a "questions" array
- There must be exactly 10 questions
- Each question must have 3 to 4 options
- Questions must be varied and not repetitive
- No yes/no questions
- The response should be suitable for the given student profile

Generated response JSON:
${JSON.stringify(response, null, 2)}

Return ONLY this JSON shape:
{
  "valid": true | false,
  "reason": ""
}
`;
}

export async function POST(req: Request) {
  try {
    const { age, level, interests } = (await req.json()) as ProfileRequestBody;

    const mainInterests = Array.isArray(interests) ? interests.join(", ") : "";

    const prompt = `
You are a friendly and patient career counselling session conductor.

IMPORTANT:
- Do NOT search the web
- Do NOT reference existing articles
- Generate original content only

Your role is to gently understand a student’s personality, interests,
strengths, and preferences so that suitable career options can be suggested later.

Student details:
- Age: ${age}
- Academic level: ${level}
- Main interests: ${mainInterests}

Task:
Create exactly 10 multiple-choice self-assessment questions for this student.
Each time this request is made, generate COMPLETELY DIFFERENT questions.

Guidelines:
- Friendly, encouraging language
- Counselling tone, not an exam
- Each question must have 3–4 options
- No yes/no questions
- No explanations
- Vary question topics and angles to create diverse assessment
- Cover different aspects: work style, decision-making, learning preferences, social tendencies, problem-solving approach, time management, creativity, collaboration, independence, risk tolerance
- Each question should explore a unique dimension of personality/aptitude
- Generate original phrasing and scenarios
- Do NOT repeat or reuse standard assessment templates

Output format:
Return ONLY valid JSON.
Do NOT include any extra text, headings, or explanations outside JSON.

The JSON format must be exactly:

{
"description":"",
  "questions":[

  {
  "question":"",
  "options":[]
  }
  ]
  }

`;

    const aiOutput = await getValidatedJsonFromGemini(
      prompt,
      (response) => buildValidationPrompt(response, age, level, mainInterests),
      { maxAttempts: 3 },
    );

    return NextResponse.json(aiOutput, { status: 200 });
  } catch (error: unknown) {
    const timeout = isTimeoutError(error);
    const quotaExhausted = isQuotaError(error);

    return NextResponse.json(
      {
        status: "error",
        message: timeout
          ? "AI server timeout"
          : quotaExhausted
            ? "AI free-tier quota exhausted"
            : "Failed to generate AI response",
        errorCode: quotaExhausted ? "quota_exhausted" : null,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: timeout ? 503 : quotaExhausted ? 429 : 500 },
    );
  }
}
