"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";

// this is a simple test route which I am using to test out the useAuth hook i made.
const TestPage = () => {
  const {
    firebaseUser,
    userProfile,
    credits,
    classes,
    isLoading,
    isLoadingClasses,
    authError,
    fetchClassesError,
    refreshData,
    addClass,
  } = useAuth(); // this is all the potential data we da
  return (
    <div className="pt-35">
      <h1>Test Page</h1>
      <p>Firebase User: {firebaseUser?.displayName}</p>
      <p>Firebase User: {JSON.stringify(firebaseUser)}</p>
      <p>Credits: {credits}</p>
      <p>Classes: {JSON.stringify(classes)}</p>
      <p>is loading: {isLoading}</p>
      <p>is loading classes: {isLoadingClasses}</p>
      <p>auth error: {authError}</p>
      <p>fetch classes error: {fetchClassesError}</p>
    </div>
  );
};

export default TestPage;
