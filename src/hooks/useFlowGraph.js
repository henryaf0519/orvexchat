// src/hooks/useFlowGraph.js
import { useCallback } from 'react';
import { useNodesState, useEdgesState, addEdge, MarkerType } from 'reactflow';
import { toast } from 'react-toastify';
import { NODE_DEFAULTS } from '../utils/flowConfig';

export const useFlowGraph = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const updateNodeData = useCallback((nodeId, newData) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, ...newData } } : node
      )
    );
  }, [setNodes]);

  const removeEdge = useCallback((sourceNodeId, sourceHandleId) => {
    setEdges((eds) =>
      eds.filter(
        (edge) => !(edge.source === sourceNodeId && edge.sourceHandle === sourceHandleId)
      )
    );
    toast.success("Conexión eliminada");
  }, [setEdges]);

  const deleteNode = useCallback((nodeIdToDelete) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeIdToDelete));
    setEdges((eds) =>
      eds.filter((edge) => edge.source !== nodeIdToDelete && edge.target !== nodeIdToDelete)
    );
  }, [setNodes, setEdges]);

  // Inyectamos las funciones necesarias dentro de 'data' para que los nodos puedan usarlas
  const injectNodeFunctions = useCallback((node) => ({
    ...node,
    data: {
      ...node.data,
      updateNodeData,
      deleteNode,
      removeEdge,
      // Estas dos se sobrescriben en el index.jsx porque requieren estado del modal
      openPreviewModal: () => console.warn("openPreviewModal not attached yet"), 
    },
  }), [updateNodeData, deleteNode, removeEdge]);

  const onConnect = useCallback((params) => {
    const newEdge = {
      ...params,
      type: "smoothstep",
      markerEnd: { type: MarkerType.ArrowClosed },
    };
    setEdges((eds) => addEdge(newEdge, eds));

    // Lógica específica para actualizar el 'targetScreen' en las opciones de RadioButtons
    // (Mantenemos tu lógica original aquí)
    if (params.sourceHandle && params.sourceHandle.includes('-option')) {
         // Aquí podrías agregar lógica extra si necesitas actualizar el estado interno del nodo
         // para reflejar la conexión, aunque ReactFlow ya maneja la arista visualmente.
    }
  }, [setEdges]);

  const getNewNodePosition = () => {
    let newPosition = { x: 100, y: 100 };
    if (nodes.length > 0) {
      const rightMostNode = nodes.reduce(
        (rightmost, node) => (node.position.x > rightmost.position.x ? node : rightmost),
        nodes[0]
      );
      newPosition = {
        x: rightMostNode.position.x + 400,
        y: rightMostNode.position.y,
      };
    }
    return newPosition;
  };

  const addNode = (type) => {
    if (!NODE_DEFAULTS[type]) {
        console.error(`Tipo de nodo desconocido: ${type}`);
        return;
    }
    
    // Deep copy de la configuración por defecto para evitar referencias compartidas
    const defaultData = JSON.parse(JSON.stringify(NODE_DEFAULTS[type]));

    const newNode = {
      id: `node_${Date.now()}`,
      type: type,
      position: getNewNodePosition(),
      data: defaultData,
    };
    setNodes((nds) => nds.concat(injectNodeFunctions(newNode)));
  };

  return {
    nodes,
    edges,
    setNodes,
    setEdges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    injectNodeFunctions,
    updateNodeData
  };
};