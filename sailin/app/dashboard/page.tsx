"use client";

import { useRouter } from "next/navigation";
import { SailINLogo } from "../../components/SailINLogo";

const features = [
  {
    icon: "🎯",
    title: "AI Career Assessment",
    description: "Get personalized insights about your strengths",
    gradient: "from-cyan-400 to-blue-500",
  },
  {
    icon: "📚",
    title: "Learning Paths",
    description: "Curated courses to develop your skills",
    gradient: "from-sky-400 to-cyan-400",
  },
  {
    icon: "💼",
    title: "Job Matching",
    description: "Find roles that align with your goals",
    gradient: "from-emerald-400 to-cyan-400",
  },
];

const stats = [
  { number: "10K+", label: "Active Users" },
  { number: "500+", label: "Career Paths" },
  { number: "95%", label: "Success Rate" },
];

export default function DashboardPage() {
  const router = useRouter();

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section
        className="min-h-[50vh] flex items-center justify-center text-center px-8 py-16"
        style={{
          background: "linear-gradient(135deg, #f8fbff 0%, #e8f2ff 100%)",
        }}
      >
        <div className="max-w-2xl flex flex-col items-center gap-6">
          <SailINLogo size={52} />
          <h2 className="text-5xl md:text-6xl font-extrabold leading-tight">
            <span
              className="block bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(90deg, #0284c7 0%, #7c3aed 55%, #0f766e 100%)",
              }}
            >
              SailIN
            </span>
            <span className="block mt-2 text-3xl md:text-4xl font-semibold text-slate-700">
              Navigate Your Career Path with AI
            </span>
          </h2>
          <p className="text-lg md:text-xl text-slate-600 max-w-lg">
            SailIN helps you discover opportunities and make informed career
            decisions
          </p>
          <button
            onClick={() => router.push("/profile")}
            className="mt-2 px-10 py-4 rounded-full font-bold text-lg text-white cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            style={{
              background: "linear-gradient(135deg, #38bdf8 0%, #2563eb 100%)",
              boxShadow: "0 4px 20px rgba(37,99,235,0.2)",
            }}
          >
            Get Started →
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section
        className="py-20 px-8"
        style={{
          background: "linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%)",
        }}
      >
        <h3 className="text-center text-3xl font-bold text-slate-900 mb-12">
          Everything You Need to Succeed
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
          {features.map((feature, i) => (
            <div
              key={i}
              className="bg-white p-14 rounded-3xl text-slate-800 cursor-pointer shadow-lg border border-slate-200 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl flex flex-col justify-center"
            >
              <span className="text-6xl block mb-6">{feature.icon}</span>
              <h3 className="text-2xl font-bold mb-3 text-slate-900">
                {feature.title}
              </h3>
              <p className="leading-relaxed text-slate-600 text-lg">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section
        className="py-20 px-8 text-center"
        style={{
          background: "linear-gradient(135deg, #eef6ff 0%, #f8fbff 100%)",
        }}
      >
        <h3 className="text-4xl font-bold mb-14 text-slate-900">
          Join Thousands of Career Builders
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="rounded-2xl py-8 px-6 bg-white border border-slate-200 shadow-md"
              style={{
                backdropFilter: "blur(10px)",
              }}
            >
              <div
                className="text-5xl font-extrabold mb-2 bg-clip-text text-transparent"
                style={{
                  backgroundImage: "linear-gradient(135deg, #0ea5e9, #8b5cf6)",
                }}
              >
                {stat.number}
              </div>
              <div className="text-lg text-slate-600">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section
        className="py-20 px-8 text-center"
        style={{
          background: "linear-gradient(135deg, #f8fbff 0%, #eef6ff 100%)",
        }}
      >
        <h3 className="text-4xl font-bold mb-4 text-slate-900">
          Ready to Transform Your Career?
        </h3>
        <p className="text-lg text-slate-600 max-w-md mx-auto mb-10">
          Start your journey with SailIN today and unlock your potential
        </p>
        <button
          onClick={() => router.push("/profile")}
          className="px-12 py-4 rounded-full font-bold text-lg text-white cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
          style={{
            background: "linear-gradient(135deg, #38bdf8 0%, #8b5cf6 100%)",
            boxShadow: "0 4px 20px rgba(59,130,246,0.2)",
          }}
        >
          Get Started Now →
        </button>
      </section>
    </div>
  );
}

export function HomeFeatures() {
  return null;
}
