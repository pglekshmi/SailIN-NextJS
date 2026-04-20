"use client";

import { useEffect, useState, type ChangeEvent, type SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "../context/profileContext";
import { SailINLogo } from "../../components/SailINLogo";

export default function Assessment() {
  const router = useRouter();

  const { profile, setProfile, questions, setQuestions } = useProfile();

  const questionList = questions.questions;

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFinishing, setIsFinishing] = useState(false);

  const currentQuestion = questionList[currentIndex];

  const handleNext = async () => {
    if (isFinishing) return;

    if (currentIndex < questionList.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      return;
    }

    const payloadAnswers = questionList.map((q) => ({
      question: q.question,
      selected_option:
        q.selectedOption === "" ? null : Number(q.selectedOption),
      selected_text: q.selectedText,
    }));

    console.log(payloadAnswers);

    setIsFinishing(true);

    try {
      const quotaResponse = await fetch("/api/quota-check", {
        cache: "no-store",
      });
      const quotaData = await quotaResponse.json();

      if (quotaData?.quotaAvailable === false) {
        router.push("/careers?error=quota_exhausted");
        return;
      }

      const response = await fetch("/api/getCareers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: payloadAnswers, profile }),
      });

      if (response.status === 429) {
        router.push("/careers?error=quota_exhausted");
        return;
      }

      if (response.status === 503) {
        router.push("/careers?error=server_not_responding");
        return;
      }

      const data = await response.json();
      console.log("Career Response", data);

      if (!response.ok) {
        if (data?.errorCode === "quota_exhausted") {
          router.push("/careers?error=quota_exhausted");
          return;
        }

        router.push("/careers?error=failed_to_fetch_careers");
        return;
      }

      const careersPayload = data.careers ?? [];
      const personalityPayload = data.personality_summary ?? "";

      sessionStorage.setItem(
        "sailin-careers-data",
        JSON.stringify(careersPayload),
      );
      sessionStorage.setItem(
        "sailin-personality-summary",
        JSON.stringify(personalityPayload),
      );

      router.push("/careers");
    } catch (error) {
      console.error("Failed to fetch careers", error);
      router.push("/careers?error=server_not_responding");
    } finally {
      setIsFinishing(false);
    }
  };

  const handleAnswer = (option: number, text: string) => {
    setQuestions((prev) => ({
      ...prev,
      questions: prev.questions.map((q, index) =>
        index === currentIndex
          ? { ...q, selectedOption: String(option), selectedText: text }
          : q,
      ),
    }));
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex((prev) => prev - 1);
  };

  if (!questionList.length || !currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-700">
        Loading assessment...
      </div>
    );
  }

  const selectedOption =
    currentQuestion.selectedOption === ""
      ? null
      : Number(currentQuestion.selectedOption);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-10"
      style={{
        background: "linear-gradient(135deg, #f8fbff 0%, #edf6ff 100%)",
      }}
    >
      {/* Subtitle */}
      <p
        className="text-slate-700 text-3xl font-bold mb-8 tracking-wide text-center"
        style={{ fontFamily: "'Georgia', serif", fontStyle: "italic" }}
      >
        Take a deep breath and explore yourself !!!
      </p>

      {/* Card */}
      <div
        className="w-full max-w-6xl bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200"
        style={{ minHeight: "600px", display: "flex", flexDirection: "column" }}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <SailINLogo size={34} showText={false} />
            <span className="text-slate-700 font-semibold text-base">
              Career Assessment
            </span>
          </div>
          <div className="flex items-center gap-3">
            {/* Circle indicator */}
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
              style={{
                background: "linear-gradient(135deg, #38bdf8, #8b5cf6)",
              }}
            >
              {currentIndex + 1}
            </div>
            <span className="text-slate-500 font-medium text-sm">
              {currentIndex + 1} of {questionList.length}
            </span>
          </div>
        </div>

        {/* Question */}
        <div className="px-10 pt-12 pb-8 text-center flex-1 flex flex-col justify-center">
          <p className="text-slate-800 text-2xl font-semibold leading-relaxed max-w-2xl mx-auto">
            {currentQuestion.question}
          </p>
        </div>

        {/* Options — 2×2 grid */}
        <div className="grid grid-cols-2 gap-4 px-10 pb-10">
          {currentQuestion.options.map((opt, index) => {
            const isSelected = selectedOption === index;
            const letters = ["A", "B", "C", "D"];
            return (
              <button
                key={index}
                onClick={() => handleAnswer(index, opt)}
                className={`flex items-center gap-4 py-5 px-5 rounded-2xl border-2 transition-all duration-200 cursor-pointer text-left group
          ${
            isSelected
              ? "border-transparent shadow-lg"
              : "bg-slate-50 border-slate-200 hover:border-sky-300 hover:bg-sky-50 hover:shadow-md"
          }`}
                style={
                  isSelected
                    ? {
                        background: "linear-gradient(135deg, #38bdf8, #8b5cf6)",
                      }
                    : {}
                }
              >
                <span
                  className={`w-9 h-9 flex-shrink-0 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200
            ${
              isSelected
                ? "bg-white/20 text-white"
                : "bg-sky-100 text-sky-700 group-hover:bg-sky-200"
            }`}
                >
                  {letters[index]}
                </span>

                <span className="text-slate-800 font-medium">{opt}</span>
              </button>
            );
          })}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center px-8 py-4 border-t border-gray-100">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0 || isFinishing}
            className="px-6 py-2 rounded-full text-sm font-semibold text-sky-700 border border-sky-200 hover:bg-sky-50 transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            ← Previous
          </button>
          <button
            onClick={handleNext}
            disabled={isFinishing}
            className="px-8 py-2 rounded-full text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background: "linear-gradient(135deg, #38bdf8, #8b5cf6)",
              boxShadow: "0 4px 14px rgba(59,130,246,0.22)",
            }}
          >
            {isFinishing ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-white/60 border-t-white rounded-full animate-spin" />
                Loading...
              </span>
            ) : currentIndex === questionList.length - 1 ? (
              "Finish ✓"
            ) : (
              "Next →"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
