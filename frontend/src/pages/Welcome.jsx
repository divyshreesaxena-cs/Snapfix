import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Wrench,
  Zap,
  Paintbrush,
  Hammer,
  ShieldCheck,
  Star,
  ArrowRight,
} from "lucide-react";

const REVIEWS = [
  {
    name: "Aarav",
    rating: 5,
    text: "Booked an electrician in minutes. Super smooth experience and great service.",
  },
  {
    name: "Meera",
    rating: 5,
    text: "The plumber arrived on time and fixed everything quickly. Loved the UI too!",
  },
  {
    name: "Rohit",
    rating: 4,
    text: "Clean design, easy booking flow, and transparent pricing. Would recommend.",
  },
  {
    name: "Sana",
    rating: 5,
    text: "Painting service was fantastic. Booking + tracking felt very professional.",
  },
  {
    name: "Vikram",
    rating: 5,
    text: "The worker dashboard concept is strong. Looks like a real product.",
  },
];

const SERVICES = [
  { title: "Electrician", icon: Zap },
  { title: "Plumbing", icon: Wrench },
  { title: "Painting", icon: Paintbrush },
  { title: "Carpenter", icon: Hammer },
];

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background blobs (matches your Login aesthetic) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
          className="absolute -top-40 -left-40 w-96 h-96 bg-orange-200 rounded-full mix-blend-multiply filter blur-xl opacity-70"
        />
        <motion.div
          animate={{ scale: [1, 1.1, 1], rotate: [0, -90, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-200 rounded-full mix-blend-multiply filter blur-xl opacity-70"
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid lg:grid-cols-2 gap-10 items-center"
        >
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/70 border border-white/60 backdrop-blur-xl shadow-sm">
              <ShieldCheck className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-semibold text-dark-700">
                Trusted home services — fast, verified, and simple
              </span>
            </div>

            <h1 className="mt-4 text-4xl sm:text-5xl font-display gradient-text leading-tight">
              SnapFix gets home repairs done — without the headache.
            </h1>

            <p className="mt-4 text-dark-600 text-lg leading-relaxed">
              Book reliable professionals for{" "}
              <span className="font-semibold text-dark-800">
                electrical, plumbing, painting, and carpentry
              </span>{" "}
              in a few taps. Track bookings, schedule visits, and pay after completion.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate("/login")}
                className="btn-primary inline-flex items-center justify-center gap-2"
              >
                Login / Register <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  const el = document.getElementById("reviews");
                  el?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="btn-secondary inline-flex items-center justify-center gap-2"
              >
                See reviews <Star className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {SERVICES.map((s) => {
                const Icon = s.icon;
                return (
                  <div
                    key={s.title}
                    className="card p-4 flex items-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-2xl bg-orange-100 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="text-sm font-semibold text-dark-800">
                      {s.title}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right side “product” card */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="card p-6 sm:p-8"
          >
            <div className="text-sm text-dark-500 font-semibold">
              How SnapFix works
            </div>

            <div className="mt-4 space-y-4">
              {[
                {
                  title: "Choose a service",
                  desc: "Pick a category and describe your problem.",
                },
                {
                  title: "Select a professional",
                  desc: "See availability, ratings, and hourly price.",
                },
                {
                  title: "Schedule & confirm",
                  desc: "Book a time that suits you best.",
                },
                {
                  title: "Complete & pay",
                  desc: "Pay after completion and leave feedback.",
                },
              ].map((step, idx) => (
                <div
                  key={step.title}
                  className="flex gap-3 items-start bg-dark-50 border-2 border-dark-200 rounded-2xl p-4"
                >
                  <div className="w-9 h-9 rounded-2xl bg-white flex items-center justify-center border-2 border-dark-200 font-bold text-dark-900">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="font-semibold text-dark-900">
                      {step.title}
                    </div>
                    <div className="text-sm text-dark-600 mt-0.5">
                      {step.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 text-xs text-dark-500">
              Tip: Workers have a dedicated portal for profile + booking management.
            </div>
          </motion.div>
        </motion.div>

        {/* Reviews (scrolling) */}
        <div id="reviews" className="mt-14">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-display text-dark-900">
                What users say
              </h2>
              <p className="text-dark-600 mt-1">
                Real experiences from customers who used SnapFix.
              </p>
            </div>
          </div>

          {/* Marquee */}
          <div className="mt-6 relative">
            <style>{`
              @keyframes snapfix-marquee {
                0% { transform: translateX(0); }
                100% { transform: translateX(-50%); }
              }
            `}</style>

            <div className="overflow-hidden rounded-3xl border-2 border-dark-200 bg-white/60 backdrop-blur-xl">
              <div
                className="flex gap-4 py-5 px-5 w-max"
                style={{
                  animation: "snapfix-marquee 18s linear infinite",
                }}
              >
                {[...REVIEWS, ...REVIEWS].map((r, i) => (
                  <div
                    key={`${r.name}-${i}`}
                    className="min-w-[280px] max-w-[280px] card p-5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-dark-900">
                        {r.name}
                      </div>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: r.rating }).map((_, idx) => (
                          <Star
                            key={idx}
                            className="w-4 h-4 text-orange-500"
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-dark-600 mt-2 leading-relaxed">
                      {r.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Fade edges */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-white to-transparent rounded-l-3xl" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-white to-transparent rounded-r-3xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
