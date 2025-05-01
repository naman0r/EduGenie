"use client";
import React from "react";
import Link from "next/link";
import {
  BrainCircuit,
  Lightbulb,
  Target,
  Users,
  ArrowRight,
  DollarSign,
  ArrowUpNarrowWide,
} from "lucide-react";

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-teal-950 to-slate-900 text-neutral-200 pt-24 pb-16 px-4 md:px-8 lg:px-16 pt-45">
      <div className="max-w-4xl mx-auto">
        {/* Page Title */}
        <h1 className="text-9xl md:text-5xl font-bold text-center mb-12 bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400">
          More About EduGenie
        </h1>

        <section className="mb-16 p-6 bg-gray-800/30 rounded-lg shadow-xl border border-gray-700">
          <div className="flex items-center mb-4">
            <Target className="w-8 h-8 mr-3 text-teal-400" />
            <h2 className="text-3xl font-semibold text-neutral-100">
              Our Mission
            </h2>
          </div>
          <p className="text-lg text-neutral-300 leading-relaxed">
            To empower students everywhere by providing personalized, AI-driven
            learning tools that adapt to individual needs, simplify complex
            subjects, and make education more engaging and effective. We believe
            technology can unlock academic potential and foster a lifelong love
            for learning.
          </p>
        </section>

        <section className="mb-16 p-6 bg-gray-800/30 rounded-lg shadow-xl border border-gray-700">
          <div className="flex items-center mb-4">
            <ArrowUpNarrowWide className="w-8 h-8 mr-3 text-stone-400" />
            <h2 className="text-3xl font-semibold text-neutral-100">
              What we offer
            </h2>
          </div>
          <p className="text-lg text-neutral-300 leading-relaxed">
            Our platform is end-to-end encryted for maximum security of your
            data.Our features include: AI-generated videos, notes, dynamic
            mindmap creation, flashcards, and complete google calendar
            integration. We are the best platform to help acheive your academic
            and personal goals, especially if you are a person who sometimes
            struggles with time management.
          </p>
        </section>

        {/* Section: Our Vision */}
        <section className="mb-16 p-6 bg-gray-800/30 rounded-lg shadow-xl border border-gray-700">
          <div className="flex items-center mb-4">
            <Lightbulb className="w-8 h-8 mr-3 text-purple-400" />
            <h2 className="text-3xl font-semibold text-neutral-100">
              Our Vision
            </h2>
          </div>
          <p className="text-lg text-neutral-300 leading-relaxed">
            We envision a future where every student has access to a
            personalized learning companion. EduGenie aims to be the leading
            platform for AI-enhanced education, continuously innovating to
            provide cutting-edge tools – from intelligent tutoring and automated
            content creation to seamless organization – helping students achieve
            their academic goals and beyond.
          </p>
        </section>

        {/* Section: The Technology */}
        <section className="mb-16 p-6 bg-gray-800/30 rounded-lg shadow-xl border border-gray-700">
          <div className="flex items-center mb-4">
            <BrainCircuit className="w-8 h-8 mr-3 text-blue-400" />
            <h2 className="text-3xl font-semibold text-neutral-100">
              The Technology
            </h2>
          </div>
          <p className="text-lg text-neutral-300 leading-relaxed">
            EduGenie leverages state-of-the-art Artificial Intelligence,
            including Large Language Models (LLMs) like GPT, to understand
            course content, generate study materials (notes, mind maps, videos),
            schedule tasks, and provide tailored learning experiences. We
            combine this with seamless integration with tools like Google
            Calendar and a user-friendly interface built with modern web
            technologies.
          </p>
        </section>

        <section className="mb-16 p-6 bg-gray-800/30 rounded-lg shadow-xl border border-gray-700">
          <div className="flex items-center mb-4">
            <DollarSign className="w-8 h-8 mr-3 text-fuchsia-400" />
            <h2 className="text-3xl font-semibold text-neutral-100">Pricing</h2>
          </div>
          <p className="text-lg text-neutral-300 leading-relaxed">
            We offer a generous freemium tier which is credit-based. On signup
            you get X credits, and can spend it on the multiple offerings we
            have. We also offer two paid tiers, which offer unmatched value. We
            are dedicated to bringing our technology at a cheap price to anyone
            who wants to use it. You can view more information about our pricing
            plans{" "}
            <Link href="/plans" className="text-sky-400">
              here
            </Link>
            .
          </p>
        </section>

        <section className="mb-16 p-6 bg-gray-800/30 rounded-lg shadow-xl border border-gray-700">
          <div className="flex items-center mb-4">
            <Users className="w-8 h-8 mr-3 text-rose-400" />
            <h2 className="text-3xl font-semibold text-neutral-100">
              Join Our Team
            </h2>
          </div>
          <p className="text-lg text-neutral-300 leading-relaxed">
            At the moment, the platform is managed by a small team of
            tech-obsessed students. If you would like to join our team, please
            contact us at{" "}
            <a href="mailto:naman.rusia14@gmail.com" className="text-teal-400">
              naman.rusia14@gmail.com
            </a>
            . We would love to have talented and passionate people who resonate
            with our vision to be on our team!
          </p>
        </section>

        {/* Section: Join Us / CTA */}
        <section className="text-center">
          <h2 className="text-3xl font-semibold mb-6 text-neutral-100">
            Ready to Transform Your Learning?
          </h2>
          <p className="text-lg text-neutral-300 mb-8 max-w-2xl mx-auto">
            Join an army of students who are studying smarter, not harder, with
            their AI learning partner.
          </p>
          <Link href="/profile">
            {" "}
            {/* Adjust link as needed */}
            <button className="relative inline-flex h-12 overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50 shadow-lg hover:scale-105 transition-transform duration-200">
              <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
              <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-8 py-1 text-base font-medium text-white backdrop-blur-3xl">
                Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
              </span>
            </button>
          </Link>
        </section>
      </div>
    </div>
  );
};

export default AboutPage;
