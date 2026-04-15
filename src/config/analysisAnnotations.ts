const statisticsAnnotations: Record<string, string> = {
  cases_by_year:
    '案件量整体呈波动上升趋势，说明电信网络诈骗形势依然严峻。2021-2022 年的阶段性回落，与“断卡”行动等专项治理成效有关；2023-2025 年又再次回升，说明诈骗手法仍在持续演化，但整体更接近持续对抗、动态压制的治理阶段。',
  weekly_periodic:
    '基于可解析日期的案件统计结果，周五是最明显的高发时段，周四至周五更值得重点关注。这说明诈骗活动并非随机发生，而是会结合用户注意力、交易频率和心理状态选择更有利的触达时间。',
  fraud_types:
    '在 43488 起案件中，刷单返利、冒充电商物流客服、虚假网络投资理财、贷款代办信用卡等类型占比较高。其中刷单返利类占比最高，反映出“低门槛引流、小额返利诱导、持续加码投入”的套路仍具有很强欺骗性。',
  fraud_amount:
    '案件损失金额均值约为 3.6541 万元，中位数约为 3.0 万元，说明多数案件集中在中低金额区间，但单案损失已具有现实危害性。同时金额字段主要来自案件文本规则抽取，适合用于观察总体分布趋势，不宜过度解读细小分档差异。',
};

const victimAnnotations: Record<string, string> = {
  age:
    '年龄分布显示，26-35 岁群体最为集中，中青年群体是主要受害对象。这类结果更适合被理解为对“主要受害年龄带”的近似刻画，因为年龄字段来自 LLM 抽取和规则分桶，未必能严格反映真实人口统计分布。',
  gender:
    '性别分布整体较为接近，当前结果只能说明总体上没有出现极端失衡。研究报告并未据此下结论说某些诈骗类型明显偏向某一性别，因此这里更适合作为方向性参考，而不是细分类别偏好的证据。',
  education:
    '学历并不是规避诈骗风险的天然屏障，具备中高等教育背景的人群同样可能在高仿场景和复杂话术中被诱导。同时也要注意，学历字段在案件文本中并不稳定完整，结果更适合作为宣传与研判的方向性参考。',
  wordcloud:
    '高频词云补充了年龄、性别和学历之外的身份与行为特征。“无业”“在校学生”“已婚”“有投资倾向”“有贷款需求”“接受过反诈宣传”等标签较为突出，说明受害风险往往与现实决策场景、资金压力和心理状态共同作用有关，而不是集中在单一职业标签上。',
};

export const analysisAnnotations = {
  statistics: statisticsAnnotations,
  victim: victimAnnotations,
};

export const withResearchAnnotation = <
  T extends {
    annotations?: string;
  },
>(
  section: keyof typeof analysisAnnotations,
  key: string,
  item: T,
): T => ({
  ...item,
  annotations: analysisAnnotations[section][key] ?? item.annotations ?? '',
});
