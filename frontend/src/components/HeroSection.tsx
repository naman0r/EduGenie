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
} from "lucide-react";

const HeroSection = () => {
  return (
    <>
      <div className="h-screen relative w-full bg-black flex flex-col items-center justify-center overflow-hidden rounded-md">
        <div className="w-full absolute inset-0 h-screen">
          <div className="opactity-100">
            <SparklesCore
              id="tsparticlesfullpage"
              background="transparent"
              minSize={0.6}
              maxSize={2}
              particleDensity={100}
              className="w-full h-full"
              particleColor="#FFFFFF"
            />
          </div>
        </div>
        <h1 className="mt-20 md:mt-0 text-4xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-blue-200 to-cyan-400 text-center ">
          Welcome to EduGenie
        </h1>
      </div>

      <div className="relative h-screen w-screen grid-bg flex items-center justify-center flex-col p-30">
        <h1 className="text-white text-4xl font-bold py-30">
          Your AI Learning Partner
        </h1>
        <ul className="grid grid-cols-1 grid-rows-none gap-4 md:grid-cols-12 md:grid-rows-3 lg:gap-4 xl:max-h-[34rem] xl:grid-rows-2">
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
            description="Get AI-generated summaries and explanations of your course materials."
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
            title="Test Your Knowledge"
            description="Generate practice quizzes and flashcards based on your syllabus."
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
    </>
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
      <div className="relative h-full rounded-2.5xl border  p-2  md:rounded-3xl md:p-3">
        <GlowingEffect
          spread={40}
          glow={true}
          disabled={false}
          proximity={64}
          inactiveZone={0.01}
          borderWidth={10}
        />
        <div className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl border-0.75 p-6  dark:shadow-[0px_0px_27px_0px_#2D2D2D] md:p-6">
          <div className="relative flex flex-1 flex-col justify-between gap-3">
            <div className="w-fit rounded-lg border border-gray-600 p-2 ">
              {icon}
            </div>
            <div className="space-y-3">
              <h3 className="pt-0.5 text-xl/[1.375rem] font-semibold font-sans -tracking-4 md:text-2xl/[1.875rem] text-balance text-black dark:text-white">
                {title}
              </h3>
              <h2
                className="[&_b]:md:font-semibold [&_strong]:md:font-semibold font-sans text-sm/[1.125rem] 
              md:text-base/[1.375rem]  text-black dark:text-neutral-400"
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
