"use client";
import React from "react";
import { SparklesCore } from "../components/ui/sparkles";
import { GlowingEffect } from "./ui/glowing-effect";
import {
  BookOpen,
  BrainCircuit,
  GraduationCap,
  CalendarCheck,
  Lightbulb,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

const HeroSection = () => {
  return (
    <div className="relative w-full min-h-screen bg-black flex flex-col items-center justify-center overflow-hidden rounded-md pt-20 pb-10 md:pt-24 md:pb-16 px-4">
      <div className="w-full absolute inset-0 h-full z-0">
        <SparklesCore
          id="tsparticlesfullpage"
          background="transparent"
          minSize={0.6}
          maxSize={1.4}
          particleDensity={80}
          className="w-full h-full"
          particleColor="#FFFFFF"
        />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center text-center pt-35">
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400 mb-4">
          Ace Your Courses with AI
        </h1>

        <p className="mt-4 mb-8 text-base md:text-lg lg:text-xl text-neutral-300 max-w-3xl">
          EduGenie transforms your study routine with personalized plans, smart
          summaries, content generation tools, and seamless organization.
        </p>

        <Link href="/profile">
          <button className="relative inline-flex h-12 overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50 mb-12 md:mb-16 shadow-lg hover:scale-105 transition-transform duration-200">
            <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
            <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-6 py-1 text-sm font-medium text-white backdrop-blur-3xl">
              Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
            </span>
          </button>
        </Link>
        <Link href="/about">
          <button className="relative inline-flex h-12 overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50 mb-12 md:mb-16 shadow-lg hover:scale-105 transition-transform duration-200">
            <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#99f6e4_0%,#0d9488_50%,#99f6e4_100%)]" />
            <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-6 py-1 text-sm font-medium text-white backdrop-blur-3xl">
              Learn more About us. <ArrowRight className="ml-2 h-4 w-4" />
            </span>
          </button>
        </Link>

        <h2 className="text-2xl md:text-3xl font-semibold text-neutral-200 mb-8 md:mb-10">
          How EduGenie Helps You Succeed
        </h2>

        <ul className="w-full max-w-6xl grid grid-cols-1 grid-rows-none gap-4 md:grid-cols-12 md:grid-rows-3 lg:gap-4 xl:max-h-[34rem] xl:grid-rows-2">
          <GridItem
            area="md:[grid-area:1/1/2/7] xl:[grid-area:1/1/2/5]"
            icon={
              <BrainCircuit className="h-4 w-4 text-black dark:text-neutral-400" />
            }
            title="Personalized Study Plans"
            description="AI-powered schedules and topic suggestions tailored just for you."
          />

          <GridItem
            area="md:[grid-area:1/7/2/13] xl:[grid-area:2/1/3/5]"
            icon={
              <BookOpen className="h-4 w-4 text-black dark:text-neutral-400" />
            }
            title="Understand Complex Topics Faster"
            description="Generate summaries, mind maps, and videos from your course materials."
          />

          <GridItem
            area="md:[grid-area:2/1/3/7] xl:[grid-area:1/5/3/8]"
            icon={
              <CalendarCheck className="h-4 w-4 text-black dark:text-neutral-400" />
            }
            title="Stay Organized with Calendar Sync"
            description="Automatically add assignments and study sessions to your Google Calendar."
          />

          <GridItem
            area="md:[grid-area:2/7/3/13] xl:[grid-area:1/8/2/13]"
            icon={
              <Lightbulb className="h-4 w-4 text-black dark:text-neutral-400" />
            }
            title="Generate Study Content"
            description="Create flashcards, notes, mind maps and educational videos effortlessly."
          />

          <GridItem
            area="md:[grid-area:3/1/4/13] xl:[grid-area:2/8/3/13]"
            icon={
              <GraduationCap className="h-4 w-4 text-black dark:text-neutral-400" />
            }
            title="Your Pocket Teaching Assistant"
            description="Get help with difficult concepts and prepare effectively for exams."
          />
        </ul>
      </div>
    </div>
  );
};

export default HeroSection;

interface GridItemProps {
  area: string;
  icon: React.ReactNode;
  title: string;
  description: React.ReactNode;
}

const GridItem = ({ area, icon, title, description }: GridItemProps) => {
  return (
    <li className={`min-h-[14rem] list-none ${area}`}>
      <div className="relative h-full rounded-2.5xl border border-neutral-700 p-2  md:rounded-3xl md:p-3">
        <GlowingEffect
          spread={40}
          glow={true}
          disabled={false}
          proximity={64}
          inactiveZone={0.01}
          borderWidth={10}
        />
        <div className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl border border-neutral-800 bg-black/80 p-6  dark:shadow-[0px_0px_27px_0px_#2D2D2D] md:p-6">
          <div className="relative flex flex-1 flex-col justify-between gap-3">
            <div className="w-fit rounded-lg border border-neutral-700 bg-neutral-900 p-2 ">
              {icon}
            </div>
            <div className="space-y-3">
              <h3 className="pt-0.5 text-xl/[1.375rem] font-semibold font-sans -tracking-4 md:text-2xl/[1.875rem] text-balance text-white">
                {title}
              </h3>
              <h2
                className="[&_b]:md:font-semibold [&_strong]:md:font-semibold font-sans text-sm/[1.125rem]
              md:text-base/[1.375rem]  text-neutral-400"
              >
                {description}
              </h2>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
};
