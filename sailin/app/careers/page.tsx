"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SailINLogo } from "../../components/SailINLogo";
type Priority = "High" | "Medium" | "Low";
type Difficulty = "Easy" | "Medium" | "Hard";

type EntranceExam = {
  exam_name: string;
  priority: Priority;
  difficulty: Difficulty;
  description: string;
};

type Course = {
  course_name: string;
  priority: Priority;
  description: string;
  entrance_exams: EntranceExam[];
};

type Career = {
  career_name: string;
  explanation: string;
  recommended_courses: Course[];
};

export default function CareerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [careers, setCareers] = useState<Career[]>([]);
  const [personalitySummary, setPersonalitySummary] = useState(
    "No personality summary available.",
  );
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const parseStoredArray = (raw: string | null) => {
      if (!raw) return [] as Career[];

      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? (parsed as Career[]) : [];
      } catch {
        try {
          const decoded = decodeURIComponent(raw);
          const parsed = JSON.parse(decoded);
          return Array.isArray(parsed) ? (parsed as Career[]) : [];
        } catch {
          return [] as Career[];
        }
      }
    };

    const parseStoredString = (raw: string | null) => {
      if (!raw) return "No personality summary available.";

      try {
        const parsed = JSON.parse(raw);
        return typeof parsed === "string" ? parsed : String(parsed);
      } catch {
        try {
          const decoded = decodeURIComponent(raw);
          const parsed = JSON.parse(decoded);
          return typeof parsed === "string" ? parsed : String(parsed);
        } catch {
          return raw;
        }
      }
    };

    const urlData = searchParams.get("data");
    const urlPersonality = searchParams.get("personality");

    const storedCareers =
      typeof window !== "undefined"
        ? sessionStorage.getItem("sailin-careers-data")
        : null;
    const storedPersonality =
      typeof window !== "undefined"
        ? sessionStorage.getItem("sailin-personality-summary")
        : null;

    setCareers(
      urlData ? parseStoredArray(urlData) : parseStoredArray(storedCareers),
    );
    setPersonalitySummary(
      urlPersonality
        ? parseStoredString(urlPersonality)
        : parseStoredString(storedPersonality),
    );
    setIsHydrated(true);
  }, [searchParams]);

  const initialPageError = useMemo(() => {
    const errorCode = searchParams.get("error");

    if (errorCode === "quota_exhausted") {
      return "Gemini free-tier quota is exhausted. Please wait for reset or enable billing.";
    }

    if (errorCode === "server_not_responding") {
      return "Server not responding";
    }

    if (errorCode === "failed_to_fetch_careers") {
      return "Unable to load careers right now. Please try again.";
    }

    return null;
  }, [searchParams]);

  // const profile1 = useMemo<Profile | null>(() => {
  //   const ageParam = searchParams.get("age");
  //   const levelParam = searchParams.get("level");
  //   const interestsParam = searchParams.get("interests");

  //   if (!ageParam || !levelParam) return null;

  //   return {
  //     age: ageParam,
  //     level: levelParam,
  //     interests: interestsParam ? JSON.parse(decodeURIComponent(interestsParam)) : undefined,
  //   };
  // }, [searchParams]);

  const handleCareerClick = (career: Career) => {
    setError(null);
    const payload = [
      {
        career_name: career.career_name,
        recommended_courses: career.recommended_courses ?? [],
      },
    ];

    sessionStorage.setItem(
      "sailin-selected-career-data",
      JSON.stringify(payload),
    );

    router.push("/courses");
  };

  return (
    <div
      className="min-h-screen px-4 py-12"
      style={{
        background:
          "linear-gradient(135deg, #f8fbff 0%, #edf6ff 50%, #fdfcff 100%)",
      }}
    >
      <div className="max-w-6xl mx-auto flex flex-col gap-10">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <SailINLogo size={52} />
          </div>
          <h1
            className="text-4xl font-extrabold mb-2 bg-clip-text text-transparent"
            style={{
              backgroundImage: "linear-gradient(90deg, #0284c7, #8b5cf6)",
            }}
          >
            Your Career Paths
          </h1>
          <p className="text-slate-500 text-sm">
            Based on your personality and interests ✨
          </p>
        </div>

        <div
          className="rounded-2xl border border-slate-200 p-6 shadow-lg"
          style={{
            background: "rgba(255,255,255,0.9)",
            backdropFilter: "blur(18px)",
          }}
        >
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest mb-3">
            Your Profile Summary
          </p>
          <p className="text-slate-700 text-base leading-relaxed">
            {personalitySummary}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(initialPageError || error) && (
            <div className="col-span-full rounded-2xl border border-red-200 p-4 bg-red-50">
              <p className="text-red-600 text-sm">
                {initialPageError ?? error}
              </p>
            </div>
          )}
          {!isHydrated ? (
            <div className="text-slate-600">
              Loading your career recommendations...
            </div>
          ) : careers.length === 0 ? (
            <div className="text-slate-600">No careers found.</div>
          ) : (
            careers.map((career, index) => (
              <button
                key={`${career.career_name}-${index}`}
                onClick={() => handleCareerClick(career)}
                className="rounded-2xl border border-slate-200 p-6 shadow-lg flex flex-col gap-3 transition-all duration-300 hover:-translate-y-1 hover:border-sky-300 disabled:opacity-50 disabled:cursor-not-allowed text-left"
                style={{
                  background: "rgba(255,255,255,0.9)",
                  backdropFilter: "blur(18px)",
                }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold text-white shrink-0"
                    style={{
                      background: "linear-gradient(135deg, #38bdf8, #8b5cf6)",
                      boxShadow: "0 0 14px rgba(59,130,246,0.2)",
                    }}
                  >
                    {index + 1}
                  </span>
                  <h2
                    className="text-lg font-bold bg-clip-text text-transparent"
                    style={{
                      backgroundImage:
                        "linear-gradient(90deg, #0284c7, #8b5cf6)",
                    }}
                  >
                    {career.career_name}
                  </h2>
                </div>

                <hr className="border-slate-200" />

                <p className="text-slate-600 text-sm leading-relaxed">
                  {career.explanation}
                </p>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
