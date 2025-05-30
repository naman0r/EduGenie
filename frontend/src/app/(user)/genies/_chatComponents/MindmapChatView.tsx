"use client";

import React from "react";
import ReactFlow, {
  Background,
  MiniMap,
  Node,
  Edge,
  Position,
} from "reactflow";
import dagre from "dagre";
import "reactflow/dist/style.css";

interface MindmapChatViewProps {
  content: {
    nodes: Node[];
    edges: Edge[];
  };
}

const nodeWidth = 172;
const nodeHeight = 36;

function layoutMindmap(nodes: Node[], edges: Edge[], direction = "TB") {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });
  dagre.layout(dagreGraph);

  return nodes.map((node) => {
    const dagreNode = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: dagreNode.x - nodeWidth / 2,
        y: dagreNode.y - nodeHeight / 2,
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    };
  });
}

const MindmapChatView: React.FC<MindmapChatViewProps> = ({ content }) => {
  console.log("[MindmapChatView] content:", content);
  if (!content || !content.nodes || !content.edges) {
    return (
      <div className="text-slate-400 italic text-sm p-4">
        No mindmap data available.
      </div>
    );
  }
  // Defensive mapping for nodes/edges
  const safeNodes = Array.isArray(content.nodes)
    ? content.nodes.map((n) => ({
        ...n,
        type: n.type || "default",
        data: n.data || { label: n.id },
      }))
    : [];
  const safeEdges = Array.isArray(content.edges) ? content.edges : [];

  const layoutedNodes = layoutMindmap(
    JSON.parse(JSON.stringify(safeNodes)),
    safeEdges
  );

  return (
    <div style={{ height: 350, width: "100%" }}>
      <p>Here is your requested mindmap!:</p>
      <ReactFlow
        nodes={layoutedNodes}
        edges={safeEdges}
        fitView={true}
        panOnDrag={true}
        zoomOnScroll={false}
        zoomOnPinch={true}
        zoomOnDoubleClick={false}
        nodesDraggable={true}
        nodesConnectable={true}
        elementsSelectable={true}
        className="bg-blue-950 rounded-lg border border-lime-700"
      >
        <Background gap={16} size={1} color="#334155" />
        {/*<MiniMap pannable={false} zoomable={false} />*/}
      </ReactFlow>
      {/*Add more functionality here, like save to resources, maybe a dowbload button? */}
      {/** make this cost credits */}
    </div>
  );
};

export default MindmapChatView;
