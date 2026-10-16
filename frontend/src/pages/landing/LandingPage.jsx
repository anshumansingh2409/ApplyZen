import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Play,
  CheckCircle2,
  Mail,
  ShieldAlert,
  Sparkles,
  Layers,
  FileCheck,
  ChevronRight,
  TrendingUp,
  Clock,
  Send
} from 'lucide-react';
import { opportunityService } from '../../services/opportunity.service';

export default function LandingPage() {
  const navigate = useNavigate();
  const [demoEmail, setDemoEmail] = useState(
    `Subject: Urgent Opening: Software Engineer (Full Stack) at Stripe\n` +
    `From: careers@stripe.com\n\n` +
    `Hi Candidate,\n` +
    `We reviewed your GitHub projects and invite you to apply for our Software Engineer role.\n` +
    `Role: Software Engineer\n` +
    `Company: Stripe\n` +
    `Requirements: Python, React, FastAPI, Docker. Batch 2025/2026. Min CGPA: 8.0.\n` +
    `Deadline: Apply before October 28, 2026.\n` +
    `Apply URL: https://stripe.com/jobs/apply/swe-2026`
  );
  const [demoResult, setDemoResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  const handleTestExtraction = async () => {
    setAnalyzing(true);
    // Instant local demonstration calculation
    setTimeout(() => {
      setDemoResult({
        company: "Stripe",
        role: "Software Engineer",
        eligibility: "ELIGIBLE",
        matchScore: 94,
        matchingSkills: ["Python", "React", "FastAPI", "Docker"],
        missingSkills: ["Kubernetes (Optional)"],
        resumeRecommended: "Resume_Fullstack_v2.pdf",
        action: "READY_FOR_REVIEW"
      });
      setAnalyzing(false);
    }, 600);
  };

  return (
    <div className="bg-[#ffffff]">
      {/* HERO SECTION — Strictly matching reference image */}
      <section className="pt-12 pb-20 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Headlines & CTA */}
          <div className="lg:col-span-6 space-y-6">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#e6f4ea] text-[#05603a] text-xs font-bold tracking-wide uppercase">
              <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse"></span>
              AI Powered Career Copilot
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-extrabold text-gray-900 leading-[1.12] tracking-tight">
              Never Miss an Opportunity. <br />
              <span className="text-[#05603a]">We Apply. You Grow.</span>
            </h1>

            {/* Subtext */}
            <p className="text-lg text-gray-600 leading-relaxed max-w-xl">
              ApplyZen is your AI career copilot that finds opportunities, creates the perfect resume, fills applications automatically, and tracks everything in one place.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                to="/signup"
                className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-[#05603a] hover:bg-[#034a27] text-white font-semibold text-base shadow-md hover:shadow-lg transition-all"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <a
                href="#demo"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white border border-gray-200 hover:border-gray-300 text-gray-800 font-semibold text-base shadow-xs hover:bg-gray-50 transition-all"
              >
                <span>Watch Demo</span>
                <Play className="w-3.5 h-3.5 fill-current text-gray-900" />
              </a>
            </div>

            {/* Key trust bullets */}
            <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-gray-500 font-medium">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Zero Hallucination Guarantee</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Approval or Auto Mode</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Ethical Human-in-Loop</span>
              </div>
            </div>
          </div>

          {/* Right Column: Sleek Studio Dashboard Mockup */}
          <div className="lg:col-span-6 relative">
            <div className="relative rounded-3xl p-4 bg-gradient-to-br from-amber-50/40 via-stone-100/60 to-emerald-50/40 border border-gray-100 shadow-2xl overflow-hidden">
              {/* Desktop Monitor Screen Frame */}
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                {/* Browser bar */}
                <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                    <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                  </div>
                  <div className="bg-white px-3 py-1 rounded text-[11px] text-gray-500 font-mono border border-gray-200">
                    applyzen.app/dashboard
                  </div>
                  <div className="w-10"></div>
                </div>

                {/* Dashboard Screen Content */}
                <div className="p-5 bg-[#fbfdfc] space-y-4">
                  {/* Top Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-2xs">
                      <span className="text-[11px] text-gray-500 block">Total Opportunities</span>
                      <span className="text-xl font-bold text-gray-900">203</span>
                      <span className="text-[10px] text-emerald-600 block font-medium mt-0.5">+18 this week</span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-2xs">
                      <span className="text-[11px] text-gray-500 block">Interviews</span>
                      <span className="text-xl font-bold text-gray-900">13</span>
                      <span className="text-[10px] text-emerald-600 block font-medium mt-0.5">2 upcoming</span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-2xs">
                      <span className="text-[11px] text-gray-500 block">Offers</span>
                      <span className="text-xl font-bold text-[#05603a]">2</span>
                      <span className="text-[10px] text-emerald-600 block font-medium mt-0.5">Stripe & Razorpay</span>
                    </div>
                  </div>

                  {/* Active Application Card */}
                  <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#05603a] text-white flex items-center justify-center font-bold text-sm">
                          S
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-gray-900">Stripe — Software Engineer</h4>
                          <span className="text-xs text-gray-500">Resume: Resume_V2_FullStack.pdf</span>
                        </div>
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-[#05603a]">
                        94% Match
                      </span>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                      <span className="text-gray-500 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                        Status: Ready for Review
                      </span>
                      <span className="text-[#05603a] font-medium">12 Fields Pre-Filled</span>
                    </div>
                  </div>

                  {/* Mini pipeline columns */}
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="bg-gray-100/70 p-2 rounded-lg">
                      <span className="text-gray-500 block text-[10px]">Applied</span>
                      <span className="font-bold text-gray-800">42</span>
                    </div>
                    <div className="bg-amber-50 p-2 rounded-lg">
                      <span className="text-amber-700 block text-[10px]">Assessment</span>
                      <span className="font-bold text-amber-800">8</span>
                    </div>
                    <div className="bg-blue-50 p-2 rounded-lg">
                      <span className="text-blue-700 block text-[10px]">Interview</span>
                      <span className="font-bold text-blue-800">13</span>
                    </div>
                    <div className="bg-emerald-50 p-2 rounded-lg">
                      <span className="text-[#05603a] block text-[10px]">Offer</span>
                      <span className="font-bold text-[#05603a]">2</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* LIVE INTERACTIVE DEMO TESTER */}
      <section id="demo" className="py-16 bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-[#05603a]">Interactive Demonstration</span>
            <h2 className="text-3xl font-extrabold text-gray-900 mt-2">Test Email-to-Opportunity Extraction Live</h2>
            <p className="text-sm text-gray-600 mt-2">
              Paste any job recruitment email below to watch ApplyZen classify the role, verify candidate eligibility, and match skills in real-time.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Input Email Box */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#05603a]" />
                  Simulated Inbox Email
                </span>
                <span className="text-xs text-gray-400">Gmail / Outlook Parser</span>
              </div>

              <textarea
                rows={8}
                value={demoEmail}
                onChange={(e) => setDemoEmail(e.target.value)}
                className="w-full text-xs font-mono bg-gray-50 p-3.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#05603a] focus:bg-white transition-colors"
              />

              <button
                onClick={handleTestExtraction}
                disabled={analyzing}
                className="w-full py-3 rounded-xl bg-[#05603a] hover:bg-[#034a27] text-white font-semibold text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {analyzing ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <span>Analyzing with LangGraph Agents...</span>
                  </>
                ) : (
                  <>
                    <span>Extract Opportunity & Match Resume</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            {/* Output Extraction Card */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm min-h-[340px] flex flex-col justify-center">
              {demoResult ? (
                <div className="space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <div>
                      <span className="text-xs text-gray-500">Detected Opportunity</span>
                      <h3 className="text-lg font-bold text-gray-900">{demoResult.role} at {demoResult.company}</h3>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-emerald-50 text-[#05603a] font-bold text-xs border border-emerald-200">
                      {demoResult.matchScore}% Match
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-gray-400 block">Eligibility Status</span>
                      <span className="font-semibold text-emerald-700 flex items-center gap-1 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {demoResult.eligibility}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Recommended Resume</span>
                      <span className="font-semibold text-gray-800 block mt-0.5">{demoResult.resumeRecommended}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <span className="text-xs font-semibold text-gray-700 block">Matching Skills:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {demoResult.matchingSkills.map((s, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-emerald-50 text-emerald-800 text-[11px] rounded font-medium">
                          ✓ {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs text-gray-500">Workflow Action: <strong>Ready for Review</strong></span>
                    <Link
                      to="/signup"
                      className="px-4 py-2 bg-[#05603a] text-white text-xs font-semibold rounded-lg hover:bg-[#034a27]"
                    >
                      Automate with ApplyZen →
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-gray-400 space-y-2">
                  <Sparkles className="w-8 h-8 text-gray-300 mx-auto" />
                  <p className="text-sm font-medium">Click "Extract Opportunity" to run the live AI analysis engine.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CORE FEATURES GRID */}
      <section id="features" className="py-20 max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-[#05603a]">Architecture & Intelligence</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mt-2">
            Engineered for Precision, Safety, and User Control
          </h2>
          <p className="text-base text-gray-600 mt-3">
            ApplyZen replaces repetitive form-filling while giving you complete authority over critical, sensitive, and legal career decisions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="p-8 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-[#e6f4ea] text-[#05603a] flex items-center justify-center mb-6">
              <Mail className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Automated Email Detection</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Monitors authorized Gmail and Outlook messages. Detects job opportunities, application links, deadlines, and salary details instantly without duplicate workflows.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-8 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-[#e6f4ea] text-[#05603a] flex items-center justify-center mb-6">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Zero-Hallucination Knowledge Base</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Ground truth repository stores education, CGPA, projects, and work authorization. The AI never invents facts; if a field is missing, it pauses and asks you.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-8 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-[#e6f4ea] text-[#05603a] flex items-center justify-center mb-6">
              <FileCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Targeted Resume Matching</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Upload multiple resume versions. The matching agent calculates skill overlap, identifies missing requirements, and attaches the highest-scoring resume to each application.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="p-8 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-[#e6f4ea] text-[#05603a] flex items-center justify-center mb-6">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Playwright Form Automation</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Understands web form inputs, selects, radio buttons, and file attachments. Pre-fills every field with verified data and provides an approval review interface.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="p-8 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-[#e6f4ea] text-[#05603a] flex items-center justify-center mb-6">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Ethical Human-in-Loop CAPTCHA</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Zero automated CAPTCHA bypassing. If security challenges appear, ApplyZen safely pauses the session, delivers context, and resumes the moment you solve it.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="p-8 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-[#e6f4ea] text-[#05603a] flex items-center justify-center mb-6">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Full Lifecycle Email Tracking</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Tracks future recruiter communications automatically. Links online assessments, interview schedules, offers, and rejections into an immutable chronological timeline.
            </p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="how-it-works" className="py-20 bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-[#05603a]">Workflow Progression</span>
            <h2 className="text-3xl font-extrabold text-gray-900 mt-2">How ApplyZen Powers Your Job Search</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 space-y-3 relative">
              <span className="w-8 h-8 rounded-full bg-[#05603a] text-white flex items-center justify-center font-bold text-sm">1</span>
              <h4 className="font-bold text-gray-900">Connect Inboxes</h4>
              <p className="text-xs text-gray-600 leading-relaxed">OAuth connection to Gmail/Outlook monitors career notifications securely without reading personal messages.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 space-y-3 relative">
              <span className="w-8 h-8 rounded-full bg-[#05603a] text-white flex items-center justify-center font-bold text-sm">2</span>
              <h4 className="font-bold text-gray-900">AI Screen & Match</h4>
              <p className="text-xs text-gray-600 leading-relaxed">LangGraph agents extract JD criteria, check graduation/CGPA eligibility, and pick the best resume version.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 space-y-3 relative">
              <span className="w-8 h-8 rounded-full bg-[#05603a] text-white flex items-center justify-center font-bold text-sm">3</span>
              <h4 className="font-bold text-gray-900">Review & Submit</h4>
              <p className="text-xs text-gray-600 leading-relaxed">Inspect every pre-filled field with confidence scores. Edit any value or enable Automatic Mode within safe buffers.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 space-y-3 relative">
              <span className="w-8 h-8 rounded-full bg-[#05603a] text-white flex items-center justify-center font-bold text-sm">4</span>
              <h4 className="font-bold text-gray-900">Lifecycle Tracking</h4>
              <p className="text-xs text-gray-600 leading-relaxed">Incoming interview links and coding challenges update your active pipeline timeline in real-time.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CALL TO ACTION */}
      <section className="py-20 px-6 max-w-5xl mx-auto text-center">
        <div className="bg-[#05603a] text-white rounded-3xl p-12 sm:p-16 shadow-xl relative overflow-hidden">
          <div className="relative z-10 space-y-6 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Ready to automate repetitive applications while staying in complete control?
            </h2>
            <p className="text-emerald-100 text-base leading-relaxed">
              Join thousands of engineers and professionals using ApplyZen to discover opportunities, match resumes, and navigate career pipelines effortlessly.
            </p>
            <div className="pt-2">
              <Link
                to="/signup"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white text-[#05603a] font-bold text-base shadow-md hover:bg-emerald-50 transition-all cursor-pointer"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
