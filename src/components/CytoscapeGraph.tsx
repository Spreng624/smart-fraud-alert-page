import { useEffect, useMemo, useRef } from 'react';
import cytoscape, { type Core, type ElementDefinition } from 'cytoscape';
import dagre from 'cytoscape-dagre';

export interface GraphMemberData {
  node_id: string;
  node_name: string;
  node_type: string;
  group: string;
  case_count: number;
  loss_sum: number;
  symbol_size: number;
}

export interface GraphNodeData {
  id: string;
  label: string;
  category: string;
  color: string;
  raw: Record<string, unknown>;
  size: number;
  nodeType: string;
  concept: string;
  subtype: string;
  caseCount: number;
  lossSum: number;
  layer: number;
  group: string;
  isGroupProxy: boolean;
  memberCount: number;
  memberPreview: string[];
  members: GraphMemberData[];
}

export interface GraphEdgeData {
  id: string;
  source: string;
  target: string;
  label: string;
  color: string;
  raw: Record<string, unknown>;
  edgeType: string;
  directed: boolean;
  caseCount: number;
  lossSum: number;
  width: number;
}

interface CytoscapeGraphProps {
  nodes: GraphNodeData[];
  edges: GraphEdgeData[];
  onSelectionChange?: (
    selection:
      | { kind: 'node'; data: GraphNodeData }
      | { kind: 'edge'; data: GraphEdgeData }
      | null,
  ) => void;
}

cytoscape.use(dagre);

const layoutOptions = {
  name: 'dagre' as const,
  rankDir: 'LR' as const,
  rankSep: 220,
  nodeSep: 100,
  edgeSep: 60,
  fit: true,
  padding: 80,
  animate: false,
  sort: (a: cytoscape.NodeSingular, b: cytoscape.NodeSingular) =>
    ((a.data('layer') ?? 0) - (b.data('layer') ?? 0)) ||
    (Number(b.data('caseCount') || 0) - Number(a.data('caseCount') || 0)) ||
    String(a.data('label')).localeCompare(String(b.data('label')), 'zh-Hans-CN'),
};

const getNodeSize = (element: cytoscape.SingularElementReturnValue) =>
  `${Math.max(28, Number(element.data('size') || 16) * 1.8)}px`;

const getEdgeWidth = (element: cytoscape.SingularElementReturnValue) =>
  `${Math.max(1.5, Number(element.data('width') || 1) * 1.35)}px`;

const buildGraphElements = (
  nodes: GraphNodeData[],
  edges: GraphEdgeData[],
): ElementDefinition[] => {
  return [
    ...nodes.map((node) => ({
      data: {
        ...node,
      },
    })),
    ...edges.map((edge) => ({
      data: {
        ...edge,
      },
    })),
  ];
};

export const CytoscapeGraph = ({
  nodes,
  edges,
  onSelectionChange,
}: CytoscapeGraphProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cyRef = useRef<Core | null>(null);
  const expandedGroupIdsRef = useRef<Set<string>>(new Set());

  const elements = useMemo<ElementDefinition[]>(() => buildGraphElements(nodes, edges), [nodes, edges]);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const cy = cytoscape({
      container: containerRef.current,
      elements,
      wheelSensitivity: 2.0,
      minZoom: 0.15,
      maxZoom: 3,
      style: [
        {
          selector: 'node',
          style: {
            label: 'data(label)',
            'background-color': 'data(color)',
            width: getNodeSize,
            height: getNodeSize,
            color: '#1f2933',
            'font-size': 14,
            'font-weight': 600,
            'text-valign': 'center',
            'text-halign': 'center',
            'text-wrap': 'wrap',
            'text-max-width': '130px',
            'text-outline-width': '3px',
            'text-outline-color': '#f8f4ea',
            'border-width': (element: cytoscape.SingularElementReturnValue) =>
              element.data('isGroupProxy') ? '2.5px' : '1.5px',
            'border-style': (element: cytoscape.SingularElementReturnValue) =>
              element.data('isGroupProxy') ? 'double' : 'solid',
            'border-color': '#ffffff',
            'overlay-opacity': 0,
          },
        },
        {
          selector: 'edge',
          style: {
            width: getEdgeWidth,
            'line-color': 'data(color)',
            'target-arrow-color': 'data(color)',
            'target-arrow-shape': (element: cytoscape.SingularElementReturnValue) =>
              element.data('directed') ? 'triangle' : 'none',
            'curve-style': 'straight',
            opacity: 0.58,
            'arrow-scale': 1.1,
            label: 'data(label)',
            color: '#475569',
            'font-size': 10,
            'text-background-opacity': 1,
            'text-background-color': '#fffdf8',
            'text-background-padding': '3px',
            'text-rotation': 'autorotate',
            'control-point-step-size': 40,
            'overlay-opacity': 0,
          },
        },
        {
          selector: '.is-faded',
          style: {
            opacity: 0.14,
          },
        },
        {
          selector: '.is-hovered',
          style: {
            opacity: 1,
          },
        },
        {
          selector: '.is-selected',
          style: {
            'border-color': '#111827',
            'border-width': '3px',
            'line-color': '#111827',
            'target-arrow-color': '#111827',
            opacity: 1,
            'z-index': 999,
          },
        },
        {
          selector: '.is-expanded',
          style: {
            'border-color': '#92400e',
            'border-width': '3px',
          },
        },
      ] as any,
    });

    const clearVisualSelection = () => {
      cy.elements().removeClass('is-selected is-faded is-hovered');
    };

    const collapseMembers = (proxyId: string) => {
      cy.elements(`[parentProxyId = "${proxyId}"]`).remove();
      cy.getElementById(proxyId).removeClass('is-expanded');
    };

    const expandMembers = (proxyId: string) => {
      const proxy = cy.getElementById(proxyId);
      if (!proxy.length || !proxy.data('isGroupProxy')) {
        return;
      }

      const members = Array.isArray(proxy.data('members')) ? (proxy.data('members') as GraphMemberData[]) : [];
      if (members.length === 0) {
        return;
      }

      collapseMembers(proxyId);

      const center = proxy.position();
      const radius = Math.max(110, 42 * members.length);
      const memberElements: ElementDefinition[] = [];

      members.forEach((member, index) => {
        const angle = (Math.PI * 2 * index) / members.length - Math.PI / 2;
        const memberId = `member::${proxyId}::${member.node_id}`;
        memberElements.push({
          data: {
            id: memberId,
            label: member.node_name,
            category: member.node_type,
            color: nodes.find((node) => node.nodeType === member.node_type)?.color || '#666666',
            raw: member as unknown as Record<string, unknown>,
            size: Number(member.symbol_size || 18),
            nodeType: member.node_type,
            concept: '',
            subtype: '',
            caseCount: Number(member.case_count || 0),
            lossSum: Number(member.loss_sum || 0),
            layer: 0,
            group: member.group || proxy.data('group') || '',
            isGroupProxy: false,
            memberCount: 1,
            memberPreview: [],
            members: [],
            parentProxyId: proxyId,
            isMemberNode: true,
          },
          position: {
            x: center.x + Math.cos(angle) * radius,
            y: center.y + Math.sin(angle) * radius,
          },
        });
        memberElements.push({
          data: {
            id: `member-edge::${memberId}`,
            source: proxyId,
            target: memberId,
            label: '',
            color: '#92400e',
            raw: {},
            edgeType: 'GROUP_MEMBER',
            directed: false,
            caseCount: Number(member.case_count || 0),
            lossSum: Number(member.loss_sum || 0),
            width: 1,
            parentProxyId: proxyId,
            isMemberEdge: true,
          },
        });
      });

      cy.add(memberElements);
      proxy.addClass('is-expanded');
    };

    cy.on('mouseover', 'node', (event) => {
      const node = event.target;
      cy.elements().addClass('is-faded').removeClass('is-hovered');
      node.removeClass('is-faded').addClass('is-hovered');
      node.connectedEdges().removeClass('is-faded').addClass('is-hovered');
      node.connectedEdges().connectedNodes().removeClass('is-faded').addClass('is-hovered');
    });

    cy.on('mouseout', 'node', () => {
      cy.elements().removeClass('is-faded is-hovered');
    });

    cy.on('tap', (event) => {
      if (event.target === cy) {
        clearVisualSelection();
        onSelectionChange?.(null);
      }
    });

    cy.on('tap', 'node', (event) => {
      const node = event.target;
      clearVisualSelection();
      node.addClass('is-selected');
      node.connectedEdges().addClass('is-selected');
      onSelectionChange?.({ kind: 'node', data: node.data() as GraphNodeData });

      if (!node.data('isGroupProxy')) {
        return;
      }

      const proxyId = String(node.id());
      if (expandedGroupIdsRef.current.has(proxyId)) {
        expandedGroupIdsRef.current.delete(proxyId);
        collapseMembers(proxyId);
      } else {
        expandedGroupIdsRef.current.add(proxyId);
        expandMembers(proxyId);
      }
    });

    cy.on('tap', 'edge', (event) => {
      const edge = event.target;
      clearVisualSelection();
      edge.addClass('is-selected');
      edge.connectedNodes().addClass('is-selected');
      onSelectionChange?.({ kind: 'edge', data: edge.data() as GraphEdgeData });
    });

    cyRef.current = cy;
    cy.layout(layoutOptions).run();
    cy.fit(undefined, 60);

    const resizeObserver = new ResizeObserver(() => {
      cy.resize();
      cy.fit(undefined, 60);
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      cy.destroy();
      cyRef.current = null;
    };
  }, [elements, nodes, onSelectionChange]);

  return <div ref={containerRef} className="h-[720px] w-full rounded-2xl bg-[#f8f4ea]" />;
};
