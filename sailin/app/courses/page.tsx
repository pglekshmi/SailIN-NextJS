"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SailINLogo } from "../../components/SailINLogo";

type Difficulty = "Easy" | "Medium" | "Hard";

type EntranceExam = {
  exam_name: string;
  priority: "High" | "Medium" | "Low";
  difficulty: Difficulty;
  description: string;
};

type Course = {
  course_name: string;
  priority: "High" | "Medium" | "Low";
  description: string;
  entrance_exams: EntranceExam[];
};

type CareerPath = {
  career_name: string;
  recommended_courses: Course[];
};

const PRIORITY_ORDER: Record<string, number> = {
  High: 1,
  Medium: 2,
  Low: 3,
};

const PRIORITY_COLORS: Record<
  string,
  { bg: string; border: string; badge: string }
> = {
  High: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    badge: "bg-emerald-500",
  },
  Medium: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    badge: "bg-amber-500",
  },
  Low: {
    bg: "bg-slate-50",
    border: "border-slate-200",
    badge: "bg-slate-500",
  },
};

export default function CoursesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [careerPaths, setCareerPaths] = useState<CareerPath[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const raw = searchParams.get("data");
    const storedRaw =
      typeof window !== "undefined"
        ? sessionStorage.getItem("sailin-selected-career-data")
        : null;

    const parsePayload = (value: string | null) => {
      if (!value) return [] as CareerPath[];

      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? (parsed as CareerPath[]) : [];
      } catch {
        try {
          const decoded = decodeURIComponent(value);
          const parsed = JSON.parse(decoded);
          return Array.isArray(parsed) ? (parsed as CareerPath[]) : [];
        } catch {
          return [] as CareerPath[];
        }
      }
    };

    setCareerPaths(raw ? parsePayload(raw) : parsePayload(storedRaw));
    setIsHydrated(true);
  }, [searchParams]);

  const sortedCareerPaths = useMemo(() => {
    return careerPaths.map((career) => ({
      ...career,
      recommended_courses: [...career.recommended_courses].sort(
        (a, b) =>
          (PRIORITY_ORDER[a.priority] ?? 99) -
          (PRIORITY_ORDER[b.priority] ?? 99),
      ),
    }));
  }, [careerPaths]);

  const handleCourseClick = (course: Course) => {
    const payload = {
      course_entrance_mapping: [
        {
          course_name: course.course_name,
          entrance_exams: course.entrance_exams ?? [],
        },
      ],
    };

    sessionStorage.setItem(
      "sailin-selected-course-data",
      JSON.stringify(payload),
    );

    router.push("/admission");
  };

  return (
    <div
      className="min-h-screen px-4 py-12"
      style={{
        background:
          "linear-gradient(135deg, #f8fbff 0%, #edf6ff 50%, #fdfcff 100%)",
      }}
    >
      <div className="max-w-5xl mx-auto flex flex-col gap-10">
        {/* Header */}
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <SailINLogo size={52} />
          </div>
          <h1
            className="text-5xl font-extrabold mb-3 bg-clip-text text-transparent"
            style={{
              backgroundImage: "linear-gradient(90deg, #0284c7, #8b5cf6)",
            }}
          >
            Recommended Courses
          </h1>
          <p className="text-slate-500 text-base">
            Tailored learning paths to succeed in your chosen career
          </p>
        </div>

        {/* Career Sections */}
        {!isHydrated ? (
          <div className="text-center text-slate-600 py-12">
            Loading course recommendations...
          </div>
        ) : sortedCareerPaths.length === 0 ? (
          <div className="text-center text-slate-600 py-12">
            <p>
              No courses found. Complete the assessment to view recommendations.
            </p>
          </div>
        ) : (
          <>
            {sortedCareerPaths.map((careerPath, careerIndex) => (
              <div
                key={`${careerPath.career_name}-${careerIndex}`}
                className="space-y-6"
              >
                {/* Career Title */}
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 flex items-center justify-center rounded-lg text-lg font-bold text-white shrink-0"
                    style={{
                      background: "linear-gradient(135deg, #38bdf8, #8b5cf6)",
                      boxShadow: "0 0 20px rgba(59,130,246,0.18)",
                    }}
                  >
                    {careerIndex + 1}
                  </div>
                  <h2
                    className="text-3xl font-bold bg-clip-text text-transparent"
                    style={{
                      backgroundImage:
                        "linear-gradient(90deg, #0284c7, #8b5cf6)",
                    }}
                  >
                    {careerPath.career_name}
                  </h2>
                </div>

                {/* Priority Groups */}
                <div className="space-y-4">
                  {Array.from(
                    new Set(
                      careerPath.recommended_courses.map((c) => c.priority),
                    ),
                  )
                    .sort(
                      (a, b) =>
                        (PRIORITY_ORDER[a] ?? 99) - (PRIORITY_ORDER[b] ?? 99),
                    )
                    .map((priority) => {
                      const coursesInPriority =
                        careerPath.recommended_courses.filter(
                          (c) => c.priority === priority,
                        );

                      return (
                        <div
                          key={`${careerPath.career_name}-${priority}`}
                          className="space-y-3"
                        >
                          {/* Priority Label */}
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-3 h-3 rounded-full ${PRIORITY_COLORS[priority].badge}`}
                            />
                            <h3 className="text-slate-800 font-semibold text-lg">
                              {priority} Priority
                            </h3>
                            <span className="text-slate-500 text-sm ml-2">
                              ({coursesInPriority.length} courses)
                            </span>
                          </div>

                          {/* Course Cards */}
                          <div className="grid gap-3">
                            {coursesInPriority.map((course, index) => (
                              <button
                                type="button"
                                key={`${course.course_name}-${index}`}
                                onClick={() => handleCourseClick(course)}
                                className={`
                              w-full text-left rounded-xl border-2 p-5 transition-all duration-300
                              hover:shadow-lg hover:-translate-y-1
                              ${PRIORITY_COLORS[priority].bg}
                              ${PRIORITY_COLORS[priority].border}
                            `}
                                style={{
                                  backdropFilter: "blur(10px)",
                                }}
                              >
                                <div className="flex items-start gap-4">
                                  {/* Badge */}
                                  <div
                                    className={`w-10 h-10 flex items-center justify-center rounded-lg text-white font-bold text-sm shrink-0 mt-0.5
                                  ${PRIORITY_COLORS[priority].badge}
                                `}
                                  >
                                    {priority[0]}
                                  </div>

                                  {/* Content */}
                                  <div className="flex-1 min-w-0">
                                    <h4 className="text-slate-900 font-bold text-lg mb-2 leading-snug">
                                      {course.course_name}
                                    </h4>
                                    <p className="text-slate-600 text-sm leading-relaxed">
                                      {course.description}
                                    </p>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* Divider */}
                {careerIndex < sortedCareerPaths.length - 1 && (
                  <hr className="border-slate-200 my-8" />
                )}
              </div>
            ))}
          </>
        )}

        {/* Footer CTA */}
        {/* <div className="mt-6 text-center">
          <p className="text-slate-500 text-sm">
            Want to explore other career paths?{" "}
            <a
              href="/assessment"
              className="text-sky-600 hover:text-sky-500 font-semibold transition"
            >
              Retake the assessment
            </a>
          </p>
        </div> */}
      </div>
    </div>
  );
}
