// src/components/FocusLayout.tsx
import React, { useState } from 'react';
import { LayoutMode } from '@/types';

interface FocusLayoutProps {
  children: React.ReactNode[];
  // 添加这个属性定义
  onLayoutChange?: (mode: LayoutMode, index: number) => void; 
}

export const FocusLayout: React.FC<FocusLayoutProps> = ({ children, onLayoutChange }) => {
  const [layout, setLayout] = useState<LayoutMode>('2x2');
  const [focusedIndex, setFocusedIndex] = useState<number>(0);

  const handleChartClick = (index: number) => {
    let nextLayout: LayoutMode = '2x2';
    let nextIndex = index;

    if (layout === '2x2') {
      nextLayout = '1+3';
      nextIndex = index;
    } else {
      if (index === focusedIndex) {
        nextLayout = '2x2';
      } else {
        nextLayout = '1+3';
        nextIndex = index;
      }
    }

    // 更新内部状态
    setLayout(nextLayout);
    setFocusedIndex(nextIndex);

    // 关键：执行父组件传来的回调，通知状态变更
    if (onLayoutChange) {
      onLayoutChange(nextLayout, nextIndex);
    }
  };

  if (layout === '2x2') {
    return (
      <div className="grid grid-cols-2 grid-rows-2 gap-4 h-[80vh]">
        {children.map((child, i) => (
          <div key={i} onClick={() => handleChartClick(i)} className="cursor-pointer border rounded-lg hover:shadow-lg transition-all">
            {child}
          </div>
        ))}
      </div>
    );
  }

  // 1+3 布局
  const others = [0, 1, 2, 3].filter(i => i !== focusedIndex);

  return (
    <div className="flex h-[80vh] gap-4">
      {/* 左侧大图 */}
      <div className="w-3/4 border rounded-lg cursor-pointer" onClick={() => handleChartClick(focusedIndex)}>
        {children[focusedIndex]}
      </div>
      {/* 右侧三个小图 */}
      <div className="w-1/4 flex flex-col gap-4">
        {others.map(i => (
          <div key={i} className="flex-1 border rounded-lg cursor-pointer overflow-hidden" onClick={() => handleChartClick(i)}>
            <div className="scale-75 origin-top h-full">{children[i]}</div>
          </div>
        ))}
      </div>
    </div>
  );
};