// src/components/RiskScanner.tsx
import React, { useState } from 'react';

interface RiskScannerProps {
  type: string;
  placeholder: string;
}

export const RiskScanner: React.FC<RiskScannerProps> = ({ type, placeholder }) => {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<string | null>(null);

  const handleScan = async () => {
    const res = await fetch(`BACKEND_URL/api/${type}`, {
      method: 'POST',
      body: JSON.stringify({ content: input }),
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    setResult(data.msg);
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 border rounded-xl shadow-sm">
      <h2 className="text-xl font-bold mb-4">风险识别 - {type}</h2>
      <textarea 
        className="w-full p-3 border rounded-md"
        placeholder={placeholder}
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <button 
        onClick={handleScan}
        className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
      >
        立即识别
      </button>
      {result && (
        <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-500">
          <p className="font-medium">识别结果：</p>
          <p>{result}</p>
        </div>
      )}
    </div>
  );
};