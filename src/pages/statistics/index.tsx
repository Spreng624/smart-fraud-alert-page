import { useEffect, useState } from 'react';
import { ChartRenderer } from '@/components/ChartRenderer';
import { FocusLayout } from '@/components/FocusLayout';
import { withResearchAnnotation } from '@/config/analysisAnnotations';
import { DASHBOARD_USES_LOCAL_DATA, request } from '@/utils/request';

const endpoints = ['cases_by_year', 'fraud_amount', 'fraud_types', 'weekly_periodic'] as const;

export default function StatisticsPage() {
  const [charts, setCharts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [layout, setLayout] = useState<'2x2' | '1+3'>('2x2');
  const [focusedIndex, setFocusedIndex] = useState(0);

  useEffect(() => {
    const requestAll = async () => {
      try {
        const results = await Promise.all(endpoints.map((path) => request(`/statistics/${path}`)));
        setCharts(results.map((item, index) => withResearchAnnotation('statistics', endpoints[index], item)));
      } finally {
        setLoading(false);
      }
    };

    requestAll();
  }, []);

  if (loading) {
    return <div className="p-10 text-center text-slate-500">数据加载中...</div>;
  }

  const renderChartCard = (index: number, isLarge: boolean) => {
    const item = charts[index];
    if (!item) return null;

    return (
      <div className={`flex h-full flex-col bg-white p-4 ${isLarge ? 'gap-4' : ''}`}>
        <div className={isLarge ? 'min-h-0 flex-[2]' : 'min-h-0 flex-1'}>
          <ChartRenderer item={item} />
        </div>

        {isLarge && item.annotations && (
          <div className="flex-1 rounded-b-lg border-t-4 border-blue-600 bg-slate-50 p-6">
            <div className="mb-3 flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-800">数据解读</h3>
            </div>
            <p className="whitespace-pre-line text-base font-medium leading-loose text-slate-700">
              {item.annotations}
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="mb-6 border-l-4 border-blue-600 pl-4 text-2xl font-bold text-slate-800">
        电信诈骗数据统计分析
      </h1>

      {DASHBOARD_USES_LOCAL_DATA && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          当前模块已固定使用本地静态 JSON 数据展示。
        </div>
      )}

      <FocusLayout
        onLayoutChange={(nextLayout, index) => {
          setLayout(nextLayout);
          setFocusedIndex(index);
        }}
      >
        {charts.map((_, index) => (
          <div key={index} className="h-full w-full">
            {renderChartCard(index, layout === '1+3' && focusedIndex === index)}
          </div>
        ))}
      </FocusLayout>
    </div>
  );
}
