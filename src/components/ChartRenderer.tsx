// src/components/ChartRenderer.tsx
import React from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts/core'; // 引入核心
import 'echarts-wordcloud'; // 引入插件

// 定义与后端 JSON 完全一致的接口
interface ChartItem {
  title: string;
  xlabel?: string;
  ylabel?: string;
  data: any[];
  annotations?: string;
  chartType?: 'line' | 'bar' | 'pie'; // 预留扩展字段
}

interface ChartRendererProps {
  item: ChartItem;
}

/**
 * 更加稳健的索引查找逻辑
 */
const findBin = (val: number | undefined, data: any[]) => {
  if (val === undefined || !data || data.length === 0) return 0;

  console.log(`查找数值 ${val} 在区间数据 ${data} 中的索引`);
  const index = data.findIndex((d) => {
    // 自动兼容后端可能的键名：'区间' 或 'label' 或 'bin'
    const rangeStr = d["区间"] || d["label"] || d["bin"];
    if (!rangeStr) return false;

    const parts = rangeStr.split('-').map(Number);
    // 逻辑：val 是否落在 [min, max] 之间
    return val >= parts[0] && val <= parts[1];
  });

  // 调试用：如果没找到，在控制台打印看看数据长什么样
  if (index === -1) {
    console.warn(`无法为数值 ${val} 匹配到区间，请检查数据格式:`, data);
    return 0; 
  }

  return index; 
};

export const ChartRenderer: React.FC<{ item: any }> = ({ item }) => {
  const { type, title, data, xlabel, ylabel, extras } = item;
  type DataPoint = Record<string, unknown>;

  const getOption = () => {
    // 基础共有配置
    const baseOption = {
      title: { text: title, left: 'center' },
      tooltip: { trigger: 'axis' },
      grid: { top: 60, bottom: 50, left: 60, right: 30 },
    };

    switch (type) {
      case 'line':
      case 'bar':
        return {
          ...baseOption,
          xAxis: { type: 'category', name: xlabel, data: data.map((d: DataPoint) => Object.values(d)[0]) },
          yAxis: { type: 'value', name: ylabel },
          series: [{ type, data: data.map((d: DataPoint) => Object.values(d)[1]), smooth: true }]
        };
      case 'weekly_periodic': {
        const labels = Array.isArray(data)
          ? data.map((entry: any) => entry.weekday_label ?? entry.label ?? '')
          : [];
        const values = Array.isArray(data)
          ? data.map((entry: any) => entry.case_count ?? entry.value ?? 0)
          : [];
        const peakDay = extras?.peak_day;

        return {
          ...baseOption,
          tooltip: { trigger: 'axis' },
          xAxis: {
            type: 'category',
            name: xlabel,
            data: labels,
            axisTick: { alignWithLabel: true },
          },
          yAxis: { type: 'value', name: ylabel },
          series: [{
            type: 'bar',
            data: values.map((value: number, index: number) => ({
              value,
              itemStyle: {
                color: labels[index] === peakDay ? '#f97316' : '#2563eb',
              },
              borderRadius: [8, 8, 0, 0],
            })),
            barMaxWidth: 48,
            label: {
              show: true,
              position: 'top',
              color: '#334155',
            },
            markPoint: peakDay ? {
              symbol: 'pin',
              symbolSize: 44,
              itemStyle: { color: '#f97316' },
              data: [{
                name: '峰值',
                coord: [peakDay, Math.max(...values)],
                value: peakDay,
              }],
            } : undefined,
          }],
        };
      }
      case 'distribution': {
        const { x, y, bin_edges } = item.data;
        const { mean, median } = item.extras;
        console.log(item.data);

        return {
          ...baseOption,
          tooltip: {
            trigger: 'axis',
            // 自定义 Tooltip，显示准确的区间范围
            formatter: (params: any) => {
              const idx = params[0].dataIndex;
              return `区间: ${bin_edges[idx].toFixed(1)} - ${bin_edges[idx+1].toFixed(1)}<br/>频数: ${y[idx]}`;
            }
          },
          xAxis: {
            type: 'value', // 数值轴
            name: item.xlabel,
            nameLocation: 'middle',
            nameGap: 30
          },
          yAxis: { type: 'value', name: item.ylabel },
          series: [{
            type: 'bar',
            // 数据格式 [x, y]，ECharts 会自动定位
            data: x.map((val: number, i: number) => [val, y[i]]),
            barWidth: '98%', // 调大宽度，消除柱子间的缝隙，使其更像直方图
            itemStyle: { color: '#60a5fa', opacity: 0.8 },
            markLine: {
              symbol: ['none', 'none'],
              data: [
                {
                  xAxis: mean, // 均值线：直接传数值
                  lineStyle: { color: '#ef4444', type: 'dashed' },
                  label: { formatter: `均值: ${mean.toFixed(2)}` }
                },
                {
                  xAxis: median, // 中位数线：直接传数值
                  lineStyle: { color: '#22c55e', type: 'solid' },
                  label: { formatter: `中位数: ${median.toFixed(2)}` }
                }
              ]
            }
          }]
        };
      }
      
      case 'pie':
        return {
          ...baseOption,
          tooltip: { trigger: 'item' },
          series: [{ type: 'pie', radius: '50%', data: data }]
        };

      
        case 'wordcloud':
        return {
          title: { text: title, left: 'center' },
          series: [{
            type: 'wordCloud', // 这里的 C 必须大写
            shape: 'circle',
            left: 'center',
            top: 'center',
            width: '90%',
            height: '80%',
            right: null,
            bottom: null,
            sizeRange: [12, 60],
            rotationRange: [-90, 90],
            rotationStep: 45,
            gridSize: 8,
            drawOutOfBound: false,
            textStyle: {
              fontFamily: 'sans-serif',
              fontWeight: 'bold',
              color: () => `rgb(${[
                Math.round(Math.random() * 160),
                Math.round(Math.random() * 160),
                Math.round(Math.random() * 160)
              ].join(',')})`
            },
            emphasis: {
              focus: 'self',
              textStyle: { shadowBlur: 10, shadowColor: '#333' }
            },
            data: data // 后端传来的 [{"name": "宝妈", "value": 100}, ...]
          }]
        };
        default:
        return baseOption;
    }
  };

  return <ReactECharts option={getOption()} style={{ height: '100%' }} />;
};
