"use client";

import { useEffect, useState, type ChangeEvent, type SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "../context/profileContext";
import { SailINLogo } from "../../components/SailINLogo";

export default function Profile() {
  // const [responseData, setResponseData] = useState<unknown>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { profile, setProfile, questions, setQuestions } = useProfile();

  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    const checkQuota = async () => {
      try {
        const quotaResponse = await fetch("/api/quota-check", {
          cache: "no-store",
        });

        const quotaData = await quotaResponse.json();

        if (!cancelled && quotaData?.quotaAvailable === false) {
          setErrorMessage(
            "Gemini free-tier quota is currently exhausted. Please wait for quota reset or enable billing.",
          );
        }
      } catch {
        // Ignore quota pre-check failures; main request will still handle errors.
      }
    };

    void checkQuota();

    return () => {
      cancelled = true;
    };
  }, []);

  const interestOptions = [
    "Programming / Coding",
    "Problem Solving",
    "Research / Learning",
    "Data Analysis / AI",
    "Design / UI/UX",
    "Writing / Content Creation",
    "Music / Arts",
    "Teaching / Mentoring",
    "Social Work",
    "Entrepreneurship",
    "Leadership / Management",
    "Finance / Investing",
    "Accounting / Economics",
    "Law / Legal Studies",
    "Government / Public Service",
    "Medicine / Healthcare",
    "Psychology / Human Behavior",
    "Engineering / Core Sciences",
    "Gaming / Game Development",
    "Sports / Fitness",
    "Media / Communication",
    "Travel / Hospitality",
    "Skilled Trades / Technical Work",
  ];

  const educationLevels = [
    { value: "10th", label: "10th" },
    { value: "12th", label: "12th" },
    { value: "diploma", label: "Diploma" },
    { value: "degree", label: "Degree" },
    { value: "pg", label: "Postgraduate" },
    { value: "phd", label: "PhD" },
  ];

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleInterestToggle = (interest: string) => {
    setProfile((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log(profile);
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/getProfile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profile.name,
          age: profile.age,
          level: profile.level,
          interests: profile.interests,
        }),
      });

      console.log("Response", response);

      const data = await response.json();

      if (response.status === 429 || data?.errorCode === "quota_exhausted") {
        setErrorMessage(
          "Gemini free-tier quota is exhausted. Please wait for reset or upgrade billing.",
        );
        return;
      }

      if (response.ok) {
        console.log(data);
        setQuestions({
          questions: data.questions.map((q: any) => ({
            question: q.question,
            options: q.options,
            selectedOption: "",
            selectedText: "",
          })),
        });

        router.push("/assessment");
      } else {
        console.error("Submission failed");
        setErrorMessage(
          data?.message ?? "Failed to generate profile questions.",
        );
      }
    } catch (error) {
      console.error("Submission failed", error);
      setErrorMessage("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{
        background:
          "linear-gradient(135deg, #f8fbff 0%, #edf6ff 50%, #fdfcff 100%)",
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-6xl flex flex-col gap-8 rounded-3xl border border-slate-200 p-8 md:p-12 shadow-xl"
        style={{
          background: "rgba(255,255,255,0.9)",
          backdropFilter: "blur(20px)",
        }}
      >
        {/* Header */}
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
            Can I Know You Better?
          </h1>
          <p className="text-slate-500 text-sm">
            Help us personalise your career journey ✨
          </p>
        </div>

        <hr className="border-slate-200" />

        {/* Name & Age */}
        <div className="flex gap-4 flex-wrap">
          <input
            type="text"
            name="name"
            placeholder="Your Name"
            value={profile.name}
            onChange={handleChange}
            className="flex-1 min-w-[180px] bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl px-4 py-3 outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition"
          />
          <input
            type="number"
            name="age"
            placeholder="Age"
            value={profile.age}
            onChange={handleChange}
            className="w-28 bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl px-4 py-3 outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition"
          />
        </div>

        {/* Education Level */}
        <div>
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest mb-3">
            Highest Education Level
          </p>
          <div className="flex flex-wrap gap-2">
            {educationLevels.map(({ value, label }) => (
              <button
                type="button"
                key={value}
                onClick={() =>
                  setProfile((prev) => ({ ...prev, level: value }))
                }
                className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all duration-200 cursor-pointer ${
                  profile.level === value
                    ? "text-white border-transparent"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-sky-50 hover:text-sky-700"
                }`}
                style={
                  profile.level === value
                    ? {
                        background: "linear-gradient(135deg, #38bdf8, #8b5cf6)",
                        boxShadow: "0 0 16px rgba(59,130,246,0.25)",
                      }
                    : {}
                }
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Interests */}
        <div>
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest mb-3">
            What interests you the most?
          </p>
          <div className="flex flex-wrap gap-2">
            {interestOptions.map((interest) => {
              const selected = profile.interests.includes(interest);
              return (
                <button
                  type="button"
                  key={interest}
                  onClick={() => handleInterestToggle(interest)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 cursor-pointer ${
                    selected
                      ? "text-white border-transparent"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-pink-50 hover:text-slate-800"
                  }`}
                  style={
                    selected
                      ? {
                          background:
                            "linear-gradient(135deg, #22c55e, #38bdf8)",
                          boxShadow: "0 0 14px rgba(34,197,94,0.18)",
                        }
                      : {}
                  }
                >
                  {interest}
                </button>
              );
            })}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`mt-2 py-4 rounded-full font-bold text-base tracking-wide text-white transition-all duration-300 ${
            isSubmitting
              ? "opacity-80 cursor-not-allowed"
              : "hover:-translate-y-0.5 cursor-pointer"
          }`}
          style={{
            background: "linear-gradient(135deg, #38bdf8 0%, #8b5cf6 100%)",
            boxShadow: "0 4px 20px rgba(59,130,246,0.18)",
          }}
          onMouseEnter={(e) => {
            if (isSubmitting) return;
            e.currentTarget.style.background =
              "linear-gradient(135deg, #0ea5e9 0%, #7c3aed 100%)";
            e.currentTarget.style.boxShadow = "0 6px 28px rgba(59,130,246,0.3)";
          }}
          onMouseLeave={(e) => {
            if (isSubmitting) return;
            e.currentTarget.style.background =
              "linear-gradient(135deg, #38bdf8 0%, #8b5cf6 100%)";
            e.currentTarget.style.boxShadow =
              "0 4px 20px rgba(59,130,246,0.18)";
          }}
        >
          {isSubmitting ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-4 w-4 border-2 border-white/60 border-t-white rounded-full animate-spin" />
              Loading...
            </span>
          ) : (
            "Let's Go →"
          )}
        </button>

        {errorMessage ? (
          <p className="text-center text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            {errorMessage}
          </p>
        ) : null}
      </form>
    </div>
  );
}
