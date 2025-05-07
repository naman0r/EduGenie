"use client";
import React, { useState, useEffect } from "react";
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

const Credits = () => {
  const [signedIn, setSignedIn] = useState<Boolean>(false);
  const [credits, setCredits] = useState<number>(20);

  useEffect(() => {
    const googleId = localStorage.getItem("google_id");
    googleId ? setSignedIn(true) : console.log("user not signed in ");

    if (signedIn) {
      const result = fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/credits/${googleId}/get_credits`
      )
        .then((res) => res.json())
        .then((data) => setCredits(data.credits));
    }
  });

  return (
    <div className="min-h-screen  text-neutral-200 pt-24 pb-16 px-4 md:px-8 lg:px-16 pt-45">
      <div className="max-w-4xl mx-auto">
        {/* Page Title */}
        <h1 className="text-9xl md:text-5xl font-bold text-center mb-12 bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400">
          What are Credits?
        </h1>

        <section className="mb-16 p-6 bg-gray-800/30 rounded-lg shadow-xl border border-gray-700">
          <div className="flex items-center mb-4">
            <Target className="w-8 h-8 mr-3 text-teal-400" />
            <h2 className="text-3xl font-semibold text-neutral-100">
              Why we use Credits
            </h2>
          </div>
          <p className="text-lg text-neutral-300 leading-relaxed">
            Every user who starts off with EduGenie is given 20 credits. For
            every resource you create on our platform and every query you use,
            we subtract a certain number of credits. More credits are added
            every week.
          </p>
        </section>

        <section className="mb-16 p-6 bg-gray-800/30 rounded-lg shadow-xl border border-gray-700">
          <div className="flex items-center mb-4">
            <ArrowUpNarrowWide className="w-8 h-8 mr-3 text-stone-400" />
            <h2 className="text-3xl font-semibold text-neutral-100">
              What can you use credits for
            </h2>
          </div>
          <p className="text-lg text-neutral-300 leading-relaxed">
            You can use credits for:
          </p>
          <ul className="list-disc ml-20 my-5 ">
            <li>Integrating with Canvas (2 credits)</li>
            <li>Integrating with Google Calendar (2 credits)</li>
            <li>Adding a class (1 credit)</li>
            <li>Creating a resource with AI (1 credit)</li>
            <li>Updating a resource with AI (1 credit)</li>
            <li>Generating a video (1 credit)</li>
            <li>Importing tasks from Canvas (1 credit)</li>
          </ul>
        </section>

        <section className="mb-16 p-6 bg-gray-800/30 rounded-lg shadow-xl border border-gray-700">
          <div className="flex items-center mb-4">
            <Lightbulb className="w-8 h-8 mr-3 text-purple-400" />
            <h2 className="text-3xl font-semibold text-neutral-100">
              Our Vision
            </h2>
          </div>
          <p className="text-lg text-neutral-300 leading-relaxed">
            We want to keep learing afforable, but also need to cover our costs.
            This is why you get credits and can use a lot of our functionality
            on the free tier. You can also purchase premium plans to get more
            credits, and on the unlimited plan you get unlimited plans
          </p>
        </section>

        <section className="mb-16 p-6 bg-gray-800/30 rounded-lg shadow-xl border border-gray-700">
          <div className="flex items-center mb-4">
            <DollarSign className="w-8 h-8 mr-3 text-fuchsia-400" />
            <h2 className="text-3xl font-semibold text-neutral-100">
              Your Usage
            </h2>
          </div>
          {signedIn && (
            <p className="text-blue-100 text-xl">
              {" "}
              You are signed in , and have {credits} credits
            </p>
          )}
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
      </div>
    </div>
  );
};

export default Credits;
