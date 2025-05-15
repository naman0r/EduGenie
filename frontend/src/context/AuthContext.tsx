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
import { UserProfile, Credits } from "@/types";
import { fetchUserProfile, fetchUserCredits } from "@/services";

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  credits: number | null;
  isLoading: boolean;
  authError: string | null;
  refreshData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start with loading true
  const [authError, setAuthError] = useState<string | null>(null);

  const loadUserData = useCallback(async (currentUser: FirebaseUser) => {
    setIsLoading(true);
    setAuthError(null);
    localStorage.setItem("google_id", currentUser.uid);
    try {
      const [profileResponse, creditsResponse] = await Promise.all([
        fetchUserProfile(currentUser.uid),
        fetchUserCredits(currentUser.uid),
      ]);
      setUserProfile(profileResponse.user);
      setCredits(creditsResponse.credits);
    } catch (err: any) {
      console.error("AuthContext: Failed to load user data", err);
      setAuthError(
        err.message || "Failed to load user data. Please try again."
      );
      setUserProfile(null); // Clear data on error
      setCredits(null);
    }
    setIsLoading(false);
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
        localStorage.removeItem("google_id");
        setIsLoading(false); // Not loading if no user
        setAuthError(null); // Clear any previous errors
      }
    });
    return () => unsubscribe();
  }, [loadUserData]);

  const refreshData = useCallback(async () => {
    if (firebaseUser) {
      await loadUserData(firebaseUser);
    }
  }, [firebaseUser, loadUserData]);

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        userProfile,
        credits,
        isLoading,
        authError,
        refreshData,
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
