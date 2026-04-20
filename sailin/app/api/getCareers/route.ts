import { NextResponse } from "next/server";
import {
  getValidatedJsonFromGemini,
  isQuotaError,
  isTimeoutError,
} from "../_lib/gemini";

type CareerRequestBody = {
  answers: {
    question: string;
    selected_option?: number | null;
    selected_text: string;
  }[];
  profile: {
    age: string | number;
    level: string;
    interests?: string[];
  };
};

type CareerOutline = {
  career_name: string;
  explanation: string;
};

type CareerDetail = CareerOutline & {
  recommended_courses: {
    course_name: string;
    priority: "High" | "Medium" | "Low";
    description: string;
    entrance_exams: {
      exam_name: string;
      priority: "High" | "Medium" | "Low";
      difficulty: "Easy" | "Medium" | "Hard";
      description: string;
    }[];
  }[];
};

function buildContext(
  profile: CareerRequestBody["profile"],
  answers: CareerRequestBody["answers"],
) {
  return `Student Profile (JSON):\n${JSON.stringify(profile)}\nSelf-assessment responses (JSON):\n${JSON.stringify(answers)}`;
}

function buildOutlineValidationPrompt(
  response: unknown,
  profile: CareerRequestBody["profile"],
  answers: CareerRequestBody["answers"],
) {
  return `You are a strict JSON validator for a career-shortlisting response.

IMPORTANT:
- Do NOT rewrite the response
- Do NOT add extra commentary
- Return ONLY valid JSON

Student profile:
${JSON.stringify(profile, null, 2)}

Self-assessment responses:
${JSON.stringify(answers, null, 2)}

Validate the generated response below against these rules:
- It must be valid JSON
- It must contain a "personality_summary" string
- It must contain a "careers" array with exactly 5 items
- Each career must have "career_name" and "explanation"
- Careers should not be duplicated
- The summary and careers must be supportive and relevant to the student

Generated response JSON:
${JSON.stringify(response, null, 2)}

Return ONLY this JSON shape:
{
  "valid": true | false,
  "reason": ""
}
`;
}

function buildCareerDetailValidationPrompt(
  response: unknown,
  profile: CareerRequestBody["profile"],
  answers: CareerRequestBody["answers"],
  career: CareerOutline,
) {
  return `You are a strict JSON validator for a detailed career-path response.

IMPORTANT:
- Do NOT rewrite the response
- Do NOT add extra commentary
- Return ONLY valid JSON

Student profile:
${JSON.stringify(profile, null, 2)}

Self-assessment responses:
${JSON.stringify(answers, null, 2)}

Selected career:
${JSON.stringify(career, null, 2)}

Validate the generated response below against these rules:
- It must be valid JSON
- It must contain the same career_name and an explanation string
- It must contain a "recommended_courses" array
- Each course must have "course_name", "priority", and "description"
- Each course must contain an "entrance_exams" array
- Each entrance exam must have "exam_name", "priority", "difficulty", and "description"
- Priorities and difficulty values must match the allowed labels
- The suggestions must be relevant to the selected career and profile

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
    const { answers, profile } = (await req.json()) as CareerRequestBody;

    console.log("Profile Details", profile);

    const refinedAnswers = answers.map((ans) => ({
      question: ans.question,
      selected_option: ans.selected_option ?? null,
      selected_text: ans.selected_text,
    }));

    const outlinePrompt = `
You are a friendly and patient career counselling session conductor.

IMPORTANT:
- Do NOT search the web
- Do NOT reference existing articles
- Generate original content only

You will be given the student's self-assessment responses and profile information in JSON format.

The JSON contains:
- Student profile:
  - age
  - academic level
  - main interests
- An array of questions and answers

Your task is to carefully analyze the student's choices and infer their:
- Interests
- Strengths
- Learning style
- Work preferences

${buildContext(profile, refinedAnswers)}

Task:
Based on the student profile and responses:

1. First, write a short personality summary (3–5 sentences) describing:
   - Their natural tendencies
   - How they approach learning
   - How they approach problem-solving
   - Their likely work style and preferences
   - Use friendly, encouraging, counselling tone.
   - Use "You", "Dear", or "Friend" to make it personal.

2. Then suggest exactly 5 suitable career options aligned with their personality, interests, and strengths.
3. For each career, provide a short 1–2 sentence explanation.

Guidelines:
- Use friendly and encouraging counselling tone
- Address the student directly using second-person language ("You", "Your")
- Do NOT use third-person phrases like "This student", "This individual", or "The person"
- The personality summary must feel like you are talking directly to the student
- Do NOT make negative statements
- Keep explanations clear and supportive
- Keep this step focused on the career shortlist only

Output format:
Return ONLY valid JSON.

The JSON format must be exactly:

{
  "personality_summary": "",
  "careers": [
    {
      "career_name": "",
      "explanation": ""
    }
  ]
}
`;

    const outlineOutput = (await getValidatedJsonFromGemini(
      outlinePrompt,
      (response) =>
        buildOutlineValidationPrompt(response, profile, refinedAnswers),
      {
        maxOutputTokens: 2048,
        maxAttempts: 3,
      },
    )) as {
      personality_summary?: string;
      careers?: CareerOutline[];
    };

    const careers = Array.isArray(outlineOutput.careers)
      ? outlineOutput.careers.slice(0, 5)
      : [];

    const detailedCareers: CareerDetail[] = [];

    for (const career of careers) {
      const careerPrompt = `
You are a friendly and experienced career counsellor specializing in the Indian education system.

IMPORTANT:
- Do NOT search the web
- Do NOT reference specific universities or external articles
- Generate original content only
- Focus ONLY on India

You will be given:
1. Student profile and self-assessment responses
2. One selected career option

${buildContext(profile, refinedAnswers)}

Selected Career (JSON):
${JSON.stringify(career)}

Your task:
For this one career, generate a detailed list of educational paths the student can pursue.

Instructions:
- Address the student directly using "You" and "Your"
- Maintain a friendly counselling tone
- Include both degree programs and diploma/certification/short-term courses
- Include realistic entrance exams or admission pathways in India
- If a course usually has direct admission path, include "Direct admission based on merit"
- Keep descriptions concise but useful
- Sort courses by priority: High, then Medium, then Low
- For each course, include 3 to 4 relevant admission routes or exams when possible

Output format:
Return ONLY valid JSON.

The JSON format must be exactly:

{
  "career_name": "",
  "explanation": "",
  "recommended_courses": [
    {
      "course_name": "",
      "priority": "High | Medium | Low",
      "description": "",
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

      const detailOutput = (await getValidatedJsonFromGemini(
        careerPrompt,
        (response) =>
          buildCareerDetailValidationPrompt(
            response,
            profile,
            refinedAnswers,
            career,
          ),
        {
          maxOutputTokens: 4096,
          maxAttempts: 3,
        },
      )) as CareerDetail;

      detailedCareers.push({
        career_name:
          typeof detailOutput.career_name === "string"
            ? detailOutput.career_name
            : career.career_name,
        explanation:
          typeof detailOutput.explanation === "string"
            ? detailOutput.explanation
            : career.explanation,
        recommended_courses: Array.isArray(detailOutput.recommended_courses)
          ? detailOutput.recommended_courses
          : [],
      });
    }

    const aiOutput = {
      personality_summary:
        typeof outlineOutput.personality_summary === "string"
          ? outlineOutput.personality_summary
          : "",
      careers: detailedCareers,
    };

    console.log("Response", aiOutput);

    return NextResponse.json(aiOutput, { status: 200 });
  } catch (error: unknown) {
    const timeout = isTimeoutError(error);
    const quotaExhausted = isQuotaError(error);
    console.error("FULL ERROR:", error);

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
