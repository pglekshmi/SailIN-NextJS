import { NextResponse } from "next/server";
import { getQuotaStatus } from "../_lib/gemini";

export async function GET() {
  const quota = getQuotaStatus();

  if (quota.exhausted) {
    return NextResponse.json(
      {
        quotaAvailable: false,
        errorCode: "quota_exhausted",
        message:
          "Gemini free-tier quota appears exhausted. Please wait for reset or upgrade billing.",
        details: quota.lastErrorMessage,
        lastDetectedAt: quota.lastErrorAt,
      },
      { status: 200 },
    );
  }

  return NextResponse.json(
    {
      quotaAvailable: true,
      errorCode: null,
      message: "Quota looks available based on recent API calls.",
      details: null,
      lastDetectedAt: null,
    },
    { status: 200 },
  );
}
