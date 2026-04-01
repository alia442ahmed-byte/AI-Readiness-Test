/* Home.tsx — AI Readiness Assessment
   Design: Executive Clarity (Dark Slate + Electric Blue)
   Steps: Landing → Quiz (5 questions) → Lead Capture → Results
   Typography: Sora (headlines) + Inter (body)
   Animations: framer-motion crossfade + upward drift between steps
   Data: Lead submissions persisted via tRPC → MySQL database */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ScoreGauge from "@/components/ScoreGauge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Zap,
  BarChart3,
  Clock,
  Users,
  Shield,
  TrendingUp,
  AlertTriangle,
  Star,
  Calendar,
  Phone,
} from "lucide-react";

// ─── Data ───────────────────────────────────────────────────────────────────

const HERO_BG =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663069092736/YwijKcfsBhBYHHbAY43m2f/hero-bg-ktC93GGD67gSFA5PwNnKnB.webp";
const SCORE_BG =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663069092736/YwijKcfsBhBYHHbAY43m2f/score-bg-Anw3vyrMZhtfkxSkCNgd4J.webp";

const QUESTIONS = [
  {
    id: 1,
    icon: <BarChart3 className="w-6 h-6" />,
    text: "How does your team currently handle data transfer between your CRM, email, and operational software?",
    context: "Data integration is the #1 driver of operational efficiency.",
    answers: [
      { label: "A", text: "Completely manual — we re-enter data by hand", points: 1 },
      { label: "B", text: "We use basic templates to speed things up", points: 2 },
      { label: "C", text: "We have some basic Zapier/Make integrations", points: 3 },
      { label: "D", text: "Fully automated data pipelines", points: 4 },
    ],
  },
  {
    id: 2,
    icon: <Clock className="w-6 h-6" />,
    text: "When a new inbound lead or inquiry arrives, how fast is the initial personalized response?",
    context: "Studies show response time within 5 minutes increases conversion by 400%.",
    answers: [
      { label: "A", text: "Usually next business day", points: 1 },
      { label: "B", text: "Within a few hours", points: 2 },
      { label: "C", text: "Within 15 minutes", points: 3 },
      { label: "D", text: "Instantly, 24/7 — automated responses", points: 4 },
    ],
  },
  {
    id: 3,
    icon: <Users className="w-6 h-6" />,
    text: "How much of your administrative staff's week is spent on repetitive tasks (data entry, scheduling, compiling reports)?",
    context: "The average SMB wastes 19 hours per employee per week on automatable tasks.",
    answers: [
      { label: "A", text: "20+ hours — it's a significant burden", points: 1 },
      { label: "B", text: "10–20 hours per week", points: 2 },
      { label: "C", text: "5–10 hours per week", points: 3 },
      { label: "D", text: "Under 5 hours — we're fairly streamlined", points: 4 },
    ],
  },
  {
    id: 4,
    icon: <Zap className="w-6 h-6" />,
    text: "How would you describe your company's current usage of AI tools (like ChatGPT, Claude, etc.)?",
    context: "Companies with formal AI adoption see 2.5x productivity gains within 12 months.",
    answers: [
      { label: "A", text: "We don't use them at all", points: 1 },
      { label: "B", text: "A few employees use them unofficially", points: 2 },
      { label: "C", text: "We have company accounts but no formal training", points: 3 },
      { label: "D", text: "Integrated directly into our daily SOPs", points: 4 },
    ],
  },
  {
    id: 5,
    icon: <TrendingUp className="w-6 h-6" />,
    text: "If you could instantly eliminate one bottleneck in your business today, what would it be?",
    context: "Your answer helps us prioritize your automation roadmap.",
    answers: [
      { label: "A", text: "Administrative overhead eating our time", points: 1 },
      { label: "B", text: "Slow lead response times costing us deals", points: 2 },
      { label: "C", text: "Lack of data visibility for decisions", points: 3 },
      { label: "D", text: "Inconsistent customer support quality", points: 4 },
    ],
  },
];

const LOADING_MESSAGES = [
  "Analyzing your operational workflows...",
  "Benchmarking against industry competitors...",
  "Calculating your automation potential...",
  "Preparing your AI Readiness Report...",
];

// ─── Types ───────────────────────────────────────────────────────────────────

type Step = "landing" | "quiz" | "loading" | "capture" | "results";
type Tier = "high_risk" | "moderate_risk" | "optimized";

interface LeadData {
  name: string;
  email: string;
  company: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function calculateScore(answers: number[]): number {
  const total = answers.reduce((sum, pts) => sum + pts, 0);
  const max = QUESTIONS.length * 4;
  return Math.round((total / max) * 100);
}

function getTier(score: number): Tier {
  if (score <= 40) return "high_risk";
  if (score <= 75) return "moderate_risk";
  return "optimized";
}

function getResultContent(score: number) {
  if (score <= 40) {
    return {
      headline: "Your operations are heavily reliant on manual labor.",
      body: "You are currently losing significant margin to inefficiencies that your competitors are already automating. Every day without action is a day your rivals pull further ahead.",
      urgency: "Critical Action Required",
      urgencyColor: "#EF4444",
      icon: <AlertTriangle className="w-5 h-5" />,
      opportunities: [
        "Automate data entry — save 15+ hrs/week per employee",
        "Deploy 24/7 AI lead response — capture deals you're missing overnight",
        "Build automated reporting dashboards — eliminate weekly report prep",
      ],
    };
  }
  if (score <= 75) {
    return {
      headline: "You have begun adopting technology, but your systems are disconnected.",
      body: "You are leaving massive productivity gains on the table. Your competitors with fully integrated AI workflows are operating at 2–3x your efficiency. The gap is closeable — but the window is narrowing.",
      urgency: "Significant Opportunity",
      urgencyColor: "#F59E0B",
      icon: <TrendingUp className="w-5 h-5" />,
      opportunities: [
        "Connect your siloed tools into unified automation pipelines",
        "Implement AI-powered CRM workflows to accelerate your sales cycle",
        "Deploy intelligent scheduling to eliminate back-and-forth coordination",
      ],
    };
  }
  return {
    headline: "You are ahead of the curve.",
    body: "The next step is deploying custom AI agents to multiply your workforce. You have the foundation — now it's time to build the systems that create compounding returns.",
    urgency: "Ready to Scale",
    urgencyColor: "#3B82F6",
    icon: <Star className="w-5 h-5" />,
    opportunities: [
      "Deploy custom AI agents trained on your business processes",
      "Build predictive analytics to anticipate demand and optimize resources",
      "Create AI-powered customer success workflows for retention at scale",
    ],
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = (current / total) * 100;
  return (
    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
      <motion.div
        className="h-full rounded-full progress-glow"
        style={{ background: "linear-gradient(90deg, #2563EB, #3B82F6)" }}
        initial={{ width: `${((current - 1) / total) * 100}%` }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
    </div>
  );
}

// ─── Steps ────────────────────────────────────────────────────────────────────

function LandingScreen({ onStart }: { onStart: () => void }) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{
        backgroundImage: `url(${HERO_BG})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-slate-950/75" />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-blue-500/20"
            style={{
              width: `${Math.random() * 200 + 100}px`,
              height: `${Math.random() * 200 + 100}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              filter: "blur(60px)",
              animation: `float-up ${3 + i}s ease-in-out infinite alternate`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 text-sm font-medium"
          style={{
            background: "rgba(59,130,246,0.15)",
            border: "1px solid rgba(59,130,246,0.3)",
            color: "#93C5FD",
            fontFamily: "Sora, sans-serif",
          }}
        >
          <Zap className="w-4 h-4" />
          Free AI Readiness Assessment — 2 Minutes
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight mb-6"
          style={{ fontFamily: "Sora, sans-serif", color: "#F8FAFC" }}
        >
          Discover Your Company's{" "}
          <span className="shimmer-text" style={{ fontFamily: "Sora, sans-serif" }}>
            AI Readiness Score
          </span>{" "}
          in 2 Minutes.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-lg md:text-xl mb-10 leading-relaxed"
          style={{ color: "#94A3B8", fontFamily: "Inter, sans-serif" }}
        >
          Find out how much time and profit your team is losing to manual
          workflows — and how you stack up against industry competitors.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.35 }}
        >
          <button
            onClick={onStart}
            className="btn-primary-glow inline-flex items-center gap-3 px-8 py-4 rounded-xl text-white font-semibold text-lg"
            style={{ fontFamily: "Sora, sans-serif" }}
          >
            Start the Assessment
            <ArrowRight className="w-5 h-5" />
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-12 flex flex-wrap justify-center gap-6"
        >
          {[
            { icon: <Shield className="w-4 h-4" />, text: "No credit card required" },
            { icon: <Clock className="w-4 h-4" />, text: "Takes under 2 minutes" },
            { icon: <CheckCircle2 className="w-4 h-4" />, text: "Instant results" },
          ].map((item) => (
            <div key={item.text} className="flex items-center gap-2 text-sm" style={{ color: "#64748B" }}>
              <span style={{ color: "#3B82F6" }}>{item.icon}</span>
              {item.text}
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 flex flex-wrap justify-center gap-3"
        >
          {["Construction", "Manufacturing", "Logistics", "Distribution", "Field Services"].map((industry) => (
            <span
              key={industry}
              className="px-3 py-1 rounded-full text-xs font-medium"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#94A3B8",
              }}
            >
              {industry}
            </span>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

function QuizScreen({ questionIndex, onAnswer }: { questionIndex: number; onAnswer: (points: number) => void }) {
  const [selected, setSelected] = useState<number | null>(null);
  const question = QUESTIONS[questionIndex];
  const total = QUESTIONS.length;

  const handleSelect = (points: number, idx: number) => {
    setSelected(idx);
    setTimeout(() => {
      onAnswer(points);
      setSelected(null);
    }, 420);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#0F172A" }}>
      <div className="fixed top-0 left-0 right-0 z-50 px-0">
        <ProgressBar current={questionIndex + 1} total={total} />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-2xl">
          <motion.div
            key={`counter-${questionIndex}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-between mb-8"
          >
            <span
              className="text-sm font-medium tracking-widest uppercase"
              style={{ color: "#3B82F6", fontFamily: "Sora, sans-serif" }}
            >
              Question {questionIndex + 1} of {total}
            </span>
            <div className="flex gap-1.5">
              {QUESTIONS.map((_, i) => (
                <div
                  key={i}
                  className="h-1.5 rounded-full transition-all duration-300"
                  style={{
                    width: i === questionIndex ? "24px" : "8px",
                    background:
                      i < questionIndex ? "#3B82F6" : i === questionIndex ? "#3B82F6" : "rgba(255,255,255,0.15)",
                  }}
                />
              ))}
            </div>
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div
              key={questionIndex}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.38, ease: "easeOut" }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg" style={{ background: "rgba(59,130,246,0.15)", color: "#3B82F6" }}>
                  {question.icon}
                </div>
                <p className="text-sm" style={{ color: "#64748B", fontFamily: "Inter, sans-serif" }}>
                  {question.context}
                </p>
              </div>

              <h2
                className="text-2xl md:text-3xl font-bold mb-8 leading-snug"
                style={{ fontFamily: "Sora, sans-serif", color: "#F8FAFC" }}
              >
                {question.text}
              </h2>

              <div className="space-y-3">
                {question.answers.map((answer, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelect(answer.points, idx)}
                    className={`answer-card w-full text-left px-5 py-4 rounded-xl flex items-center gap-4 group ${
                      selected === idx ? "selected" : ""
                    }`}
                    disabled={selected !== null}
                  >
                    <span
                      className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-all duration-200"
                      style={{
                        background: selected === idx ? "#3B82F6" : "rgba(255,255,255,0.07)",
                        color: selected === idx ? "#fff" : "#64748B",
                        fontFamily: "Sora, sans-serif",
                      }}
                    >
                      {answer.label}
                    </span>
                    <span
                      className="text-base leading-snug transition-colors duration-200"
                      style={{ color: selected === idx ? "#F8FAFC" : "#CBD5E1", fontFamily: "Inter, sans-serif" }}
                    >
                      {answer.text}
                    </span>
                    <ChevronRight
                      className="ml-auto flex-shrink-0 w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: "#3B82F6" }}
                    />
                  </button>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function LoadingScreen({ onDone }: { onDone: () => void }) {
  const [msgIndex, setMsgIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const msgInterval = setInterval(() => {
      setMsgIndex((prev) => Math.min(prev + 1, LOADING_MESSAGES.length - 1));
    }, 900);
    const progInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progInterval);
          clearInterval(msgInterval);
          setTimeout(onDone, 400);
          return 100;
        }
        return prev + 2.5;
      });
    }, 90);
    return () => {
      clearInterval(msgInterval);
      clearInterval(progInterval);
    };
  }, [onDone]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: "#0F172A" }}>
      <div className="text-center max-w-md px-6">
        <div className="relative flex items-center justify-center mb-10">
          <div
            className="animate-pulse-ring absolute w-24 h-24 rounded-full"
            style={{ background: "rgba(59,130,246,0.15)" }}
          />
          <div
            className="animate-pulse-ring absolute w-24 h-24 rounded-full"
            style={{ background: "rgba(59,130,246,0.1)", animationDelay: "0.5s" }}
          />
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, rgba(37,99,235,0.8), rgba(59,130,246,0.6))",
              boxShadow: "0 0 40px rgba(59,130,246,0.4)",
            }}
          >
            <Zap className="w-8 h-8 text-white" />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.p
            key={msgIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="text-xl font-semibold mb-8"
            style={{ fontFamily: "Sora, sans-serif", color: "#F8FAFC" }}
          >
            {LOADING_MESSAGES[msgIndex]}
          </motion.p>
        </AnimatePresence>

        <div
          className="w-full h-1.5 rounded-full overflow-hidden mb-3"
          style={{ background: "rgba(255,255,255,0.08)" }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{
              background: "linear-gradient(90deg, #2563EB, #3B82F6)",
              boxShadow: "0 0 12px rgba(59,130,246,0.6)",
              width: `${progress}%`,
            }}
            transition={{ duration: 0.1 }}
          />
        </div>
        <p className="text-sm" style={{ color: "#3B82F6", fontFamily: "Inter, sans-serif" }}>
          {Math.round(progress)}% complete
        </p>
      </div>
    </div>
  );
}

function CaptureScreen({
  score,
  answers,
  onSubmit,
}: {
  score: number;
  answers: number[];
  onSubmit: (data: LeadData) => void;
}) {
  const [form, setForm] = useState<LeadData>({ name: "", email: "", company: "" });
  const [errors, setErrors] = useState<Partial<LeadData>>({});

  const submitMutation = trpc.leads.submit.useMutation({
    onSuccess: () => {
      onSubmit(form);
    },
    onError: (err) => {
      toast.error("Something went wrong saving your results. Please try again.", {
        description: err.message,
      });
    },
  });

  const validate = () => {
    const e: Partial<LeadData> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = "Valid work email required";
    if (!form.company.trim()) e.company = "Company name is required";
    return e;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    submitMutation.mutate({
      name: form.name,
      email: form.email,
      company: form.company,
      score,
      tier: getTier(score),
      answers,
    });
  };

  const submitting = submitMutation.isPending;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-16"
      style={{ background: "#0F172A" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="flex justify-center mb-6">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #1D4ED8, #3B82F6)",
              boxShadow: "0 0 32px rgba(59,130,246,0.35)",
            }}
          >
            <BarChart3 className="w-8 h-8 text-white" />
          </div>
        </div>

        <h2
          className="text-3xl font-bold text-center mb-3"
          style={{ fontFamily: "Sora, sans-serif", color: "#F8FAFC" }}
        >
          Your AI Readiness Report is Ready.
        </h2>
        <p className="text-center mb-8 leading-relaxed" style={{ color: "#94A3B8", fontFamily: "Inter, sans-serif" }}>
          Enter your details to see your score and get your customized automation roadmap.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label
              htmlFor="name"
              className="text-sm font-medium mb-1.5 block"
              style={{ color: "#CBD5E1", fontFamily: "Inter, sans-serif" }}
            >
              Full Name
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="John Smith"
              value={form.name}
              onChange={(e) => { setForm({ ...form, name: e.target.value }); setErrors({ ...errors, name: undefined }); }}
              className="h-12 text-base"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: errors.name ? "1px solid #EF4444" : "1px solid rgba(255,255,255,0.1)",
                color: "#F8FAFC",
              }}
            />
            {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
          </div>

          <div>
            <Label
              htmlFor="email"
              className="text-sm font-medium mb-1.5 block"
              style={{ color: "#CBD5E1", fontFamily: "Inter, sans-serif" }}
            >
              Work Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="john@yourcompany.com"
              value={form.email}
              onChange={(e) => { setForm({ ...form, email: e.target.value }); setErrors({ ...errors, email: undefined }); }}
              className="h-12 text-base"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: errors.email ? "1px solid #EF4444" : "1px solid rgba(255,255,255,0.1)",
                color: "#F8FAFC",
              }}
            />
            {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
          </div>

          <div>
            <Label
              htmlFor="company"
              className="text-sm font-medium mb-1.5 block"
              style={{ color: "#CBD5E1", fontFamily: "Inter, sans-serif" }}
            >
              Company Name
            </Label>
            <Input
              id="company"
              type="text"
              placeholder="Acme Construction Inc."
              value={form.company}
              onChange={(e) => { setForm({ ...form, company: e.target.value }); setErrors({ ...errors, company: undefined }); }}
              className="h-12 text-base"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: errors.company ? "1px solid #EF4444" : "1px solid rgba(255,255,255,0.1)",
                color: "#F8FAFC",
              }}
            />
            {errors.company && <p className="mt-1 text-xs text-red-400">{errors.company}</p>}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary-glow w-full rounded-xl text-white font-semibold text-base flex items-center justify-center gap-2 mt-2 py-3.5"
            style={{ fontFamily: "Sora, sans-serif" }}
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving your results...
              </>
            ) : (
              <>
                Reveal My Score
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs mt-5" style={{ color: "#475569", fontFamily: "Inter, sans-serif" }}>
          <Shield className="w-3 h-3 inline mr-1" />
          Your information is 100% secure and never shared.
        </p>
      </motion.div>
    </div>
  );
}

function ResultsScreen({ score, lead, onRestart }: { score: number; lead: LeadData; onRestart: () => void }) {
  const result = getResultContent(score);
  const [showCalendly, setShowCalendly] = useState(false);

  return (
    <div className="min-h-screen" style={{ background: "#0F172A" }}>
      <div
        className="relative py-20 px-4 flex flex-col items-center"
        style={{ backgroundImage: `url(${SCORE_BG})`, backgroundSize: "cover", backgroundPosition: "center" }}
      >
        <div className="absolute inset-0 bg-slate-950/80" />
        <div className="relative z-10 text-center max-w-2xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <p
              className="text-sm font-semibold tracking-widest uppercase mb-6"
              style={{ color: "#3B82F6", fontFamily: "Sora, sans-serif" }}
            >
              {lead.company} · AI Readiness Report
            </p>
            <ScoreGauge score={score} size={280} />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="mt-8"
            >
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 text-sm font-medium"
                style={{
                  background: `${result.urgencyColor}20`,
                  border: `1px solid ${result.urgencyColor}40`,
                  color: result.urgencyColor,
                  fontFamily: "Sora, sans-serif",
                }}
              >
                {result.icon}
                {result.urgency}
              </div>
              <h2
                className="text-2xl md:text-3xl font-bold mb-4 leading-snug"
                style={{ fontFamily: "Sora, sans-serif", color: "#F8FAFC" }}
              >
                {result.headline}
              </h2>
              <p className="text-base leading-relaxed" style={{ color: "#94A3B8", fontFamily: "Inter, sans-serif" }}>
                {result.body}
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-16">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.0, duration: 0.5 }}>
          <h3
            className="text-xl font-bold mb-6"
            style={{ fontFamily: "Sora, sans-serif", color: "#F8FAFC" }}
          >
            Your Top 3 Automation Opportunities
          </h3>
          <div className="space-y-4 mb-12">
            {result.opportunities.map((opp, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.1 + i * 0.12, duration: 0.4 }}
                className="flex items-start gap-4 p-5 rounded-xl"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <div
                  className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                  style={{ background: "rgba(59,130,246,0.2)", color: "#3B82F6", fontFamily: "Sora, sans-serif" }}
                >
                  {i + 1}
                </div>
                <p className="text-base leading-snug pt-1" style={{ color: "#CBD5E1", fontFamily: "Inter, sans-serif" }}>
                  {opp}
                </p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 0.5 }}
            className="rounded-2xl overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(29,78,216,0.2), rgba(59,130,246,0.1))",
              border: "1px solid rgba(59,130,246,0.25)",
            }}
          >
            <div className="p-8 md:p-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg" style={{ background: "rgba(59,130,246,0.2)", color: "#3B82F6" }}>
                  <Calendar className="w-5 h-5" />
                </div>
                <h3
                  className="text-2xl font-bold"
                  style={{ fontFamily: "Sora, sans-serif", color: "#F8FAFC" }}
                >
                  Stop guessing. Let's build your automation roadmap.
                </h3>
              </div>
              <p className="text-base mb-8 leading-relaxed" style={{ color: "#94A3B8", fontFamily: "Inter, sans-serif" }}>
                Book your{" "}
                <strong style={{ color: "#F8FAFC" }}>Free 15-Minute AI Workflow Audit</strong>. We will map out exactly
                how to automate your biggest bottleneck — with a step-by-step implementation plan tailored to{" "}
                {lead.company}.
              </p>

              {!showCalendly ? (
                <div className="space-y-4">
                  <button
                    onClick={() => setShowCalendly(true)}
                    className="btn-primary-glow w-full py-4 rounded-xl text-white font-semibold text-base flex items-center justify-center gap-2"
                    style={{ fontFamily: "Sora, sans-serif" }}
                  >
                    <Phone className="w-4 h-4" />
                    Book My Free AI Workflow Audit
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <div className="flex flex-wrap gap-4 justify-center">
                    {["No sales pitch", "Actionable roadmap", "15 minutes only"].map((item) => (
                      <div key={item} className="flex items-center gap-1.5 text-sm" style={{ color: "#64748B" }}>
                        <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "#3B82F6" }} />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div
                  className="rounded-xl overflow-hidden"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <div
                    className="flex flex-col items-center justify-center py-16 px-6 text-center"
                    style={{ minHeight: "320px" }}
                  >
                    <Calendar className="w-12 h-12 mb-4" style={{ color: "#3B82F6" }} />
                    <h4
                      className="text-lg font-semibold mb-2"
                      style={{ fontFamily: "Sora, sans-serif", color: "#F8FAFC" }}
                    >
                      Calendly Booking Widget
                    </h4>
                    <p className="text-sm mb-6" style={{ color: "#64748B", fontFamily: "Inter, sans-serif" }}>
                      Replace this block with your Calendly embed:
                    </p>
                    <code
                      className="text-xs px-4 py-3 rounded-lg block w-full text-left"
                      style={{ background: "rgba(0,0,0,0.3)", color: "#3B82F6", fontFamily: "monospace", wordBreak: "break-all" }}
                    >
                      {`<iframe src="https://calendly.com/YOUR_LINK" width="100%" height="600" frameBorder="0" />`}
                    </code>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          <div className="text-center mt-10">
            <button
              onClick={onRestart}
              className="text-sm underline-offset-4 hover:underline transition-colors"
              style={{ color: "#475569", fontFamily: "Inter, sans-serif" }}
            >
              Retake the assessment
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ─── Main Orchestrator ────────────────────────────────────────────────────────

export default function Home() {
  const [step, setStep] = useState<Step>("landing");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [lead, setLead] = useState<LeadData | null>(null);

  const score = answers.length === QUESTIONS.length ? calculateScore(answers) : 0;

  const handleStart = () => {
    setStep("quiz");
    setQuestionIndex(0);
    setAnswers([]);
  };

  const handleAnswer = (points: number) => {
    const newAnswers = [...answers, points];
    setAnswers(newAnswers);
    if (questionIndex + 1 < QUESTIONS.length) {
      setQuestionIndex(questionIndex + 1);
    } else {
      setStep("loading");
    }
  };

  const handleLoadingDone = () => setStep("capture");

  const handleCapture = (data: LeadData) => {
    setLead(data);
    setStep("results");
  };

  const handleRestart = () => {
    setStep("landing");
    setQuestionIndex(0);
    setAnswers([]);
    setLead(null);
  };

  return (
    <AnimatePresence mode="wait">
      {step === "landing" && (
        <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <LandingScreen onStart={handleStart} />
        </motion.div>
      )}
      {step === "quiz" && (
        <motion.div key="quiz" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <QuizScreen questionIndex={questionIndex} onAnswer={handleAnswer} />
        </motion.div>
      )}
      {step === "loading" && (
        <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <LoadingScreen onDone={handleLoadingDone} />
        </motion.div>
      )}
      {step === "capture" && (
        <motion.div key="capture" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <CaptureScreen score={score} answers={answers} onSubmit={handleCapture} />
        </motion.div>
      )}
      {step === "results" && lead && (
        <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <ResultsScreen score={score} lead={lead} onRestart={handleRestart} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
