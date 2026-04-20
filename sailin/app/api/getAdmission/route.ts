import { NextResponse } from "next/server";
import {
  getValidatedJsonFromGemini,
  isQuotaError,
  isTimeoutError,
} from "../_lib/gemini";

type AdmissionRequestBody = {
  course: string;
  profile: {
    age: string | number;
    level: string;
    interests?: string[];
  };
};

function buildValidationPrompt(
  response: unknown,
  profile: AdmissionRequestBody["profile"],
  course: string,
) {
  return `You are a strict JSON validator for an admission-path response.

IMPORTANT:
- Do NOT rewrite the response
- Do NOT add extra commentary
- Return ONLY valid JSON

Student profile:
${JSON.stringify(profile, null, 2)}

Selected course:
${JSON.stringify(course, null, 2)}

Validate the generated response below against these rules:
- It must be valid JSON
- It must contain a "course_entrance_mapping" array
- Each item must have "course_name" and "entrance_exams"
- Each exam must have "exam_name", "priority", "difficulty", and "description"
- Priorities must be only High, Medium, or Low
- Difficulty must be only Easy, Medium, or Hard
- The pathways should be relevant for the selected course in India
- If direct admission is appropriate, it should be included as a valid pathway

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
    const { course, profile } = (await req.json()) as AdmissionRequestBody;

    const prompt = `
You are a friendly and knowledgeable career counsellor specializing in the Indian education system.

IMPORTANT:
- Do NOT search the web
- Do NOT reference external articles
- Generate accurate, general knowledge-based content
- Focus ONLY on India

You will be given:
1. Student profile (JSON)
2. Selected course options (JSON)

Student Profile (JSON):
${JSON.stringify(profile)}

Selected Courses (JSON):
${JSON.stringify(course)}

Your task:

For each course, identify all relevant entrance exams or admission pathways in India that a student can take to get admission.

Instructions:
- Address the student directly using "You" and "Your"
- Maintain a friendly counselling tone

Include:
- National-level exams
- State-level exams
- Common institutional or alternative pathways

If a course does NOT require an entrance exam:
- Include: "Direct admission based on merit"

For each exam, assign:

1. Priority:
  - "High" → Most common / widely accepted exam
  - "Medium" → Alternative pathway
  - "Low" → Less common or indirect route

2. Difficulty level:
  - "Easy" → Basic competition, easier to qualify
  - "Medium" → Moderate competition and preparation required
  - "Hard" → Highly competitive, requires strong preparation

Guidelines for difficulty:
- National-level competitive exams → usually "Hard"
- State-level exams → usually "Medium"
- Direct admission → "Easy"

- Keep explanations short (1–2 sentences)

STRICT LANGUAGE RULE:
- Use "You" and "Your"
- Do NOT use "This student" or "This individual"

Output format:
Return ONLY valid JSON.

The JSON format must be exactly:

{
  "course_entrance_mapping": [
    {
      "course_name": "",
      "entrance_exams": [
        {
          "exam_name": "",
          "priority": "High | Medium | Low",
          "difficulty": "Easy | Medium | Hard",
          "description": ""
        }
      ]
    }
  ]
}
`;

    const aiOutput = await getValidatedJsonFromGemini(
      prompt,
      (response) => buildValidationPrompt(response, profile, course),
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
