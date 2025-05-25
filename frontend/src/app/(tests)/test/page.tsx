"use client";

import React, { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useClassDetails } from "@/hooks/useClassDetails";
import { useTasks } from "@/hooks/useTasks";
import { useResources } from "@/hooks/useResources";
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
    isGoogleCalendarIntegrated,
    isCanvasIntegrated,
  } = useAuth(); // this is all the potential data we da

  const { user, classDetails, error, isAuthorized } = useClassDetails(
    "19fbdd8b-e037-4506-81cb-3963c0035bf6"
  );

  const { tasks, tasksLoading, tasksError, fetchTasks } = useTasks(
    "19fbdd8b-e037-4506-81cb-3963c0035bf6"
  );

  const { resources, resourcesLoading, resourcesError, fetchResources } =
    useResources("19fbdd8b-e037-4506-81cb-3963c0035bf6");

  // still need to call these functions.....
  useEffect(() => {
    if (user) {
      fetchResources(user);
      fetchTasks(user);
      refreshData();
    }
  }, [user, fetchResources]);

  return (
    <div className="pt-35">
      {/*    <h1>Test Page</h1>
      <p>Firebase User: {firebaseUser?.displayName}</p>
      <p>Firebase User: {JSON.stringify(firebaseUser)}</p>
      <p>Credits: {credits}</p>
      <p>Classes: {JSON.stringify(classes)}</p>
      <p>is loading: {isLoading}</p>
      <p>is loading classes: {isLoadingClasses}</p>
      <p>auth error: {authError}</p>
      <p>fetch classes error: {fetchClassesError}</p>
      <p>user: {JSON.stringify(user)}</p>
      <p>class details: {JSON.stringify(classDetails)}</p>
      <p>error: {JSON.stringify(error)}</p>
      <p>is authorized: {JSON.stringify(isAuthorized)}</p> */}

      {/* <h1>Test page</h1>
      <p>tasks: {JSON.stringify(tasks)}</p>
      <p>tasks loading: {JSON.stringify(tasksLoading)}</p>
      <p>tasks error: {JSON.stringify(tasksError)}</p>
      <p>resources: {JSON.stringify(resources)}</p>
      <p>resources loading: {JSON.stringify(resourcesLoading)}</p>
      <p>resources error: {JSON.stringify(resourcesError)}</p> */}
      <h1>Test page</h1>
      <p>
        is google calendar integrated: {isGoogleCalendarIntegrated && "true"}
      </p>
      <p>is canvas integrated: {isCanvasIntegrated && "true"}</p>
      <p>user profile: {JSON.stringify(userProfile)}</p>
    </div>
  );
};

export default TestPage;
