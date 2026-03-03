import { Sparkles, CheckCircle, AlertTriangle, TrendingUp, Lightbulb, DollarSign, Info } from 'lucide-react';
import { useFinancialData } from '../hooks/useFinancialData';
import { currency } from '../utils/formatters';

export default function Recommendations() {
  const { savingsRecommendations } = useFinancialData();

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#12233d] via-[#0a1628] to-[#00b4d8]/50 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center gap-3 mb-2"><Sparkles size={24} /><h3 className="text-xl font-bold">Smart Money Tips</h3></div>
        <p className="text-[#00b4d8]/70">Personalized recommendations based on your spending patterns</p>
      </div>
      {savingsRecommendations.length === 0 ? (
        <div className="bg-gradient-to-r from-[#00b4d8]/5 via-white to-blue-50 rounded-2xl border-2 border-[#00b4d8]/20 p-8 text-center">
          <CheckCircle size={48} className="mx-auto text-green-400 mb-4" />
          <h3 className="font-bold text-slate-900 text-lg mb-2">You're Doing Great!</h3>
          <p className="text-slate-500">No recommendations at this time. Keep up the good work!</p>
        </div>
      ) : (
        <div className="space-y-4">{savingsRecommendations.map(rec => (
          <div key={rec.id} className={`bg-white rounded-2xl border-2 p-6 shadow-sm hover:shadow-lg transition-all ${rec.type === 'success' ? 'border-[#00b4d8]/20 bg-gradient-to-r from-[#00b4d8]/5 via-white to-blue-50' : rec.type === 'alert' ? 'border-rose-200 bg-gradient-to-r from-rose-50 via-white to-white' : rec.priority === 'high' ? 'border-amber-200 bg-gradient-to-r from-amber-50 via-white to-white' : 'border-[#12233d]/10 bg-gradient-to-r from-[#0a1628]/5 via-white to-[#00b4d8]/5'}`}>
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl shadow-sm shrink-0 ${rec.type === 'success' ? 'bg-gradient-to-br from-green-400 to-[#00b4d8]/50' : rec.type === 'alert' ? 'bg-gradient-to-br from-rose-400 to-rose-500' : rec.type === 'increase' ? 'bg-gradient-to-br from-blue-400 to-blue-500' : 'bg-gradient-to-br from-amber-400 to-amber-500'}`}>
                {rec.type === 'success' ? <CheckCircle size={20} className="text-white" /> : rec.type === 'alert' ? <AlertTriangle size={20} className="text-white" /> : rec.type === 'increase' ? <TrendingUp size={20} className="text-white" /> : <Lightbulb size={20} className="text-white" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <h4 className="font-bold text-slate-900 text-lg">{rec.title}</h4>
                  {rec.priority === 'high' && rec.type !== 'success' && <span className="px-2 py-1 text-xs font-bold bg-gradient-to-r from-amber-100 to-amber-200 text-amber-700 rounded-full">High Priority</span>}
                  {rec.priority === 'medium' && <span className="px-2 py-1 text-xs font-bold bg-gradient-to-r from-[#12233d]/10 to-blue-200 text-blue-700 rounded-full">Medium</span>}
                </div>
                <p className="text-slate-600 mb-3">{rec.description}</p>
                {rec.potential > 0 && (
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-100 to-[#00b4d8]/5 rounded-xl border border-[#00b4d8]/20 mb-3">
                    <DollarSign size={16} className="text-[#00b4d8]" />
                    <span className="font-bold text-green-700">Potential savings: {currency(rec.potential)}/mo</span>
                  </div>
                )}
                {rec.tips && rec.tips.length > 0 && (
                  <div className="mt-3 p-4 bg-gradient-to-r from-[#0a1628]/5 via-white to-[#00b4d8]/5 rounded-xl border border-[#12233d]/10">
                    <p className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2"><Info size={14} className="text-[#00b4d8]" />Action Steps:</p>
                    <ul className="space-y-2">{rec.tips.map((tip, i) => (
                      <li key={i} className="text-sm text-slate-600 flex items-start gap-2"><span className="w-5 h-5 rounded-full bg-gradient-to-r from-[#12233d] to-[#00b4d8] text-white text-xs flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>{tip}</li>
                    ))}</ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}</div>
      )}
    </div>
  );
}
