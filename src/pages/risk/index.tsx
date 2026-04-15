import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Globe, MessageSquareWarning, PhoneCall, SearchCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HAS_REMOTE_API, request } from '@/utils/request';

type RiskEndpoint = 'scam_text' | 'fraud_call' | 'phishing_website' | 'phone_number';

interface ScamTextResult {
  content: string;
  label_id: number;
  label_name: string;
  confidence: number;
}

interface FraudCallResult {
  content: string;
  normalized_content: string;
  label: string;
  fraud_probability: number;
  normal_probability: number;
}

interface PhishingWebsiteResult {
  url: string;
  prediction: string;
  phishing_probability: number;
  features: Record<string, number>;
}

interface PhoneNumberResult {
  input: string;
  country_code: number;
  national_number: number;
  country: string;
  valid_number: boolean;
  possible_number: boolean;
  location: string;
  type: string;
  carrier: string;
}

type RiskResultMap = {
  scam_text: ScamTextResult;
  fraud_call: FraudCallResult;
  phishing_website: PhishingWebsiteResult;
  phone_number: PhoneNumberResult;
};

interface RiskApiResponse<T> {
  ok: boolean;
  result: T;
}

const riskTools = [
  {
    key: 'scam_text',
    title: '诈骗短信识别',
    shortTitle: '短信识别',
    description: '输入短信内容，检测是否存在诈骗诱导、冒充通知或异常链接。',
    icon: MessageSquareWarning,
  },
  {
    key: 'fraud_call',
    title: '诈骗电话识别',
    shortTitle: '电话识别',
    description: '输入通话转写文本，识别冒充客服、公检法或转账诱导等风险。',
    icon: PhoneCall,
  },
  {
    key: 'phishing_website',
    title: '钓鱼网站识别',
    shortTitle: '网址识别',
    description: '输入可疑网址，检查页面是否具有钓鱼站点特征。',
    icon: Globe,
  },
  {
    key: 'phone_number',
    title: '号码风险查询',
    shortTitle: '号码查询',
    description: '输入号码，查询归属地、运营商、号码类型和基础有效性。',
    icon: SearchCheck,
  },
] satisfies ReadonlyArray<{
  key: RiskEndpoint;
  title: string;
  shortTitle: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
}>;

const riskMeta: Record<
  RiskEndpoint,
  {
    title: string;
    actionText: string;
    placeholder: string;
    inputType: 'text' | 'textarea';
    helperText: string;
  }
> = {
  scam_text: {
    title: '诈骗短信识别',
    actionText: '开始识别短信风险',
    placeholder: '请输入需要识别的短信内容...',
    inputType: 'textarea',
    helperText: '支持输入短信正文、聊天记录片段或营销推广文案。',
  },
  fraud_call: {
    title: '诈骗电话识别',
    actionText: '开始识别通话风险',
    placeholder: '请输入通话转写文本或对话记录...',
    inputType: 'textarea',
    helperText: '建议尽量输入完整上下文，以便识别诱导转账、冒充客服等话术。',
  },
  phishing_website: {
    title: '钓鱼网站识别',
    actionText: '开始识别网址风险',
    placeholder: '请输入可疑网址 URL...',
    inputType: 'text',
    helperText: '支持输入域名或完整 URL，用于识别伪装站点和钓鱼页面。',
  },
  phone_number: {
    title: '号码风险查询',
    actionText: '开始查询号码信息',
    placeholder: '请输入待查询的电话号码...',
    inputType: 'text',
    helperText: '支持国内外号码的基础解析与有效性判断。',
  },
};

const getEndpointFromPath = (pathname: string): RiskEndpoint => {
  const candidate = pathname.split('/').filter(Boolean).at(-1);
  if (candidate && candidate in riskMeta) {
    return candidate as RiskEndpoint;
  }

  return 'scam_text';
};

const formatPercent = (value: number) => `${(value * 100).toFixed(2)}%`;

const ResultRow = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="border-b border-slate-200 py-3 last:border-b-0">
    <span className="text-sm font-medium text-slate-500">{label}</span>
    <div className="mt-1 break-all text-slate-800">{value}</div>
  </div>
);

export default function RiskPage() {
  const location = useLocation();
  const [input, setInput] = useState('');
  const [result, setResult] = useState<RiskResultMap[RiskEndpoint] | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [serviceUnavailable, setServiceUnavailable] = useState(!HAS_REMOTE_API);

  const endpoint = useMemo(() => getEndpointFromPath(location.pathname), [location.pathname]);
  const currentMeta = riskMeta[endpoint];

  useEffect(() => {
    setInput('');
    setResult(null);
    setErrorMessage('');
    setServiceUnavailable(!HAS_REMOTE_API);
  }, [endpoint]);

  const unavailableMessage = '当前没有连接后端，该模块暂不可用。';

  const handleIdentify = async () => {
    if (serviceUnavailable) {
      setResult(null);
      setErrorMessage(unavailableMessage);
      return;
    }

    if (!input.trim()) {
      setResult(null);
      setErrorMessage('请输入需要识别或查询的内容。');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const data = (await request(`/risk/${endpoint}`, {
        method: 'POST',
        body: JSON.stringify({ content: input }),
      })) as RiskApiResponse<RiskResultMap[typeof endpoint]>;

      if (!data.ok) {
        throw new Error('API returned ok=false');
      }

      setResult(data.result);
    } catch (error) {
      console.error('Risk request failed:', error);
      setResult(null);
      setServiceUnavailable(true);
      setErrorMessage(unavailableMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderResult = () => {
    if (!result) return null;

    switch (endpoint) {
      case 'scam_text': {
        const data = result as ScamTextResult;
        return (
          <>
            <ResultRow label="短信内容" value={data.content} />
            <ResultRow label="诈骗类型" value={data.label_name} />
            <ResultRow label="标签 ID" value={data.label_id} />
            <ResultRow label="置信度" value={formatPercent(data.confidence)} />
          </>
        );
      }
      case 'fraud_call': {
        const data = result as FraudCallResult;
        return (
          <>
            <ResultRow label="通话内容" value={data.content} />
            <ResultRow label="规范化文本" value={data.normalized_content} />
            <ResultRow label="判定结果" value={data.label} />
            <ResultRow label="诈骗概率" value={formatPercent(data.fraud_probability)} />
            <ResultRow label="正常概率" value={formatPercent(data.normal_probability)} />
          </>
        );
      }
      case 'phishing_website': {
        const data = result as PhishingWebsiteResult;
        return (
          <>
            <ResultRow label="URL" value={data.url} />
            <ResultRow label="预测结果" value={data.prediction} />
            <ResultRow label="钓鱼概率" value={formatPercent(data.phishing_probability)} />
            <div className="pt-3">
              <p className="mb-3 text-sm font-medium text-slate-500">特征详情</p>
              <div className="grid grid-cols-1 gap-x-6 gap-y-2 md:grid-cols-2">
                {Object.entries(data.features).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between border-b border-slate-200 py-2 text-sm">
                    <span className="text-slate-600">{key}</span>
                    <span className="font-medium text-slate-800">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        );
      }
      case 'phone_number': {
        const data = result as PhoneNumberResult;
        return (
          <>
            <ResultRow label="输入号码" value={data.input} />
            <ResultRow label="国家区号" value={`+${data.country_code}`} />
            <ResultRow label="国家/地区" value={data.country} />
            <ResultRow label="归属地" value={data.location} />
            <ResultRow label="运营商" value={data.carrier} />
            <ResultRow label="号码类型" value={data.type} />
            <ResultRow label="是否有效" value={data.valid_number ? '是' : '否'} />
            <ResultRow label="是否可能存在" value={data.possible_number ? '是' : '否'} />
            <ResultRow label="本地号码" value={data.national_number} />
          </>
        );
      }
      default:
        return null;
    }
  };

  return (
    <div className="px-4 sm:px-6">
      <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="h-fit rounded-[28px] border border-slate-200 bg-white p-4 shadow-lg shadow-slate-200/50">
          <div className="space-y-3">
            {riskTools.map((tool) => {
              const Icon = tool.icon;
              const isCurrent = tool.key === endpoint;

              return (
                <Link
                  key={tool.key}
                  to={`/risk/${tool.key}`}
                  className={cn(
                    'block rounded-[22px] border px-4 py-4 transition',
                    isCurrent
                      ? 'border-sky-300 bg-sky-50 shadow-sm shadow-sky-100'
                      : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white',
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'rounded-2xl p-2.5',
                        isCurrent ? 'bg-sky-600 text-white' : 'bg-white text-slate-700',
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="font-semibold text-slate-900">{tool.shortTitle}</h3>
                        {isCurrent && (
                          <span className="rounded-full bg-sky-100 px-2 py-1 text-xs font-semibold text-sky-700">
                            当前
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{tool.description}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </aside>

        <section className="space-y-6">
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/50 sm:p-8">
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-black tracking-tight text-slate-900">{currentMeta.title}</h1>
                <p className="mt-2 text-base leading-7 text-slate-600">{currentMeta.helperText}</p>
              </div>

              {serviceUnavailable && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  当前没有连接后端，该模块暂不可用。风险识别需要实时调用后端模型服务。
                </div>
              )}

              <div>
                <label className="text-sm font-semibold text-slate-700">输入内容</label>
                {currentMeta.inputType === 'textarea' ? (
                  <textarea
                    className="mt-3 min-h-56 w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
                    placeholder={currentMeta.placeholder}
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    disabled={serviceUnavailable}
                  />
                ) : (
                  <input
                    className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
                    placeholder={currentMeta.placeholder}
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    disabled={serviceUnavailable}
                  />
                )}

                <button
                  onClick={handleIdentify}
                  disabled={loading || serviceUnavailable}
                  className="mt-5 inline-flex items-center rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {serviceUnavailable ? '后端未连接' : loading ? '识别中...' : currentMeta.actionText}
                </button>

                {errorMessage && (
                  <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {errorMessage}
                  </div>
                )}
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                <div className="border-b border-slate-200 pb-4">
                  <p className="text-lg font-semibold text-slate-900">识别结果</p>
                  <p className="mt-1 text-sm text-slate-500">
                    连接后端后，这里会显示当前模块对应的详细识别结果。
                  </p>
                </div>

                {result ? (
                  <div className="mt-4">{renderResult()}</div>
                ) : (
                  <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-8 text-sm leading-7 text-slate-500">
                    {serviceUnavailable
                      ? '当前未连接后端服务，因此风险识别模块仅展示交互界面，不提供识别结果。'
                      : `输入内容后点击“${currentMeta.actionText}”，即可在这里查看详细分析。`}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
