// src/components/FlowBuilder.jsx

import React, { useState, useCallback } from 'react';
import ReactFlow, {
  Controls,
  Background,
  addEdge,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import FlowScreenNode from './FlowScreenNode';

const nodeTypes = { screenNode: FlowScreenNode };

let screenId = 1;
const getScreenId = () => `SCREEN_${screenId++}`;

const FlowBuilder = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [flowName, setFlowName] = useState("Mi Flujo de Bienvenida");
  const [flowJson, setFlowJson] = useState({});

  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const updateNodeData = (nodeId, newData) => {
    setNodes((nds) =>
      nds.map((node) => (node.id === nodeId ? { ...node, data: { ...node.data, ...newData } } : node))
    );
  };

  // --- CAMBIO #3: La función que elimina el nodo y sus conexiones ---
  const deleteNode = useCallback((nodeIdToDelete) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeIdToDelete));
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeIdToDelete && edge.target !== nodeIdToDelete));
  }, [setNodes, setEdges]);
  
  const addScreenNode = () => {
    let newPosition = { x: 100, y: 100 }; // Posición por defecto si es el primer nodo

    if (nodes.length > 0) {
        // 1. Encontrar el nodo que está más a la derecha
        const rightMostNode = nodes.reduce(
            (rightmost, node) => (node.position.x > rightmost.position.x ? node : rightmost),
            nodes[0]
        );
        
        // 2. Calcular la nueva posición a la derecha de ese nodo
        newPosition = {
            x: rightMostNode.position.x + 400, // Ancho del nodo (350) + un espacio (50)
            y: rightMostNode.position.y,      // Mantener la misma altura para una línea ordenada
        };
    }

    const newNode = {
      id: getScreenId(),
      type: 'screenNode',
      position: newPosition, // 3. Usar la nueva posición calculada
      data: { 
        title: '', body: '', buttons: [], footer_label: '',
        updateNodeData: updateNodeData,
        deleteNode: deleteNode 
      },
    };
    setNodes((nds) => nds.concat(newNode));
  };

  const generateFlowJson = () => {
    // (Lógica sin cambios)
    const routing_model = {};
    const screens = nodes.map(node => {
      const outgoingEdges = edges.filter(e => e.source === node.id);
      routing_model[node.id] = [...new Set(outgoingEdges.map(e => e.target))];
      const dataSource = (node.data.buttons || []).map((button, index) => {
        const edgeForButton = outgoingEdges.find(e => e.sourceHandle === `${node.id}-option-${index}`);
        return { id: edgeForButton ? edgeForButton.target : "", title: button.title };
      });
      return {
        id: node.id,
        title: node.data.title,
        layout: { type: "SingleColumnLayout", children: [{ type: "Form", name: `${node.id}_form`,
            children: [
              { type: "TextBody", text: node.data.body },
              { type: "RadioButtonsGroup", name: "selection", "data-source": dataSource },
              { type: "Footer", label: node.data.footer_label || 'Continuar', "on-click-action": { name: "data_exchange", payload: { selection: "${form.selection}" } }}
            ]
        }]},
      };
    });
    const finalJson = { name: flowName.toLowerCase().replace(/\s/g, '_'), version: "7.2", data_api_version: "3.0", routing_model, screens };
    setFlowJson(finalJson);
  };

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex' }}>
      <div style={{ width: '250px', padding: '10px', borderRight: '1px solid #ddd' }}>
        <h3>Constructor</h3>
         <input value={flowName} onChange={(e) => setFlowName(e.target.value)} style={{width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '20px'}} />
        <button onClick={addScreenNode} className="add-option-button" style={{background: '#4299e1', color: 'white', border: 'none'}}>+ Añadir Pantalla</button>
      </div>

      <div style={{ flex: 1, background: '#fcfcfc' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
          fitViewOptions={{ maxZoom: 1 }}
        >
          <Controls />
          <Background color="#eee" gap={20} />
        </ReactFlow>
      </div>

      <div style={{ width: '400px', padding: '10px', borderLeft: '1px solid #ddd', background: '#f7fafc' }}>
        <h3>JSON del Flujo</h3>
        <button onClick={generateFlowJson} style={{ marginBottom: '10px', padding: '10px', width: '100%', backgroundColor: '#e53e3e', color: 'white', border: 'none', borderRadius: '5px' }}>
          Generar/Actualizar JSON
        </button>
        <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', background: 'white', padding: '10px', borderRadius: '5px', height: '85%', overflowY: 'auto', fontSize: '12px' }}>
          {JSON.stringify(flowJson, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default function FlowBuilderProvider() {
  return (
    <ReactFlowProvider>
      <FlowBuilder />
    </ReactFlowProvider>
  );
}