import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/utils/firebase";
import { User } from "firebase/auth";
import { ClassData } from "@/types/class";
import {
  fetchClassDetails,
  checkClassAccess,
  deleteClass,
} from "@/services/classes";

export const useClassDetails = (classId: string) => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [classDetails, setClassDetails] = useState<ClassData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        if (classId) {
          try {
            setIsLoading(true);
            const isAssociated = await checkClassAccess(
              classId,
              currentUser.uid
            );

            if (!isAssociated.has_access) {
              setError("You do not have permission to view this class.");
              setClassDetails(null);
              setIsAuthorized(false);
              return;
            }

            setIsAuthorized(true);
            const data = await fetchClassDetails(classId);
            setClassDetails(data);
            setError(null);
          } catch (err: any) {
            console.error("Failed to fetch class details:", err);
            setError("Failed to load class details. Please try again later.");
            setClassDetails(null);
          } finally {
            setIsLoading(false);
          }
        } else {
          setError("Invalid Class ID.");
        }
      } else {
        setUser(null);
        router.push("/");
      }
    });

    return () => unsubscribe();
  }, [classId, router]);

  const handleDeleteClass = async () => {
    if (!user || !classId) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await deleteClass(user.uid, classId);
      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      console.error("Failed to delete class:", err);
      setDeleteError(
        err.message || "Failed to delete class. Please try again."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    user,
    classDetails,
    isLoading,
    error,
    isAuthorized,
    isDeleting,
    deleteError,
    handleDeleteClass,
  };
};
