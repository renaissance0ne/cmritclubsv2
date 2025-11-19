"use client";

import React from "react";
import { motion, Variants } from "framer-motion";
import { ArrowRight, Layout, PieChart, Users } from "lucide-react";
import { useRouter } from "next/navigation";

// --- Reusable Button Component ---
const AuthRedirectButton = ({ href, className, children }: { href: string; className: string; children: React.ReactNode }) => {
  const router = useRouter();
  return (
    <button onClick={() => router.push(href)} className={className}>
      {children}
    </button>
  );
};

// --- 1. Reusable Animation Variants ---
const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

// --- 2. Components ---

const Navbar = ({ redirectPath }: { redirectPath: string }) => {
  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-6 left-0 right-0 z-50 mx-auto w-max"
    >
      <div className="flex items-center gap-8 rounded-full border border-white/20 bg-white/70 px-6 py-3 shadow-lg backdrop-blur-md md:px-8">
        <span className="text-lg font-bold text-black">cmritclubs</span>
        
        <div className="hidden items-center gap-6 text-sm font-medium text-gray-600 md:flex">
          <a href="#" className="hover:text-black">Features</a>
          <a href="#" className="hover:text-black">Benefits</a>
          <a href="#" className="hover:text-black">Contact Us</a>
        </div>

        <AuthRedirectButton 
          href={redirectPath} 
          className="rounded-full bg-black px-5 py-2 text-sm font-semibold text-white transition-transform hover:scale-105 hover:bg-gray-800"
        >
          Try cmritclubs
        </AuthRedirectButton>
      </div>
    </motion.nav>
  );
};

const FeatureSection = ({ eyebrow, title, description, imageSide = "left", color = "blue", redirectPath }: {
  eyebrow: string;
  title: string;
  description: string;
  imageSide?: "left" | "right";
  color?: string;
  redirectPath: string;
}) => {
  return (
    <motion.div 
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={staggerContainer}
      className={`flex flex-col gap-12 py-20 md:flex-row md:items-center md:gap-24 ${
        imageSide === "right" ? "md:flex-row-reverse" : ""
      }`}
    >
      <motion.div 
        variants={fadeInUp}
        className={`h-64 w-full flex-1 overflow-hidden rounded-3xl bg-gray-100 shadow-xl md:h-[500px]`}
      >
        <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br from-${color}-100 to-white`}>
          <span className="text-gray-400">App Screenshot Placeholder</span>
        </div>
      </motion.div>

      <motion.div variants={fadeInUp} className="flex-1">
        <span className="mb-4 block text-xs font-bold uppercase tracking-wider text-gray-500">
          {eyebrow}
        </span>
        <h2 className="mb-6 text-4xl font-bold leading-tight tracking-tight text-slate-900 md:text-5xl">
          {title}
        </h2>
        <p className="mb-8 text-lg leading-relaxed text-gray-600">
          {description}
        </p>
        <AuthRedirectButton 
          href={redirectPath} 
          className="flex items-center gap-2 rounded-full bg-black px-6 py-3 font-medium text-white transition-all hover:gap-3"
        >
          Try cmritclubs <ArrowRight size={18} />
        </AuthRedirectButton>
      </motion.div>
    </motion.div>
  );
};

// --- 3. Main Page Layout ---

export default function LandingPageClient({ redirectPath }: { redirectPath: string }) {
  return (
    <main className="min-h-screen bg-[#F3F6FA] text-slate-900 selection:bg-blue-200">
      <Navbar redirectPath={redirectPath} />

      {/* HERO SECTION */}
      <section className="relative flex min-h-[90vh] flex-col items-center justify-center px-4 pt-32 text-center">
        <div className="absolute top-0 -z-10 h-full w-full bg-gradient-to-b from-blue-200 via-[#F3F6FA] to-[#F3F6FA] opacity-60" />

        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="max-w-4xl"
        >
          <motion.h1 variants={fadeInUp} className="text-5xl font-bold tracking-tighter text-slate-900 md:text-7xl">
            Approvals in Minutes, <br /> Not Days
          </motion.h1>
          
          <motion.p variants={fadeInUp} className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
            Ditch the paperwork. We’ve replaced manual workflows with a transparent,
            automated system that connects clubs, mentors, and officials instantly.
          </motion.p>

          <motion.div variants={fadeInUp} className="mt-8 flex items-center justify-center gap-4">
            <AuthRedirectButton 
              href={redirectPath} 
              className="rounded-full bg-black px-8 py-3 font-semibold text-white transition-transform hover:scale-105"
            >
              Try cmritclubs
            </AuthRedirectButton>
            <button className="rounded-full bg-gray-200 px-8 py-3 font-semibold text-black transition-colors hover:bg-gray-300">
              See features
            </button>
          </motion.div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="mt-16 w-full max-w-5xl overflow-hidden rounded-t-3xl border border-gray-200 bg-white shadow-2xl"
        >
           <div className="h-[400px] w-full bg-gradient-to-b from-white to-blue-50 flex items-center justify-center">
              <span className="text-gray-400 font-medium">Dashboard Image Asset Here</span>
           </div>
        </motion.div>
      </section>


      {/* FEATURES SECTION */}
      <section className="mx-auto max-w-7xl px-6 py-10">
        
        <FeatureSection 
          redirectPath={redirectPath}
          eyebrow="Seamless Across Devices"
          title="Access from anywhere, always in sync."
          description="Whether you are in the lab, at home, or on the go, cmritclubs keeps your event proposals and approvals moving. No more waiting for physical files to move from desk to desk."
          imageSide="right"
          color="orange"
        />

        <FeatureSection 
          redirectPath={redirectPath}
          eyebrow="Event Management"
          title="Keep every event moving forward."
          description="Plan, assign, and execute your work—all in one place. With smart status tracking, deadlines, and automated notifications, clubs stay organized and the administration stays confident."
          imageSide="left"
          color="blue"
        />

        <FeatureSection 
          redirectPath={redirectPath}
          eyebrow="Financial Management"
          title="Track budgets, stress less."
          description="Create budget proposals, log expenses, and keep tabs on club funds. Whether it's sponsorship or college grants, track every rupee with automated transparency."
          imageSide="right"
          color="green"
        />
      </section>


      {/* GRID / BENTO CARDS SECTION */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-1 gap-6 md:grid-cols-3"
          >
            
            <motion.div variants={fadeInUp} className="flex flex-col justify-between rounded-3xl bg-[#F6F0EB] p-8">
              <div className="mb-8 h-12 w-12 rounded-full bg-white flex items-center justify-center">
                <Users className="text-black" size={24}/>
              </div>
              <div>
                <h3 className="mb-3 text-xl font-bold text-slate-900">Collaborate in realtime</h3>
                <p className="text-slate-600 leading-relaxed">
                  Mentors and students can comment directly on proposals. Resolve queries instantly and eliminate back-and-forth emails.
                </p>
              </div>
            </motion.div>

            <motion.div variants={fadeInUp} className="flex flex-col justify-between rounded-3xl bg-[#F6F0EB] p-8">
              <div className="mb-8 h-12 w-12 rounded-full bg-white flex items-center justify-center">
                 <Layout className="text-black" size={24}/>
              </div>
              <div>
                <h3 className="mb-3 text-xl font-bold text-slate-900">Transparent Budget Tracking</h3>
                <p className="text-slate-600 leading-relaxed">
                  Propose budgets, log expenses, and track sponsorship funds digitally. Simplifies the financial review process.
                </p>
              </div>
            </motion.div>

            <motion.div variants={fadeInUp} className="flex flex-col justify-between rounded-3xl bg-[#F6F0EB] p-8">
               <div className="mb-8 h-12 w-12 rounded-full bg-white flex items-center justify-center">
                 <PieChart className="text-black" size={24}/>
               </div>
              <div>
                <h3 className="mb-3 text-xl font-bold text-slate-900">Visual Dashboards</h3>
                <p className="text-slate-600 leading-relaxed">
                   View upcoming events, pending approvals, and budget usage at a glance. Easily toggle between calendar and list views.
                </p>
              </div>
            </motion.div>

          </motion.div>
        </div>
      </section>


      {/* COMMUNITY / FOOTER SECTION */}
      <section className="bg-[#F3F6FA] py-24 text-center">
        <div className="mx-auto max-w-6xl px-6">
          <span className="mb-4 block text-sm font-bold uppercase tracking-widest text-gray-500">Community</span>
          <h2 className="mb-16 text-4xl font-bold md:text-5xl">Stay in the loop</h2>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="flex flex-col items-start rounded-3xl bg-white p-10 shadow-sm">
              <div className="mb-6 rounded-xl bg-black p-3 text-white">
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </div>
              <h3 className="text-2xl font-bold">X/Twitter</h3>
              <p className="mt-2 text-left text-gray-500">Stay updated on new features and discover how others are using cmritclubs.</p>
              <button className="mt-8 rounded-full border border-gray-200 px-6 py-2 font-medium transition-colors hover:border-black">Follow us</button>
            </div>

             <div className="flex flex-col items-start rounded-3xl bg-white p-10 shadow-sm">
               <div className="mb-6 rounded-xl bg-red-600 p-3 text-white">
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="white" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><path d="m10 15 5-3-5-3z"/></svg>
              </div>
              <h3 className="text-2xl font-bold">YouTube</h3>
              <p className="mt-2 text-left text-gray-500">Tips, tutorials, and in-depth feature guides to inspire your workflow.</p>
              <button className="mt-8 rounded-full border border-gray-200 px-6 py-2 font-medium transition-colors hover:border-black">Subscribe</button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER SECTION */}
      <footer className="relative bg-gradient-to-b from-blue-100/50 to-blue-200/50 pt-24 pb-8 text-slate-700">
        <div className="absolute top-0 -z-10 h-full w-full bg-gradient-to-b from-[#F3F6FA] via-blue-100 to-blue-200 opacity-80" />
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-4 lg:grid-cols-5">
            <div className="col-span-1 md:col-span-2 lg:col-span-2">
              <span className="mb-4 block text-xl font-bold text-slate-900">cmritclubs</span>
              <p className="max-w-md text-slate-600">
                No more running around for signatures. Manage permissions, track status, and connect with officials—all in one place.
              </p>
              <div className="mt-6 flex gap-4">
                <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </div>
                <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M22 4.026c-1.018.448-2.112.74-3.238.877 1.173-.704 2.067-1.816 2.486-3.132-1.1.652-2.316 1.127-3.6 1.385-1.04-1.11-2.527-1.794-4.184-1.794-3.179 0-5.756 2.576-5.756 5.755 0 .452.05.89.14 1.31-4.786-.24-9.037-2.524-11.88-6.002-.5.856-.788 1.85-.788 2.916 0 1.996 1.015 3.754 2.553 4.787-1-.03-1.936-.31-2.752-.756v.073c0 2.793 1.989 5.122 4.62 5.642-.486.132-.999.204-1.529.204-.374 0-.737-.035-1.09-.104.733 2.288 2.85 3.957 5.378 3.996-1.972 1.547-4.46 2.47-7.152 2.47-.466 0-.926-.027-1.378-.08 2.54 1.629 5.568 2.585 8.814 2.585 10.573 0 16.357-8.756 16.357-16.356 0-.25-.008-.497-.017-.743.673-.487 1.259-1.09 1.725-1.794z"/></svg>
                </div>
              </div>
            </div>

            <div>
              <h4 className="mb-4 font-bold text-slate-900">PAGES</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-slate-600 hover:text-slate-900">Home</a></li>
                <li><a href="#" className="text-slate-600 hover:text-slate-900">Features</a></li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4 font-bold text-slate-900">INFORMATION</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-slate-600 hover:text-slate-900">Contact</a></li>
                <li><a href="#" className="text-slate-600 hover:text-slate-900">Privacy</a></li>
                <li><a href="#" className="text-slate-600 hover:text-slate-900">Terms of use</a></li>
                <li><a href="#" className="text-slate-600 hover:text-slate-900">404</a></li>
              </ul>
            </div>

          </div>

          <div className="mt-16 border-t border-gray-300 pt-8 text-center text-sm text-slate-500">
            © {new Date().getFullYear()} cmritclubs
          </div>
        </div>
      </footer>
    </main>
  );
}
