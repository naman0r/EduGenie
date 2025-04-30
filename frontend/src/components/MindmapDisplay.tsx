"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useLayoutEffect,
} from "react";
import ReactFlow, {
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  Connection,
  addEdge,
  Position,
  MarkerType,
  useNodesState,
  useEdgesState,
  OnConnect,
  useReactFlow,
  ReactFlowProvider,
  MiniMap,
  NodeTypes,
  BackgroundVariant,
} from "reactflow";
import dagre from "dagre";
import "reactflow/dist/style.css";
import { v4 as uuidv4 } from "uuid";
import { auth } from "@/utils/firebase";

// Dagre layout setup
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));
const nodeWidth = 172;
const nodeHeight = 36;

const getLayoutedElements = (
  nodes: Node[],
  edges: Edge[],
  direction = "TB"
) => {
  const isHorizontal = direction === "LR";
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.targetPosition = isHorizontal ? Position.Left : Position.Top;
    node.sourcePosition = isHorizontal ? Position.Right : Position.Bottom;

    // We are shifting the dagre node position (anchor=center center) to the top left
    // so it matches the React Flow node anchor point (top left).
    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };

    return node;
  });

  return { nodes, edges };
};

type MindMapNode = Node<{ label: string }>;
type MindMapEdge = Edge;

interface MindmapDisplayProps {
  initialNodes: MindMapNode[];
  initialEdges: MindMapEdge[];
  resourceId: string;
  classId?: string;
}

// Main Component:
function InteractiveMindmap({
  initialNodes,
  initialEdges,
  resourceId,
}: MindmapDisplayProps) {
  const reactFlowInstance = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState<{ label: string }>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<MindMapEdge>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // State for Generation
  const [generationPrompt, setGenerationPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  useEffect(() => {
    // Only layout initial nodes/edges provided
    if (initialNodes && initialEdges && initialNodes.length > 0) {
      const { nodes: layoutedNodes, edges: layoutedEdges } =
        getLayoutedElements(
          // Deep clone initial nodes/edges to avoid modifying props directly
          JSON.parse(JSON.stringify(initialNodes)),
          JSON.parse(JSON.stringify(initialEdges))
        );
      setNodes(layoutedNodes as Node<{ label: string }>[]);
      setEdges(layoutedEdges);

      // Fit view after layout (slight delay might be needed)
      setTimeout(() => {
        reactFlowInstance.fitView();
      }, 100);
    } else {
      // Handle empty initial state if necessary
      setNodes(initialNodes || []);
      setEdges(initialEdges || []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    initialNodes,
    initialEdges,
    setNodes,
    setEdges,
    reactFlowInstance.fitView,
  ]); // Rerun layout if initial data changes

  // --- Edge Connection Handler ---
  const onConnect: OnConnect = useCallback(
    (connection) => {
      const newEdge = {
        ...connection,
        type: "smoothstep",
        markerEnd: { type: MarkerType.ArrowClosed },
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  // --- Add Node Handler ---
  const handleAddNode = useCallback(() => {
    const newNode: Node<{ label: string }> = {
      id: uuidv4(), // Generate unique ID
      // Position roughly in the center of the current view
      position: reactFlowInstance.project({
        x: window.innerWidth / 2 - 100, // Adjust as needed
        y: (window.innerHeight * 0.8) / 2 - 50, // Adjust based on ReactFlow container height
      }),
      data: { label: "New Node" },
      type: "default", // Or your custom node type
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    };
    setNodes((nds) => nds.concat(newNode));
  }, [setNodes, reactFlowInstance]);

  // --- Save Changes Handler ---
  const handleSaveChanges = async () => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    console.log("Saving nodes:", nodes);
    console.log("Saving edges:", edges);

    const payload = {
      // Only update content for now, add name update if needed
      content: {
        // Ensure nodes/edges are in the format expected by backend/ReactFlow
        nodes: nodes.map((n) => ({ ...n, data: { ...n.data } })), // Simple deep clone for data
        edges: edges.map((e) => ({ ...e })), // Simple clone
      },
    };

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("User not authenticated.");
      }
      const token = await user.getIdToken();
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      if (!resourceId) {
        throw new Error("Resource ID is missing.");
      }

      const response = await fetch(
        `${API_URL}/users/${user.uid}/resources/${resourceId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ detail: "Failed to parse error response" }));
        throw new Error(
          `Save failed: ${response.status} - ${
            errorData.detail || response.statusText
          }`
        );
      }

      console.log("Changes saved successfully!");
      setSaveSuccess(true);
      // Hide success message after a few seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error: any) {
      console.error("Error saving mind map:", error);
      setSaveError(error.message || "An unknown error occurred while saving.");
      // Hide error message after some time
      setTimeout(() => setSaveError(null), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  // --- Generation Handler ---
  const handleGenerateMindmap = async (enhance: boolean) => {
    if (!generationPrompt.trim()) {
      setGenerationError("Please enter a topic or prompt.");
      return;
    }
    setIsGenerating(true);
    setGenerationError(null);

    const user = auth.currentUser;
    if (!user) {
      setGenerationError("User not authenticated.");
      setIsGenerating(false);
      return;
    }

    const payload: {
      prompt: string;
      existing_nodes?: Node<{ label: string }>[];
      existing_edges?: MindMapEdge[];
    } = {
      prompt: generationPrompt,
    };

    if (enhance) {
      // Include current nodes/edges if enhancing
      payload.existing_nodes = nodes;
      payload.existing_edges = edges;
    }

    try {
      const token = await user.getIdToken();
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      const response = await fetch(
        `${API_URL}/users/${user.uid}/resources/${resourceId}/generate-mindmap`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ detail: "Failed to generate/enhance mind map." }));
        throw new Error(
          errorData.detail || `HTTP error! Status: ${response.status}`
        );
      }

      // The backend now returns the new content directly
      const newContent: { nodes: MindMapNode[]; edges: MindMapEdge[] } =
        await response.json();

      if (newContent && newContent.nodes && newContent.edges) {
        // Apply layout to the newly received elements
        const { nodes: layoutedNodes, edges: layoutedEdges } =
          getLayoutedElements(newContent.nodes, newContent.edges);
        setNodes(layoutedNodes as Node<{ label: string }>[]);
        setEdges(layoutedEdges);

        // Fit view to the new layout
        setTimeout(() => {
          reactFlowInstance.fitView();
        }, 100);
      } else {
        throw new Error(
          "Received invalid mind map data structure from server."
        );
      }
    } catch (err: any) {
      console.error("Error during mind map generation/enhancement:", err);
      setGenerationError(err.message || "An unknown error occurred.");
      // Auto-hide error after some time
      setTimeout(() => setGenerationError(null), 5000);
    } finally {
      setIsGenerating(false);
    }
  };

  // Basic Node Edit on Double Click NEED TO DOUBLE CLICK ON A NEW NODE TO EDIT THE NAME
  const onNodeDoubleClick = useCallback(
    (event: React.MouseEvent, node: MindMapNode) => {
      const newLabel = prompt("Enter new node label:", node.data.label); // using chrome/browser prompt for now, but this looks a little tacky so we will change it later.
      if (newLabel !== null) {
        setNodes((nds) =>
          nds.map((n) => {
            if (n.id === node.id) {
              // Create a new data object to ensure state update
              return { ...n, data: { ...n.data, label: newLabel } };
            }
            return n;
          })
        );
      }
    },
    [setNodes]
  );

  return (
    <div className="h-[80vh] w-full border border-gray-700 rounded-lg relative bg-gray-900">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDoubleClick={onNodeDoubleClick}
        fitView
        className="bg-inherit"
        defaultEdgeOptions={{
          type: "smoothstep",
          markerEnd: { type: MarkerType.ArrowClosed },
        }}
      >
        <Controls className="react-flow__controls-custom" />
        <MiniMap
          className="react-flow__minimap-custom"
          nodeStrokeWidth={3}
          zoomable
          pannable
        />
        <Background
          variant={BackgroundVariant.Dots}
          gap={16}
          size={1}
          className="bg-gray-900"
        />

        {/* Generation UI Overlay */}
        <div className="absolute top-3 left-3 z-10 flex flex-col space-y-2 w-64 md:w-96">
          <div className="flex space-x-2">
            <input
              type="text"
              value={generationPrompt}
              onChange={(e) => setGenerationPrompt(e.target.value)}
              placeholder="Enter topic/prompt for AI..."
              className="flex-grow px-3 py-1.5 bg-gray-800 border border-gray-600 rounded text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 shadow"
              disabled={isGenerating}
            />
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => handleGenerateMindmap(false)} // Generate New
              disabled={isGenerating || !generationPrompt.trim()}
              className="flex-1 px-3 py-1.5 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed shadow"
              title="Generate a new mind map based on the prompt (overwrites existing)"
            >
              {isGenerating ? "Working..." : "Generate New"}
            </button>
            <button
              onClick={() => handleGenerateMindmap(true)} // Enhance Existing
              disabled={
                isGenerating || !generationPrompt.trim() || nodes.length === 0
              }
              className="flex-1 px-3 py-1.5 bg-teal-600 text-white text-xs rounded hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed shadow"
              title="Ask AI to enhance the current mind map based on the prompt"
            >
              {isGenerating ? "Working..." : "Enhance Existing"}
            </button>
          </div>
          {generationError && (
            <p className="text-xs text-red-400 bg-red-900/70 px-2 py-1 rounded border border-red-700">
              {generationError}
            </p>
          )}
        </div>

        {/* Action Buttons Overlay (Adjust position if needed) */}
        <div className="absolute top-3 right-3 z-10 flex flex-col space-y-2">
          <button
            onClick={handleAddNode}
            className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 shadow"
            title="Add a new node to the canvas"
          >
            Add Node
          </button>
          <button
            onClick={handleSaveChanges}
            disabled={isSaving}
            className="px-3 py-1.5 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed shadow"
            title="Save the current mind map structure"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>

        {/* Save Status Overlay */}
        {(saveError || saveSuccess) && (
          <div
            className={`absolute bottom-3 left-3 z-10 px-3 py-1.5 text-xs rounded shadow ${
              saveError ? "bg-red-600 text-white" : "bg-green-600 text-white"
            }`}
          >
            {saveError ? `Error: ${saveError}` : "Saved successfully!"}
          </div>
        )}
      </ReactFlow>
    </div>
  );
}

// --- Wrapper Component with Provider ---
// React Flow hook like useReactFlow needs to be used inside a child of ReactFlowProvider
export default function MindmapDisplayWrapper(props: MindmapDisplayProps) {
  return (
    <ReactFlowProvider>
      <InteractiveMindmap {...props} />
    </ReactFlowProvider>
  );
}

// Basic styling for Controls/Minimap (optional, can be done via global CSS too)
// we need this to manage styles for react flow components, which cannot be done via tailwind, so we are
// using inline css for now. can go in and make it prettier later but I think this looks pretty good.
const style = document.createElement("style");
style.innerHTML = `
  .react-flow__controls-custom button {
    background-color: #4a5568; /* gray-700 */
    border-bottom: 1px solid #2d3748; /* gray-800 */
    color: white;
  }
  .react-flow__controls-custom button:hover {
    background-color: #2d3748; /* gray-800 */
  }
  .react-flow__minimap-custom {
    background-color: #2d3748; /* gray-800 */
    border: 1px solid #4a5568; /* gray-700 */
  }
  .react-flow__minimap-mask {
    fill: rgba(74, 85, 104, 0.6); /* gray-700 with opacity */
  }
  .react-flow__node {
     background: #4a5568; /* bg-gray-700 */
     color: white;
     border: 1px solid #718096; /* border-gray-600 */
     border-radius: 4px;
     padding: 4px 8px;
     font-size: 12px;
     text-align: center;
   }

`;
document.head.appendChild(style);
