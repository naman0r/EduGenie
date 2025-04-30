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
} from "reactflow";
import dagre from "dagre";
import "reactflow/dist/style.css";

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

interface MindmapDisplayProps {
  initialNodes?: Node[];
  initialEdges?: Edge[];
  resourceId: string;
  userId: string;
}

const MindmapDisplay: React.FC<MindmapDisplayProps> = ({
  initialNodes = [],
  initialEdges = [],
  resourceId,
  userId,
}) => {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Apply layout when nodes/edges change
  useLayoutEffect(() => {
    if (nodes.length > 0) {
      const { nodes: layoutedNodes, edges: layoutedEdges } =
        getLayoutedElements(nodes, edges);
      setNodes([...layoutedNodes]);
      setEdges([...layoutedEdges]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialNodes, initialEdges]); // Rerun layout if initial props change

  const onNodesChange = useCallback(
    (changes: NodeChange[]) =>
      setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes]
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) =>
      setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges]
  );
  // Basic connect handler (you might not need interactive connections)
  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  const handleGenerateMindmap = async () => {
    if (!prompt.trim()) {
      setError("Please enter a topic or description for the mind map.");
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `http://localhost:8000/users/${userId}/resources/${resourceId}/generate-mindmap`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
        }
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ detail: "Failed to generate mind map." }));
        throw new Error(
          errorData.detail || `HTTP error! Status: ${response.status}`
        );
      }

      const updatedResource = await response.json();
      const { nodes: newNodes, edges: newEdges } = updatedResource.content || {
        nodes: [],
        edges: [],
      };

      if (newNodes && newEdges) {
        // Apply layout to the new elements
        const { nodes: layoutedNodes, edges: layoutedEdges } =
          getLayoutedElements(newNodes, newEdges);
        setNodes([...layoutedNodes]); // Use spread to ensure re-render
        setEdges([...layoutedEdges]); // Use spread to ensure re-render
      } else {
        throw new Error(
          "Received invalid mind map data structure from server."
        );
      }
    } catch (err: any) {
      console.error("Error generating mind map:", err);
      setError(err.message || "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-4 p-4 border border-gray-700 rounded-lg bg-gray-900/50">
      <h3 className="text-lg font-semibold mb-3 text-white">Mind Map</h3>
      <div className="mb-4 flex flex-col sm:flex-row gap-2 items-stretch">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter topic to generate mind map (e.g., Photosynthesis)"
          className="flex-grow px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out text-white placeholder-gray-500"
          disabled={isLoading}
        />
        <button
          onClick={handleGenerateMindmap}
          disabled={isLoading || !prompt.trim()}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Generating..." : "Generate Mind Map"}
        </button>
      </div>

      {error && (
        <p className="text-red-500 text-sm mb-3 bg-red-100 border border-red-400 p-2 rounded">
          Error: {error}
        </p>
      )}

      <div
        style={{ height: "600px" }}
        className="bg-gray-800 rounded overflow-hidden"
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect} // You might want to disable interactive connections
          fitView
          attributionPosition="bottom-left"
        >
          <Controls />
          <Background gap={16} color="#444" />
        </ReactFlow>
      </div>
    </div>
  );
};

export default MindmapDisplay;
