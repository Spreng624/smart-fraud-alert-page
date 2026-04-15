import { ArrowRight, BarChart3, Network, ShieldAlert, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

const modules = [
  {
    title: '风险识别',
    description: '统一进入诈骗短信、诈骗电话、钓鱼网站和号码查询等识别能力，适合一线快速初判。',
    path: '/risk/scam_text',
    icon: ShieldAlert,
    badge: '4 个子模块',
    accent: 'from-rose-500 via-orange-500 to-amber-400',
    points: ['短信内容识别', '通话文本识别', '钓鱼网址研判'],
  },
  {
    title: '数据统计',
    description: '查看诈骗规模、涉案金额走势、类型分布和周期特征，帮助建立整体态势感知。',
    path: '/statistics',
    icon: BarChart3,
    badge: '统计看板',
    accent: 'from-sky-500 via-cyan-500 to-teal-400',
    points: ['案件年度走势', '诈骗金额分析', '周期性分布'],
  },
  {
    title: '受害者画像',
    description: '聚焦受害者特征，从性别、年龄、学历和词云维度辅助分析重点人群。',
    path: '/victim',
    icon: Users,
    badge: '画像分析',
    accent: 'from-indigo-500 via-blue-500 to-cyan-400',
    points: ['性别分布', '年龄结构', '教育背景'],
  },
  {
    title: '关系图谱',
    description: '进入关系图谱模块，从节点、边和分类阈值快速探索诈骗链路与上下游关联。',
    path: '/graph',
    icon: Network,
    badge: '知识图谱',
    accent: 'from-emerald-500 via-lime-500 to-amber-300',
    points: ['分类筛选', '阈值控制', '关系链探索'],
  },
];

export default function HomePage() {
  return (
    <div className="px-4 sm:px-6">
      <section className="grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
        {modules.map((module) => {
          const Icon = module.icon;

          return (
            <Link
              key={module.path}
              to={module.path}
              className="group relative overflow-hidden rounded-[28px] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60 transition duration-200 hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-300/60"
            >
              <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${module.accent}`} />
              <div className="flex items-start justify-between gap-4">
                <div className={`inline-flex rounded-2xl bg-gradient-to-br ${module.accent} p-3 text-white shadow-lg`}>
                  <Icon className="h-6 w-6" />
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-slate-500">
                  {module.badge}
                </span>
              </div>

              <div className="mt-6 space-y-3">
                <h2 className="text-2xl font-bold text-slate-900">{module.title}</h2>
                <p className="min-h-20 text-sm leading-7 text-slate-600">{module.description}</p>
              </div>

              <div className="mt-6 space-y-2">
                {module.points.map((point) => (
                  <div key={point} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    {point}
                  </div>
                ))}
              </div>

              <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                进入模块
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </div>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
