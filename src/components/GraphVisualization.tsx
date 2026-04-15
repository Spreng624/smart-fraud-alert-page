import React, { useEffect, useRef } from "react";
import * as echarts from "echarts";
import graphData from "./scamGraph.json"; // 上面保存的 JSON 文件

const GraphVisualization = () => {
  const chartRef = useRef(null);

  useEffect(() => {
    const chart = echarts.init(chartRef.current);

    const option = {
      tooltip: {},
      series: [
        {
          type: "graph",
          layout: "force",
          roam: true,
          label: {
            show: true,
            position: "top"
          },
          edgeSymbol: ["none", "arrow"],
          edgeLabel: {
            show: true,
            formatter: "{c}",
          },
          data: graphData.nodes.map(node => ({
            id: node.id,
            name: node.id,
            category: node.label,
            symbolSize: 50
          })),
          links: graphData.edges.map(edge => ({
            source: edge.source,
            target: edge.target,
            label: { show: true, formatter: edge.label }
          })),
          force: {
            repulsion: 200
          }
        }
      ]
    };

    chart.setOption(option);

    window.addEventListener("resize", () => chart.resize());

    return () => {
      window.removeEventListener("resize", () => chart.resize());
      chart.dispose();
    };
  }, []);

  return <div ref={chartRef} style={{ width: "100%", height: "600px" }} />;
};

export default GraphVisualization;