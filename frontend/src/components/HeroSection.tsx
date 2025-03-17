"use client";
import React from "react";
import { SparklesCore } from "../components/ui/sparkles";

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
              speed={0.1}
            />
          </div>
        </div>
        <h1 className="mt-20 md:mt-0 text-4xl md:text-7xl  font-bold bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400 text-center ">
          Welcome to HackVerseAI
        </h1>
      </div>

      <div className="relative h-screen w-screen grid-bg flex items-center justify-center">
        <h1 className="text-white text-4xl font-bold">Discover Us.</h1>
      </div>
    </>
  );
};

export default HeroSection;
