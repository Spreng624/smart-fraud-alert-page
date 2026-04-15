// src/pages/victim/index.tsx
import React, { useEffect, useState } from 'react';
import { FocusLayout } from '@/components/FocusLayout';
import { request } from '@/utils/request';
import { ChartRenderer } from '@/components/ChartRenderer';
import { withResearchAnnotation } from '@/config/analysisAnnotations';

const VictimPage = () => {
  const [charts, setCharts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [layout, setLayout] = useState<'2x2' | '1+3'>('2x2'); // 同步布局状态
  const [focusedIndex, setFocusedIndex] = useState<number>(0);

  const endpoints = ['gender', 'age', 'education', 'wordcloud'];

  useEffect(() => {
    requestAll();
  }, []);

  const requestAll = async () => {
    try {
      const results = await Promise.all(endpoints.map(path => request(`/victim/${path}`)));
      setCharts(results.map((item, index) => withResearchAnnotation('victim', endpoints[index], item)));
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-10 text-center">数据加载中...</div>;

  // 渲染单个卡片的函数
  const renderChartCard = (index: number, isLarge: boolean) => {
    const item = charts[index];
    if (!item) return null;

    return (
      <div className={`flex flex-col h-full bg-white p-4 ${isLarge ? 'gap-4' : ''}`}>
        {/* 图表区域 */}
        <div className={isLarge ? 'flex-[2] min-h-0' : 'flex-1 min-h-0'}>
          <ChartRenderer item={item} />
        </div>

        {/* 解读区域：仅在大图模式(isLarge)下显示 */}
        {isLarge && item.annotations && (
          <div className="flex-1 bg-slate-50 border-t-4 border-blue-600 p-6 rounded-b-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-blue-600 text-xl">🚀</span>
              <h3 className="text-lg font-bold text-slate-800">数据解读</h3>
            </div>
            <p className="text-slate-700 text-base leading-loose whitespace-pre-line font-medium">
              {item.annotations}
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-slate-800 border-l-4 border-blue-600 pl-4">
        电信诈骗数据统计分析
      </h1>
      
      {/* 注意：这里需要微调你的 FocusLayout 组件，
          让它接受 render 函数或者通过状态控制。
          如果 FocusLayout 是你之前写的版本，我们直接传入 children：
      */}
      <FocusLayout 
        onLayoutChange={(l, i) => { setLayout(l); setFocusedIndex(i); }}
      >
        {charts.map((_, idx) => (
          <div key={idx} className="h-full w-full">
            {/* 逻辑判断：如果当前是 1+3 且 index 匹配，则渲染大图版 */}
            {renderChartCard(idx, layout === '1+3' && focusedIndex === idx)}
          </div>
        ))}
      </FocusLayout>
    </div>
  );
};

export default VictimPage;
