export const menuConfig = [
  {
    title: '首页',
    key: 'home',
    path: '/',
  },
  {
    title: '风险识别',
    key: 'risk',
    path: '/risk/scam_text',
    children: [
      { title: '诈骗短信识别', path: '/risk/scam_text' },
      { title: '诈骗电话识别', path: '/risk/fraud_call' },
      { title: '钓鱼网站识别', path: '/risk/phishing_website' },
      { title: '号码风险查询', path: '/risk/phone_number' },
    ],
  },
  {
    title: '数据统计',
    key: 'statistics',
    path: '/statistics',
  },
  {
    title: '受害者画像',
    key: 'victim',
    path: '/victim',
  },
  {
    title: '关系图谱',
    key: 'graph',
    path: '/graph',
  },
];
