import { useState, useCallback } from "react";
import { User } from "firebase/auth";
import { ResourceInfo } from "@/types/resources";
import { auth } from "@/utils/firebase";

export const useResources = (classId: string) => {
  const [resources, setResources] = useState<ResourceInfo[]>([]);
  const [resourcesLoading, setResourcesLoading] = useState(true);
  const [resourcesError, setResourcesError] = useState<string | null>(null);
  const [showCreateResourceModal, setShowCreateResourceModal] = useState(false);
  const [resourceCreationStep, setResourceCreationStep] = useState<
    "selectType" | "enterName" | "creating"
  >("selectType");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [newResourceName, setNewResourceName] = useState<string>("");

  const fetchResources = useCallback(
    async (user: User) => {
      if (!user || !classId) return;

      setResourcesLoading(true);
      setResourcesError(null);

      try {
        const token = await user.getIdToken();
        if (!token) {
          throw new Error("Authentication token not available.");
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/${user.uid}/resources?class_id=${classId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Failed to fetch resources: ${response.status} - ${errorText}`
          );
        }

        const data: ResourceInfo[] = await response.json();
        setResources(data);
      } catch (err: any) {
        console.error("Failed to fetch resources:", err);
        setResourcesError("Failed to load resources. Please try again later.");
      } finally {
        setResourcesLoading(false);
      }
    },
    [classId]
  );

  const handleOpenCreateModal = () => {
    setShowCreateResourceModal(true);
    setResourceCreationStep("selectType");
    setSelectedType(null);
    setNewResourceName("");
    setResourcesError(null);
  };

  const handleSelectType = (type: string) => {
    setSelectedType(type);
    let defaultName = "New Resource";
    if (type === "Mindmap") defaultName = "New Mindmap";
    if (type === "flashcards") defaultName = "New Flashcard Set";
    if (type === "Text notes") defaultName = "New Note";
    setNewResourceName(defaultName);
    setResourceCreationStep("enterName");
  };

  const handleGoBackToTypeSelection = () => {
    setResourceCreationStep("selectType");
    setResourcesError(null);
  };

  const handleCancelCreation = () => {
    setShowCreateResourceModal(false);
  };

  const performResourceCreation = async (user: User) => {
    if (!user || !classId || !selectedType || !newResourceName) {
      setResourcesError(
        "Cannot create resource: Missing user, class, type, or name information."
      );
      setResourceCreationStep("enterName");
      return;
    }
    setResourceCreationStep("creating");
    setResourcesError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/${user.uid}/resources`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            class_id: classId,
            user_id: user.uid,
            type: selectedType,
            name: newResourceName,
            content: {},
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Failed to create resource: ${response.status} - ${
            errorData.detail || "Unknown error"
          }`
        );
      }

      const newResource: ResourceInfo = await response.json();
      setResources((prevResources) => [newResource, ...prevResources]);
      setShowCreateResourceModal(false);
    } catch (err: any) {
      console.error("Failed to create resource:", err);
      setResourcesError(
        err.message || "Failed to create resource. Please try again."
      );
      setResourceCreationStep("enterName");
    }
  };

  return {
    resources,
    resourcesLoading,
    resourcesError,
    showCreateResourceModal,
    resourceCreationStep,
    selectedType,
    newResourceName,
    setNewResourceName,
    fetchResources,
    handleOpenCreateModal,
    handleSelectType,
    handleGoBackToTypeSelection,
    handleCancelCreation,
    performResourceCreation,
  };
};
