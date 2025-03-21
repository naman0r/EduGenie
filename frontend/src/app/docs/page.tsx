"use client";
import React from "react";
import Link from "next/link";
import { WavyBackground } from "@/components/ui/wavy-background";

const Docs = () => {
  // Hardcoded projects array
  const projects = [
    { id: 1, name: "Project One", description: "Hardcoded content lmao" },
    { id: 2, name: "Project Two", description: "This is the second project." },
    { id: 3, name: "Project Three", description: "This is the third project." },
  ];

  return (
    <WavyBackground
      className="max-w-4xl mx-auto pb-40"
      speed="slow"
      blur={15}
      waveWidth={100}
      waveOpacity={0.7}
    >
      <div className="p-8 font-sans pt-30 justify-center align-center content-center">
        <h1 className="text-3xl font-bold mb-6">Docs</h1>
        <div className=" space-y-4 flex flex-row space-x-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className="border border-gray-300 rounded-md shadow-sm w-100 h-50 p-10 bg-blue-100"
            >
              <h2 className="text-2xl font-semibold text-black">
                {project.name}
              </h2>
              <p className="text-gray-600">{project.description}</p>
            </div>
          ))}
        </div>
        <Link
          href="/docs/new"
          className="mt-8 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-500 text-white rounded-md text-lg transition-transform transform hover:scale-105 focus:outline-none"
        >
          Add Project
        </Link>
      </div>
    </WavyBackground>
  );
};

export default Docs;
