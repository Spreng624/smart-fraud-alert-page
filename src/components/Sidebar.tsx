import { useState } from "react";

type MenuItem = {
  key: string;
  label: string;
  children?: { key: string; label: string }[];
};

const menuData: MenuItem[] = [
  {
    key: "dashboard",
    label: "城市反诈态势总览",
  },
  {
    key: "risk",
    label: "风险识别与评估",
    children: [
      { key: "phone", label: "号码风险评估" },
      { key: "sms", label: "短信智能识别" },
      { key: "ai", label: "AI问答" },
    ],
  },
  {
    key: "analysis",
    label: "数据分析与可视化",
    children: [
      { key: "type", label: "诈骗类型统计" },
      { key: "trend", label: "时间趋势分析" },
      { key: "region", label: "地域分布分析" },
      { key: "predict", label: "预测模型" },
    ],
  },
  {
    key: "resources",
    label: "数据资源中心",
    children: [
      { key: "cases", label: "诈骗案例库" },
      { key: "numbers", label: "号码风险数据库" },
    ],
  },
  {
    key: "graph",
    label: "诈骗知识图谱",
  },
];

type SidebarProps = {
  active: string;
  onSelect: (key: string) => void;
};

export default function Sidebar({ active, onSelect }: SidebarProps) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  return (
    <aside className="w-64 bg-white shadow-lg p-4">
      <h1 className="text-xl font-bold mb-6">反诈分析平台</h1>

      <nav className="space-y-2">
        {menuData.map((item) => (
          <div
            key={item.key}
            className="relative"
            onMouseEnter={() => setOpenMenu(item.key)}
            onMouseLeave={() => setOpenMenu(null)}
          >
            {/* 主菜单 */}
            <button
              onClick={() => onSelect(item.key)}
              className={`w-full text-left px-4 py-2 rounded ${
                active === item.key
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              {item.label}
            </button>

            {/* 子菜单 */}
            {item.children && openMenu === item.key && (
              <div className="absolute left-full top-0 ml-2 w-48 bg-white shadow-lg rounded border z-50">
                {item.children.map((child) => (
                  <button
                    key={child.key}
                    onClick={() => onSelect(child.key)}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100"
                  >
                    {child.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
}