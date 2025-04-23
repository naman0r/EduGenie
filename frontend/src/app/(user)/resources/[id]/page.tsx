"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface Resource {
  id: string;
  class_id: string;
  user_id: string;
  type: string;
  name: string;
  created_at: string;
  content?: Record<string, any>;
}

const ResourceView = () => {
  const params = useParams();
  const resourceId = params?.id as string | undefined;
  const googleId = localStorage.getItem("google_id");
  const [resource, setResource] = useState<Resource | null>(null);

  if (!resourceId) {
    return <div>Invalid Resource ID</div>;
  }

  useEffect(() => {
    const fetchResource = async () => {
      try {
        const response = await fetch(
          `http://localhost:8000/users/${googleId}/resources/${resourceId}`
        );
        const data = await response.json();
        setResource(data);
      } catch (error) {
        console.error("Error fetching resource:", error);
      }
    };
    fetchResource();
  }, [resourceId]);

  return (
    <div>
      <h1>Viewing Resource: {resourceId}</h1>
      {resource ? (
        <pre className="text-white">{JSON.stringify(resource, null, 2)}</pre>
      ) : (
        <p>Loading resource data...</p>
      )}
    </div>
  );
};

export default ResourceView;
