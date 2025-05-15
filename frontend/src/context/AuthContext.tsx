"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { User as FirebaseUser } from "firebase/auth";
import { auth } from "@/utils/firebase";
import { UserProfile, Credits, ClassData } from "@/types";
import {
  fetchUserProfile,
  fetchUserCredits,
  fetchUserClasses,
  addClass as addClassService,
} from "@/services";

// Define payload for adding a class, similar to AddClassPayload in services/classes.ts
interface AddClassServicePayload {
  name: string;
  code?: string;
  instructor?: string;
}

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  credits: number | null;
  classes: ClassData[];
  isLoading: boolean;
  isLoadingClasses: boolean;
  authError: string | null;
  fetchClassesError: string | null;
  refreshData: () => Promise<void>;
  addClass: (classDetails: AddClassServicePayload) => Promise<ClassData>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [fetchClassesError, setFetchClassesError] = useState<string | null>(
    null
  );

  const loadUserData = useCallback(async (currentUser: FirebaseUser) => {
    setIsLoading(true);
    setIsLoadingClasses(true);
    setAuthError(null);
    setFetchClassesError(null);
    localStorage.setItem("google_id", currentUser.uid);
    try {
      const [profileResponse, creditsResponse, classesResponse] =
        await Promise.all([
          fetchUserProfile(currentUser.uid),
          fetchUserCredits(currentUser.uid),
          fetchUserClasses(currentUser.uid),
        ]);
      setUserProfile(profileResponse.user);
      setCredits(creditsResponse.credits);
      setClasses(classesResponse);
    } catch (err: any) {
      console.error("AuthContext: Failed to load user data", err);
      const errorMessage =
        err.message || "Failed to load user data. Please try again.";
      setAuthError(errorMessage);
      setFetchClassesError(errorMessage);
      setUserProfile(null);
      setCredits(null);
      setClasses([]);
    } finally {
      setIsLoading(false);
      setIsLoadingClasses(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setFirebaseUser(currentUser);
        await loadUserData(currentUser);
      } else {
        setFirebaseUser(null);
        setUserProfile(null);
        setCredits(null);
        setClasses([]);
        localStorage.removeItem("google_id");
        setIsLoading(false);
        setIsLoadingClasses(false);
        setAuthError(null);
        setFetchClassesError(null);
      }
    });
    return () => unsubscribe();
  }, [loadUserData]);

  const refreshData = useCallback(async () => {
    if (firebaseUser) {
      await loadUserData(firebaseUser);
    }
  }, [firebaseUser, loadUserData]);

  const addClass = useCallback(
    async (classDetails: AddClassServicePayload): Promise<ClassData> => {
      if (!firebaseUser) {
        throw new Error("User not authenticated. Cannot add class.");
      }
      try {
        const newClass = await addClassService(firebaseUser.uid, classDetails);
        await loadUserData(firebaseUser);
        return newClass;
      } catch (err: any) {
        console.error("AuthContext: Failed to add class", err);
        throw err;
      }
    },
    [firebaseUser, loadUserData]
  );

  return (
    <AuthContext.Provider
      value={{
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
