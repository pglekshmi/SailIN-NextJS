"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SailINLogo } from "../../components/SailINLogo";

type Priority = "High" | "Medium" | "Low";
type Difficulty = "Easy" | "Medium" | "Hard";

type EntranceExam = {
  exam_name: string;
  priority: Priority;
  difficulty: Difficulty;
  description: string;
};

type CourseEntranceMapping = {
  course_name: string;
  entrance_exams: EntranceExam[];
};

type AdmissionPayload = {
  course_entrance_mapping: CourseEntranceMapping[];
};

const PRIORITY_ORDER: Record<Priority, number> = {
  High: 1,
  Medium: 2,
  Low: 3,
};

const PRIORITY_STYLES: Record<Priority, string> = {
  High: "border-emerald-400/40 bg-emerald-500/10",
  Medium: "border-amber-400/40 bg-amber-500/10",
  Low: "border-slate-400/40 bg-slate-500/10",
};

const DIFFICULTY_STYLES: Record<Difficulty, string> = {
  Easy: "bg-emerald-500/20 text-emerald-200 border-emerald-400/30",
  Medium: "bg-amber-500/20 text-amber-200 border-amber-400/30",
  Hard: "bg-rose-500/20 text-rose-200 border-rose-400/30",
};

function parsePayload(raw: string | null): AdmissionPayload {
  if (!raw) return { course_entrance_mapping: [] };

  try {
    const decoded = decodeURIComponent(raw);
    const parsed = JSON.parse(decoded) as AdmissionPayload;
    return parsed?.course_entrance_mapping
      ? parsed
      : { course_entrance_mapping: [] };
  } catch {
    try {
      const parsed = JSON.parse(raw) as AdmissionPayload;
      return parsed?.course_entrance_mapping
        ? parsed
        : { course_entrance_mapping: [] };
    } catch {
      return { course_entrance_mapping: [] };
    }
  }
}

export default function AdmissionPage() {
  const searchParams = useSearchParams();
  const [mapping, setMapping] = useState<CourseEntranceMapping[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const raw = searchParams.get("data");
    const storedRaw =
      typeof window !== "undefined"
        ? sessionStorage.getItem("sailin-selected-course-data")
        : null;

    const payload = parsePayload(raw ?? storedRaw);
    setMapping(payload.course_entrance_mapping ?? []);
    setIsHydrated(true);
  }, [searchParams]);

  return (
    <div
      className="min-h-screen px-4 py-12"
      style={{
        background:
          "linear-gradient(135deg, #f8fbff 0%, #edf6ff 50%, #fdfcff 100%)",
      }}
    >
      <div className="max-w-6xl mx-auto flex flex-col gap-8">
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
            Entrance Exams by Priority
          </h1>
          <p className="text-slate-500 text-sm">
            Course-wise entrance exams with priority and difficulty
          </p>
        </div>

        {!isHydrated ? (
          <div className="rounded-2xl border border-slate-200 p-6 text-slate-600 bg-white shadow-sm">
            Loading admission pathways...
          </div>
        ) : mapping.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 p-6 text-slate-600 bg-white shadow-sm">
            No entrance exam data found.
          </div>
        ) : (
          mapping.map((course, courseIndex) => {
            const sortedExams = [...course.entrance_exams].sort(
              (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority],
            );

            return (
              <section
                key={`${course.course_name}-${courseIndex}`}
                className="rounded-2xl border border-slate-200 p-6 shadow-lg bg-white"
                style={{
                  backdropFilter: "blur(16px)",
                }}
              >
                <h2 className="text-2xl font-bold text-slate-900 mb-5">
                  {course.course_name}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sortedExams.map((exam, index) => (
                    <div
                      key={`${exam.exam_name}-${index}`}
                      className={`rounded-xl border p-4 ${PRIORITY_STYLES[exam.priority]}`}
                    >
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className="text-xs font-semibold px-2 py-1 rounded-md bg-white text-slate-700 border border-slate-200">
                          {exam.priority} Priority
                        </span>
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded-md border ${DIFFICULTY_STYLES[exam.difficulty]}`}
                        >
                          {exam.difficulty}
                        </span>
                      </div>

                      <h3 className="text-slate-900 font-semibold text-base mb-2">
                        {exam.exam_name}
                      </h3>
                      <p className="text-slate-600 text-sm leading-relaxed">
                        {exam.description}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            );
          })
        )}
      </div>
    </div>
  );
}
