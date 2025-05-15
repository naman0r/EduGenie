"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";

// this is a simple test route which I am using to test out the useAuth hook i made.
const TestPage = () => {
  const { firebaseUser } = useAuth();
  return (
    <div className="pt-35">
      <h1>Test Page</h1>
      <p>Firebase User: {firebaseUser?.displayName}</p>
      <p>Firebase User: {JSON.stringify(firebaseUser)}</p>
    </div>
  );
};

export default TestPage;
