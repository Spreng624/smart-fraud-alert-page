import React from 'react';
import ReactECharts from 'echarts-for-react';

const FeatureEvolution: React.FC = () => {
  const evolutionOption = {
    title: { text: '典型诈骗手法演变趋势' },
    legend: { bottom: 0 },
    xAxis: { type: 'category', data: ['2021', '2022', '2023', '2024', '2025'] },
    yAxis: { type: 'value' },
    series: [
      { name: '传统电话', type: 'line', data: [80, 70, 55, 40, 30] },
      { name: 'FaceTime/社交媒体', type: 'line', data: [10, 25, 45, 70, 95] }
    ]
  };

  return (
    <div className="space-y-6">
      <ReactECharts option={evolutionOption} style={{ height: '450px' }} />
      <div className="p-4 bg-blue-50 rounded-lg text-xs text-blue-700">
        注：数据基于项目书提及的 2017-2025 案件审结趋势及同比百分比进行模拟还原。
      </div>
    </div>
  );
};

export default FeatureEvolution;