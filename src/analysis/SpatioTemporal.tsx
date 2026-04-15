import React from 'react';
import ReactECharts from 'echarts-for-react';

const SpatioTemporal: React.FC = () => {
  const option = {
    title: { text: '诈骗高发时段统计', left: 'center' },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: ['0-4时', '4-8时', '8-12时', '12-16时', '16-20时', '20-24时'] },
    yAxis: { type: 'value' },
    series: [{
      data: [120, 80, 450, 680, 920, 750],
      type: 'bar',
      itemStyle: { color: '#3b82f6' }
    }]
  };

  return (
    <div className="space-y-6">
      <div className="h-[400px] w-full bg-gray-50 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-200">
        <p className="text-gray-400">全国诈骗态势热力图 (待对接地理坐标数据)</p>
      </div>
      <ReactECharts option={option} />
    </div>
  );
};

export default SpatioTemporal;