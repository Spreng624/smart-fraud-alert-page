# Smart Fraud Alert 前端模块

本项目是一个基于大数据技术的智能反诈平台，面向公众，同时为反诈宣传与研究提供决策支持。前端采用 React + TypeScript + Vite 实现，主要负责可视化展示与用户交互。

## 主要功能
- 风险识别（诈骗短信、诈骗电话、钓鱼网站、电话号码）
- 统计分析（案件数量、类型、金额与周内周期）
- 受害者画像（年龄、性别、教育等分布）
- 诈骗链路图谱（作案媒介、话术、动作关系）
- 基于 FastAPI 的后端接口调用：/api/risk/*, /api/statistics/*, /api/victim/*, /api/graph/*

## 技术栈
- React
- TypeScript
- Vite
- Tailwind CSS / 普通 CSS
- ECharts / Cytoscape 作为可视化引擎

## 快速启动
```bash
cd frontend
npm install
npm run dev
```

## 部署到 GitHub Pages
```bash
npm run deploy
```

发布前请确保：
- GitHub 上已经存在仓库 `smart-fraud-alert-frontend`
- 本地仓库已经添加 `origin` 指向该仓库
- GitHub Pages 的发布来源设置为 `gh-pages` 分支

当前前端构建已配置为以 `/smart-fraud-alert-frontend/` 作为生产环境基础路径。

## 访问
开发环境默认：http://localhost:5173

## 说明
- 前端依赖后端 FastAPI 服务，建议先启动后端，再运行前端。
- 若后端接口地址非默认（http://localhost:8000），请在 src/utils/request.ts 或环境变量中调整 BASE_URL。
