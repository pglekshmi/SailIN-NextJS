import { NextResponse } from "next/server";
import {
  getValidatedJsonFromGemini,
  isQuotaError,
  isTimeoutError,
} from "../_lib/gemini";

type CareerRequestBody = {
  career: string;
  profile: {
    age: string | number;
    level: string;
    interests?: string[];
  };
};

function buildValidationPrompt(
  response: unknown,
  profile: CareerRequestBody["profile"],
  career: string,
) {
  return `You are a strict JSON validator for a course recommendation response.

IMPORTANT:
- Do NOT rewrite the response
- Do NOT add extra commentary
- Return ONLY valid JSON

Student profile:
${JSON.stringify(profile, null, 2)}

Selected career:
${JSON.stringify(career, null, 2)}

Validate the generated response below against these rules:
- It must be valid JSON
- It must contain a "career_paths" array
- Each path must have "career_name" and "recommended_courses"
- Each course must have "course_name", "priority", and "description"
- Priorities must be only High, Medium, or Low
- Courses must be realistic for the student's current academic level
- The response must not include courses that require higher qualifications than the student has

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
    const { career, profile } = (await req.json()) as CareerRequestBody;

    const prompt = `
You are a friendly and experienced career counsellor.

IMPORTANT:
- Do NOT search the web
- Do NOT reference specific universities or external articles
- Generate original content only

You will be given:
1. Student profile (JSON)
2. Suggested career options (JSON)

Student Profile (JSON):
${JSON.stringify(profile)}

Selected Careers (JSON):
${JSON.stringify(career)}

Your task:

For each career, generate a comprehensive list of possible courses or educational paths the student can pursue.

CRITICAL: Filter courses strictly based on the student's current education level:
- 10th: Only suggest 10+2 (pre-university), diploma, vocational, or certification courses
- 12th: Suggest undergraduate degrees, diploma, advanced certificates, vocational courses
- Diploma: Suggest diploma extensions, advanced diplomas, or degree programs if pursuing further education
- Degree: Suggest postgraduate degrees (MTech, MSc, MBA, etc.), professional courses
- Postgraduate: Suggest PhD, specialized postgraduate programs, advanced certifications
- PhD: Suggest advanced research programs, specialized certifications

Then:
- Assign a priority level to each course:
  - "High" → Best fit based on student's profile, interests, and current academic level
  - "Medium" → Good option but may need extra effort or additional prerequisites
  - "Low" → Less direct but still possible pathway (avoid if it requires prerequisites student hasn't met)

- Sort the courses in this order:
  1. High priority
  2. Medium priority
  3. Low priority

Instructions:
- Address the student directly using "You" and "Your"
- Maintain a friendly counselling tone
- Include both:
  - Degree programs (appropriate to their level)
  - Diploma / certification / short-term courses (appropriate to their level)
- STRICTLY ensure suggestions are realistic and accessible based on their current academic level
- Do NOT suggest courses requiring qualifications they don't yet have
- Keep descriptions concise (1–2 sentences)
- Do NOT mention specific colleges or platforms

Output format:
Return ONLY valid JSON.

The JSON format must be exactly:

{
  "career_paths": [
    {
      "career_name": "",
      "recommended_courses": [
        {
          "course_name": "",
          "priority": "High | Medium | Low",
          "description": ""
        }
      ]
    }
  ]
}
`;

    const aiOutput = await getValidatedJsonFromGemini(
      prompt,
      (response) => buildValidationPrompt(response, profile, career),
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
