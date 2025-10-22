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
  
  const deleteNode = useCallback((nodeIdToDelete) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeIdToDelete));
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeIdToDelete && edge.target !== nodeIdToDelete));
  }, [setNodes, setEdges]);
  
  const addScreenNode = () => {
    let newPosition = { x: 100, y: 100 };
    if (nodes.length > 0) {
        const rightMostNode = nodes.reduce((rightmost, node) => (node.position.x > rightmost.position.x ? node : rightmost), nodes[0]);
        newPosition = { x: rightMostNode.position.x + 400, y: rightMostNode.position.y };
    }

    const newNode = {
      id: getScreenId(),
      type: 'screenNode',
      position: newPosition,
      data: { 
        title: '', 
        components: [],
        footer_label: '',
        updateNodeData: updateNodeData,
        deleteNode: deleteNode 
      },
    };
    setNodes((nds) => nds.concat(newNode));
  };

  const generateFlowJson = () => {
    const routing_model = {};
    const screens = nodes.map(node => {
        const outgoingEdges = edges.filter(e => e.source === node.id);
        routing_model[node.id] = [...new Set(outgoingEdges.map(e => e.target))];

        const formPayload = {}; // Objeto para construir el payload
        const formChildren = (node.data.components || []).map((component, compIndex) => {
            switch(component.type) {
                case 'TextBody':
                    return { type: 'TextBody', text: component.text || '' };
                case 'TextInput':
                    // Añadimos el campo al payload
                    if(component.name) {
                        formPayload[component.name] = `\${form.${component.name}}`;
                    }
                    return { type: 'TextInput', name: component.name || `input_${compIndex}`, label: component.label || '', required: true };
                case 'RadioButtonsGroup':
                    // Añadimos la selección al payload
                    formPayload['selection'] = `\${form.selection}`;
                    const dataSource = (component.options || []).map((option, optIndex) => {
                        const edgeForOption = outgoingEdges.find(e => e.sourceHandle === `${node.id}-component-${compIndex}-option-${optIndex}`);
                        return { id: edgeForOption ? edgeForOption.target : "", title: option.title };
                    });
                    return { type: 'RadioButtonsGroup', name: 'selection', "data-source": dataSource };
                case 'Image':
                     return { type: 'Image', src: "URL_DE_LA_IMAGEN", height: 250 };
                default:
                    return null;
            }
        }).filter(Boolean);

        formChildren.push({
            type: "Footer",
            label: node.data.footer_label || 'Continuar',
            "on-click-action": { 
                name: "data_exchange", 
                payload: formPayload // <-- Usamos el payload construido dinámicamente
            }
        });

        return {
            id: node.id,
            title: node.data.title || 'Pantalla sin Título',
            layout: { type: "SingleColumnLayout", children: [{ type: "Form", name: `${node.id.toLowerCase()}_form`, children: formChildren }] },
        };
    });

    const finalJson = { name: flowName.toLowerCase().replace(/\s/g, '_'), version: "7.2", data_api_version: "3.0", routing_model, screens };
    setFlowJson(finalJson);
  };

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex' }}>
      <div style={{ width: '250px', padding: '10px', borderRight: '1px solid #ddd', background: '#f8fafc' }}>
        <h3>Constructor</h3>
         <input value={flowName} onChange={(e) => setFlowName(e.target.value)} placeholder="Nombre del Flujo" style={{width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '20px'}} />
        <button onClick={addScreenNode} style={{ padding: '10px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '5px', width: '100%', cursor: 'pointer' }}>
          + Añadir Pantalla
        </button>
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
          <Background color="#e2e8f0" gap={20} />
        </ReactFlow>
      </div>

      <div style={{ width: '400px', padding: '10px', borderLeft: '1px solid #ddd', background: '#f8fafc' }}>
        <h3>JSON del Flujo</h3>
        <button onClick={generateFlowJson} style={{ marginBottom: '10px', padding: '10px', width: '100%', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
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