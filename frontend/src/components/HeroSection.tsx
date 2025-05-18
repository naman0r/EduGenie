"use client";
import React, { useState, useEffect } from "react";
import { SparklesCore } from "../components/ui/sparkles";
import { GlowingEffect } from "./ui/glowing-effect";
import NavBar from "./NavBar";
import {
  BookOpen,
  BrainCircuit,
  GraduationCap,
  CalendarCheck,
  Lightbulb,
  Sparkles,
  ArrowRight,
  Send,
} from "lucide-react";
import Link from "next/link";

// Simple Typewriter effect component
const Typewriter = ({ text, speed = 50 }: { text: string; speed?: number }) => {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    let idx = 0;
    const interval = setInterval(() => {
      setDisplayed((d) => d + text[idx]);
      idx++;
      if (idx >= text.length) {
        clearInterval(interval);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);
  return <span>{displayed}</span>;
};

// RotatingTypewriter cycles through a list of prompts one at a time
const RotatingTypewriter = ({
  prompts,
  typingSpeed = 80,
  erasingSpeed = 40,
  holdTime = 1500,
}: {
  prompts: string[];
  typingSpeed?: number;
  erasingSpeed?: number;
  holdTime?: number;
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [phase, setPhase] = useState<"typing" | "holding" | "erasing">(
    "typing"
  );

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const fullText = prompts[currentIdx];
    if (phase === "typing") {
      if (displayed.length < fullText.length) {
        timeout = setTimeout(
          () => setDisplayed(fullText.slice(0, displayed.length + 1)),
          typingSpeed
        );
      } else {
        timeout = setTimeout(() => setPhase("holding"), holdTime);
      }
    } else if (phase === "erasing") {
      if (displayed.length > 0) {
        timeout = setTimeout(
          () => setDisplayed(displayed.slice(0, -1)),
          erasingSpeed
        );
      } else {
        setCurrentIdx((currentIdx + 1) % prompts.length);
        setPhase("typing");
      }
    } else if (phase === "holding") {
      timeout = setTimeout(() => setPhase("erasing"), holdTime);
    }
    return () => clearTimeout(timeout);
  }, [
    displayed,
    phase,
    currentIdx,
    prompts,
    typingSpeed,
    erasingSpeed,
    holdTime,
  ]);

  return <span>{displayed}</span>;
};

const HeroSection = () => {
  const examplePrompts = [
    "Ask EduGenie to generate a mindmap on SWOT analysis of a business",
    "Ask EduGenie to make flashcards for chapter 4 of my organic chemistry class",
    "Ask EduGenie to generate a video on introducing group theory",
  ];
  return (
    <div className="relative w-full min-h-screen bg-black flex flex-col items-center justify-center overflow-hidden rounded-md pt-20 pb-10 md:pt-24 md:pb-16 px-4 font-mono">
      <NavBar />
      <div className="w-full absolute inset-0 h-full z-0">
        <SparklesCore
          id="tsparticlesfullpage"
          background="transparent"
          minSize={0.6}
          maxSize={1.5}
          particleDensity={200}
          className="w-full h-full"
          particleColor="#707175"
          //particleColor="#26d0ff"
        />
      </div>
      {/* idea: it's not just about studying, it's about learning while building monentum. Start building momentum right now. */}

      <div className="relative z-10 flex flex-col items-center justify-center text-center pt-35">
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400 mb-4 font-mono">
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

        <h1 className="pt-20 text-2xl">
          With Useful Integrations to help you succeed
        </h1>

        {/* Integrations Showcase – mysterious pill container */}
        <div className="relative w-full flex justify-center mt-10">
          <div className="bg-[url('/nav-background.jpg')] bg-top bg-cover rounded-full p-2 shadow-lg overflow-hidden">
            <div className="flex items-center space-x-12 bg-black/30 dark:bg-white/30 backdrop-blur-lg rounded-full px-10 py-4 border border-gray-700">
              <div className="flex flex-col items-center">
                <Sparkles className="h-6 w-6 text-white" />
                <span className="mt-1 text-sm text-white">OpenAI</span>
              </div>
              <div className="flex flex-col items-center">
                <CalendarCheck className="h-6 w-6 text-white" />
                <span className="mt-1 text-sm text-white">Google Calendar</span>
              </div>
              <div className="flex flex-col items-center">
                <BookOpen className="h-6 w-6 text-white" />
                <span className="mt-1 text-sm text-white">Canvas</span>
              </div>
            </div>
          </div>
        </div>

        {/* Prompt CTA Section */}
        <div className="mt-12 w-full max-w-2xl">
          <h3 className="text-lg md:text-xl font-semibold text-neutral-200 mb-4">
            Try these prompts:
          </h3>
          <button className="flex items-center mx-auto bg-white/10 hover:bg-white/20 transition-colors duration-200 rounded-lg px-4 py-2 text-neutral-100">
            <Send className="w-5 h-5 mr-3" />
            <RotatingTypewriter prompts={examplePrompts} />
          </button>
        </div>
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
          borderWidth={2}
        />
        <div className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl border border-neutral-800 bg-black/80 p-6  dark:shadow-[0px_0px_27px_0px_#2D2D2D] md:p-6">
          <div className="relative flex flex-1 flex-col justify-between gap-3">
            <div className="w-fit rounded-lg border border-neutral-700 bg-neutral-900 p-2 ">
              {icon}
            </div>
            <div className="space-y-3">
              <h3 className="pt-0.5 text-xl/[1.375rem] font-semibold font-sans -tracking-4 md:text-2xl/[1.875rem] text-balance text-white font-mono">
                {title}
              </h3>
              <h2
                className="[&_b]:md:font-semibold [&_strong]:md:font-semibold font-sans text-sm/[1.125rem]
              md:text-base/[1.375rem]  text-neutral-400 font-mono"
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
