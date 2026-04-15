import { useEffect, useMemo, useState } from 'react';
import { ArrowRightLeft, BotMessageSquare, Network, RadioTower } from 'lucide-react';
import {
  CytoscapeGraph,
  type GraphEdgeData,
  type GraphMemberData,
  type GraphNodeData,
} from '@/components/CytoscapeGraph';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DASHBOARD_USES_LOCAL_DATA, request } from '@/utils/request';

type UnknownRecord = Record<string, unknown>;

interface GraphCategory {
  slug: string;
  title: string;
  description?: string;
  count?: number;
}

interface NormalizedGraph {
  categoryTitle: string;
  nodes: GraphNodeData[];
  edges: GraphEdgeData[];
}

type GraphSelection =
  | { kind: 'node'; data: GraphNodeData }
  | { kind: 'edge'; data: GraphEdgeData }
  | null;

const NODE_COLORS: Record<string, string> = {
  Media: '#2980b9',
  Script: '#16a085',
  Action: '#f39c12',
};

const NODE_LABELS: Record<string, string> = {
  Media: '媒介节点',
  Script: '话术节点',
  Action: '动作节点',
};

const EDGE_COLORS: Record<string, string> = {
  MEDIA_HAS_SCRIPT: '#3498db',
  SCRIPT_INDUCES_ACTION: '#27ae60',
  ACTION_PRECEDES_ACTION: '#d35400',
};

const EDGE_LABELS: Record<string, string> = {
  MEDIA_HAS_SCRIPT: '媒介触达话术',
  SCRIPT_INDUCES_ACTION: '话术诱导动作',
  ACTION_PRECEDES_ACTION: '动作前后衔接',
};

const LAYER_BY_TYPE: Record<string, number> = {
  Media: 0,
  Script: 1,
  Action: 2,
};

const VISIBLE_NODE_TYPES = new Set(Object.keys(NODE_COLORS));

const toRecord = (value: unknown): UnknownRecord =>
  typeof value === 'object' && value !== null ? (value as UnknownRecord) : {};

const toText = (value: unknown, fallback = '') => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return fallback;
};

const toNumber = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatCount = (value: number) => new Intl.NumberFormat('zh-CN').format(value);

const formatLoss = (value: number) => {
  if (!value) return '暂无';
  if (value >= 10000) return `${(value / 10000).toFixed(2)} 万元`;
  return `${value.toFixed(0)} 元`;
};

const normalizeCategories = (payload: unknown, manifest: unknown): GraphCategory[] => {
  const manifestRecord = toRecord(manifest);
  const payloadRecord = toRecord(payload);

  const rawList = Array.isArray(payload)
    ? payload
    : Array.isArray(payloadRecord.categories)
      ? (payloadRecord.categories as unknown[])
      : Array.isArray(manifestRecord.categories)
        ? (manifestRecord.categories as unknown[])
        : [];

  return rawList.reduce<GraphCategory[]>((result, item) => {
    const record = toRecord(item);
    const slug = toText(record.slug || record.id || record.key);
    if (!slug) return result;

    result.push({
      slug,
      title: toText(record.title || record.name || record.label, slug),
      description: toText(record.description || record.summary) || undefined,
      count: toNumber(record.count || record.case_count || record.size || 0) || undefined,
    });

    return result;
  }, []);
};

const normalizeGraph = (payload: unknown): NormalizedGraph => {
  const source = toRecord(payload);
  const rawNodes = Array.isArray(source.nodes) ? source.nodes : [];
  const rawEdges = Array.isArray(source.edges) ? source.edges : [];
  let scriptIndex = 0;

  const nodes: GraphNodeData[] = rawNodes
    .map<GraphNodeData | null>((item, index) => {
      const record = toRecord(item);
      const nodeType = toText(record.node_type || record.category || record.type || record.kind);
      if (!VISIBLE_NODE_TYPES.has(nodeType)) return null;

      const id = toText(record.node_id || record.id || `node-${index}`);
      if (!id) return null;

      const layer =
        nodeType === 'Script'
          ? 1 + (scriptIndex++ % 2)
          : nodeType === 'Action'
            ? 3
            : LAYER_BY_TYPE[nodeType] ?? 0;

      return {
        id,
        label: toText(record.node_name || record.label || record.name, id),
        category: nodeType,
        color: NODE_COLORS[nodeType] || '#666666',
        size: toNumber(record.symbol_size || record.size || 16),
        nodeType,
        concept: toText(record.concept),
        subtype: toText(record.subtype),
        caseCount: toNumber(record.case_count),
        lossSum: toNumber(record.loss_sum),
        layer,
        group: toText(record.group || record.node_name || record.label || record.name, id),
        isGroupProxy: Boolean(record.is_group_proxy),
        memberCount: toNumber(record.member_count || 1),
        memberPreview: Array.isArray(record.member_preview)
          ? record.member_preview.map((item) => toText(item)).filter(Boolean)
          : [],
        members: Array.isArray(record.members)
          ? record.members.map((member) => {
              const memberRecord = toRecord(member);
              return {
                node_id: toText(memberRecord.node_id || memberRecord.id),
                node_name: toText(memberRecord.node_name || memberRecord.label || memberRecord.name),
                node_type: toText(memberRecord.node_type || memberRecord.type || memberRecord.kind),
                group: toText(memberRecord.group),
                case_count: toNumber(memberRecord.case_count),
                loss_sum: toNumber(memberRecord.loss_sum),
                symbol_size: toNumber(memberRecord.symbol_size || memberRecord.size || 16),
              } as GraphMemberData;
            })
          : [],
        raw: record,
      };
    })
    .filter((node): node is GraphNodeData => node !== null);

  const nodeIdSet = new Set(nodes.map((node) => node.id));

  const edges: GraphEdgeData[] = rawEdges
    .map((item, index) => {
      const record = toRecord(item);
      const sourceId = toText(record.src_id || record.source || record.from);
      const targetId = toText(record.dst_id || record.target || record.to);
      if (!sourceId || !targetId || !nodeIdSet.has(sourceId) || !nodeIdSet.has(targetId)) return null;

      const edgeType = toText(record.edge_type || record.relation || record.type);
      return {
        id: toText(record.id, `e_${index}_${sourceId}_${targetId}`),
        source: sourceId,
        target: targetId,
        label: edgeType,
        color: EDGE_COLORS[edgeType] || '#999999',
        edgeType,
        directed: Boolean(record.directed),
        caseCount: toNumber(record.case_count),
        lossSum: toNumber(record.loss_sum),
        width: toNumber(record.line_width || record.width || 1),
        raw: record,
      };
    })
    .filter((edge): edge is GraphEdgeData => edge !== null);

  return {
    categoryTitle: toText(source.category || source.title, '图谱视图'),
    nodes,
    edges,
  };
};

const getThresholdBounds = (graph: NormalizedGraph) => {
  const values = [
    ...graph.nodes.map((node) => node.caseCount),
    ...graph.edges.map((edge) => edge.caseCount),
  ].filter((value) => value > 0);

  if (values.length === 0) return { min: 20, max: 20, initial: 20 };
  return { min: 20, max: 100, initial: 20 };
};

const filterGraphByThreshold = (graph: NormalizedGraph, threshold: number) => {
  const candidateNodes = graph.nodes
    .filter((node) => node.caseCount >= threshold)
    .sort((a, b) => b.caseCount - a.caseCount)
    .slice(0, 220);

  const candidateNodeIds = new Set(candidateNodes.map((node) => node.id));

  const edges = graph.edges
    .filter(
      (edge) =>
        edge.caseCount >= threshold &&
        candidateNodeIds.has(edge.source) &&
        candidateNodeIds.has(edge.target),
    )
    .sort((a, b) => b.caseCount - a.caseCount)
    .slice(0, 600);

  const connectedNodeIds = new Set<string>();
  edges.forEach((edge) => {
    connectedNodeIds.add(edge.source);
    connectedNodeIds.add(edge.target);
  });

  const nodes = candidateNodes.filter((node) => connectedNodeIds.has(node.id));
  return { nodes, edges };
};

const getSelectionTitle = (selection: GraphSelection) => {
  if (!selection) return '交互说明';
  if (selection.kind === 'node') return selection.data.label;
  return EDGE_LABELS[selection.data.edgeType] || selection.data.label || '关系边';
};

const getSelectionDescription = (selection: GraphSelection) => {
  if (!selection) {
    return '点击图中的节点或关系边，这里会显示当前选中对象的链路含义、涉案规模和补充信息。';
  }

  if (selection.kind === 'node') {
    const typeLabel = NODE_LABELS[selection.data.nodeType] || selection.data.nodeType;
    if (selection.data.isGroupProxy) {
      return `${typeLabel}聚合了同组近义节点，可再次点击展开成员明细。`;
    }
    return `${typeLabel}用于表示该诈骗类别中的关键环节，可结合左右相邻节点理解其前后链路。`;
  }

  return '关系边描述了链路中不同环节的连接方式，可用于观察典型诈骗流程如何逐步推进。';
};

export default function GraphPage() {
  const [manifest, setManifest] = useState<unknown>(null);
  const [categories, setCategories] = useState<GraphCategory[]>([]);
  const [selectedSlug, setSelectedSlug] = useState('');
  const [loading, setLoading] = useState(true);
  const [graphLoading, setGraphLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [rawGraph, setRawGraph] = useState<NormalizedGraph>({ categoryTitle: '', nodes: [], edges: [] });
  const [caseThreshold, setCaseThreshold] = useState(20);
  const [selection, setSelection] = useState<GraphSelection>(null);

  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true);
      setErrorMessage('');

      try {
        const [manifestData, categoryData] = await Promise.all([
          request('/graph/manifest'),
          request('/graph/categories'),
        ]);

        const normalizedCategories = normalizeCategories(categoryData, manifestData);
        const manifestRecord = toRecord(manifestData);
        const defaultSlug = toText(
          manifestRecord.default_category ||
            manifestRecord.defaultCategory ||
            manifestRecord.initial_category ||
            manifestRecord.initialCategory,
        );

        setManifest(manifestData);
        setCategories(normalizedCategories);
        setSelectedSlug(defaultSlug || normalizedCategories[0]?.slug || '');
      } catch (error) {
        console.error(error);
        setErrorMessage('图谱入口数据加载失败。');
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  useEffect(() => {
    if (!selectedSlug) return;

    const loadCategoryGraph = async () => {
      setGraphLoading(true);
      setErrorMessage('');
      setSelection(null);

      try {
        const graphData = await request(`/graph/by-category/${selectedSlug}`);
        const nextGraph = normalizeGraph(graphData);
        const thresholdBounds = getThresholdBounds(nextGraph);

        setRawGraph(nextGraph);
        setCaseThreshold(thresholdBounds.initial);
      } catch (error) {
        console.error(error);
        setRawGraph({ categoryTitle: '', nodes: [], edges: [] });
        setErrorMessage('当前诈骗类别图谱加载失败。');
      } finally {
        setGraphLoading(false);
      }
    };

    loadCategoryGraph();
  }, [selectedSlug]);

  const manifestRecord = toRecord(manifest);
  const selectedCategory = categories.find((item) => item.slug === selectedSlug);
  const thresholdBounds = useMemo(() => getThresholdBounds(rawGraph), [rawGraph]);
  const graph = useMemo(() => filterGraphByThreshold(rawGraph, caseThreshold), [rawGraph, caseThreshold]);

  const mediaNodeCount = graph.nodes.filter((node) => node.nodeType === 'Media').length;
  const scriptNodeCount = graph.nodes.filter((node) => node.nodeType === 'Script').length;
  const actionNodeCount = graph.nodes.filter((node) => node.nodeType === 'Action').length;

  return (
    <div className="space-y-6 px-4 sm:px-6">
      {DASHBOARD_USES_LOCAL_DATA && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          当前模块已固定使用本地静态图谱 JSON 数据展示。
        </div>
      )}
      {loading ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-16 text-center text-slate-500">
          正在加载图谱入口信息…
        </div>
      ) : errorMessage && !selectedSlug ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">{errorMessage}</div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <div className="space-y-6">
            <Card className="border border-stone-200 bg-[#fffdf8] shadow-lg shadow-stone-200/60">
              <CardHeader>
                <CardTitle>筛选与说明</CardTitle>
                <CardDescription>按诈骗类别和涉案阈值筛选核心链路，降低图谱拥挤度。</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <label htmlFor="graph-category" className="mb-2 block text-sm font-medium text-stone-700">
                    诈骗类别
                  </label>
                  <select
                    id="graph-category"
                    value={selectedSlug}
                    onChange={(event) => setSelectedSlug(event.target.value)}
                    className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                  >
                    {categories.map((category) => (
                      <option key={category.slug} value={category.slug}>
                        {typeof category.count === 'number'
                          ? `${category.title}（${category.count}）`
                          : category.title}
                      </option>
                    ))}
                  </select>
                  {selectedCategory?.description && (
                    <p className="mt-2 text-sm leading-6 text-stone-500">{selectedCategory.description}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="case-threshold" className="mb-2 block text-sm font-medium text-stone-700">
                    最小案件阈值
                  </label>
                  <input
                    id="case-threshold"
                    type="range"
                    min={thresholdBounds.min}
                    max={thresholdBounds.max}
                    step={1}
                    value={Math.min(Math.max(caseThreshold, thresholdBounds.min), thresholdBounds.max)}
                    onChange={(event) => setCaseThreshold(Number(event.target.value))}
                    className="w-full accent-amber-600"
                  />
                  <p className="mt-2 text-sm text-stone-500">当前阈值：{caseThreshold}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-stone-200 bg-white p-4">
                    <div className="text-xs text-stone-500">当前节点数</div>
                    <div className="mt-1 text-2xl font-semibold text-stone-900">{graph.nodes.length}</div>
                  </div>
                  <div className="rounded-xl border border-stone-200 bg-white p-4">
                    <div className="text-xs text-stone-500">当前边数</div>
                    <div className="mt-1 text-2xl font-semibold text-stone-900">{graph.edges.length}</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl border border-stone-200 bg-white p-4">
                    <div className="text-xs text-stone-500">媒介节点</div>
                    <div className="mt-1 text-2xl font-semibold text-stone-900">{mediaNodeCount}</div>
                  </div>
                  <div className="rounded-xl border border-stone-200 bg-white p-4">
                    <div className="text-xs text-stone-500">话术节点</div>
                    <div className="mt-1 text-2xl font-semibold text-stone-900">{scriptNodeCount}</div>
                  </div>
                  <div className="rounded-xl border border-stone-200 bg-white p-4">
                    <div className="text-xs text-stone-500">动作节点</div>
                    <div className="mt-1 text-2xl font-semibold text-stone-900">{actionNodeCount}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-stone-700">节点图例</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(NODE_COLORS).map(([label, color]) => (
                      <span
                        key={label}
                        className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-700"
                      >
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                        {NODE_LABELS[label] || label}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 rounded-2xl border border-stone-200 bg-white p-4 text-sm leading-6 text-stone-600">
                  <div className="flex items-start gap-3">
                    <RadioTower className="mt-0.5 h-4 w-4 text-sky-600" />
                    <span>媒介节点表示诈骗接触入口，例如短信、社交平台或通话渠道。</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <BotMessageSquare className="mt-0.5 h-4 w-4 text-emerald-600" />
                    <span>话术节点表示建立信任、制造紧迫感或诱导操作的核心脚本。</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <ArrowRightLeft className="mt-0.5 h-4 w-4 text-amber-600" />
                    <span>动作节点表示下载 App、共享屏幕、转账汇款等执行动作。</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border border-stone-200 bg-[#fffdf8] shadow-lg shadow-stone-200/60">
              <CardHeader>
                <div className="space-y-2 text-left">
                  <CardTitle>{selectedCategory?.title || rawGraph.categoryTitle || '图谱视图'}</CardTitle>
                  <CardDescription>
                    {selectedCategory?.description || '只保留满足阈值且保持连通关系的核心节点与边。'}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {errorMessage && selectedSlug && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {errorMessage}
                  </div>
                )}

                {graphLoading ? (
                  <div className="flex h-[720px] items-center justify-center rounded-2xl bg-[#f8f4ea] text-stone-500">
                    正在加载图谱视图…
                  </div>
                ) : graph.nodes.length === 0 ? (
                  <div className="flex h-[720px] items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-[#f8f4ea] text-stone-500">
                    当前阈值下没有可展示的连通链路。
                  </div>
                ) : (
                  <CytoscapeGraph nodes={graph.nodes} edges={graph.edges} onSelectionChange={setSelection} />
                )}
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_320px]">
              <Card className="border border-stone-200 bg-[#fffdf8] shadow-lg shadow-stone-200/60">
                <CardHeader>
                  <CardTitle>{getSelectionTitle(selection)}</CardTitle>
                  <CardDescription>{getSelectionDescription(selection)}</CardDescription>
                </CardHeader>
                <CardContent>
                  {!selection ? (
                    <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-5 py-8 text-sm leading-7 text-stone-500">
                      点击任意节点可以查看该媒介、话术或动作在当前诈骗类别中的作用；点击关系边则可以查看链路衔接含义。如果节点是聚合节点，还可以再次点击展开成员。
                    </div>
                  ) : selection.kind === 'node' ? (
                    <div className="space-y-4">
                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl border border-stone-200 bg-white p-4">
                          <div className="text-xs text-stone-500">节点类型</div>
                          <div className="mt-2 text-lg font-semibold text-stone-900">
                            {NODE_LABELS[selection.data.nodeType] || selection.data.nodeType}
                          </div>
                        </div>
                        <div className="rounded-2xl border border-stone-200 bg-white p-4">
                          <div className="text-xs text-stone-500">关联案件数</div>
                          <div className="mt-2 text-lg font-semibold text-stone-900">
                            {formatCount(selection.data.caseCount)}
                          </div>
                        </div>
                        <div className="rounded-2xl border border-stone-200 bg-white p-4">
                          <div className="text-xs text-stone-500">累计损失</div>
                          <div className="mt-2 text-lg font-semibold text-stone-900">
                            {formatLoss(selection.data.lossSum)}
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-4 lg:grid-cols-2">
                        <div className="rounded-2xl border border-stone-200 bg-white p-4">
                          <div className="text-sm font-semibold text-stone-800">节点补充信息</div>
                          <div className="mt-3 space-y-3 text-sm text-stone-600">
                            <div><span className="font-medium text-stone-700">概念：</span>{selection.data.concept || '暂无'}</div>
                            <div><span className="font-medium text-stone-700">子类型：</span>{selection.data.subtype || '暂无'}</div>
                            <div><span className="font-medium text-stone-700">分组：</span>{selection.data.group || '暂无'}</div>
                            <div><span className="font-medium text-stone-700">成员数量：</span>{selection.data.memberCount || 1}</div>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-stone-200 bg-white p-4">
                          <div className="text-sm font-semibold text-stone-800">成员预览</div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {(selection.data.memberPreview.length > 0
                              ? selection.data.memberPreview
                              : selection.data.members.slice(0, 8).map((item) => item.node_name)
                            ).map((item) => (
                              <span
                                key={item}
                                className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs text-stone-600"
                              >
                                {item}
                              </span>
                            ))}
                            {selection.data.memberPreview.length === 0 && selection.data.members.length === 0 && (
                              <span className="text-sm text-stone-500">暂无成员预览</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl border border-stone-200 bg-white p-4">
                          <div className="text-xs text-stone-500">关系类型</div>
                          <div className="mt-2 text-lg font-semibold text-stone-900">
                            {EDGE_LABELS[selection.data.edgeType] || selection.data.label || selection.data.edgeType}
                          </div>
                        </div>
                        <div className="rounded-2xl border border-stone-200 bg-white p-4">
                          <div className="text-xs text-stone-500">关联案件数</div>
                          <div className="mt-2 text-lg font-semibold text-stone-900">
                            {formatCount(selection.data.caseCount)}
                          </div>
                        </div>
                        <div className="rounded-2xl border border-stone-200 bg-white p-4">
                          <div className="text-xs text-stone-500">累计损失</div>
                          <div className="mt-2 text-lg font-semibold text-stone-900">
                            {formatLoss(selection.data.lossSum)}
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-stone-200 bg-white p-4 text-sm leading-7 text-stone-600">
                        <div><span className="font-medium text-stone-700">起点节点：</span>{selection.data.source}</div>
                        <div className="mt-2"><span className="font-medium text-stone-700">终点节点：</span>{selection.data.target}</div>
                        <div className="mt-2"><span className="font-medium text-stone-700">方向性：</span>{selection.data.directed ? '有向关系' : '无向关系'}</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border border-stone-200 bg-[#fffdf8] shadow-lg shadow-stone-200/60">
                <CardHeader>
                  <CardTitle>阅读路径</CardTitle>
                  <CardDescription>先看入口媒介，再顺着话术与动作往右读。</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm leading-6 text-stone-600">
                  <div className="rounded-2xl border border-stone-200 bg-white p-4">
                    <div className="flex items-center gap-2 font-semibold text-stone-800">
                      <RadioTower className="h-4 w-4 text-sky-600" />
                      入口媒介
                    </div>
                    <p className="mt-2">表示诈骗者最初接触受害人的渠道，是链路的起点。</p>
                  </div>
                  <div className="rounded-2xl border border-stone-200 bg-white p-4">
                    <div className="flex items-center gap-2 font-semibold text-stone-800">
                      <BotMessageSquare className="h-4 w-4 text-emerald-600" />
                      核心话术
                    </div>
                    <p className="mt-2">展示建立信任、制造紧迫感、引导操作的关键语言模式。</p>
                  </div>
                  <div className="rounded-2xl border border-stone-200 bg-white p-4">
                    <div className="flex items-center gap-2 font-semibold text-stone-800">
                      <Network className="h-4 w-4 text-amber-600" />
                      执行动作
                    </div>
                    <p className="mt-2">通常是下载 App、共享屏幕、转账汇款等最终落地动作。</p>
                  </div>
                  {Boolean(manifestRecord.updated_at) && (
                    <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-4 text-xs text-stone-500">
                      图谱产物更新时间：{toText(manifestRecord.updated_at)}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
