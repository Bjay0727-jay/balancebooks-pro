import { useFinancialData } from '../hooks/useFinancialData';
import { currency } from '../utils/formatters';

export default function Cycle() {
  const { cycleData } = useFinancialData();

  return (
    <div className="bg-white rounded-2xl border-2 border-[#1e3a5f]/10 shadow-sm overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gradient-to-r from-[#1e3a5f]/10 via-white to-[#14b8a6]/10 border-b border-[#1e3a5f]/20">
          <tr>
            <th className="px-4 py-4 text-left font-bold text-slate-700">Month</th>
            <th className="px-4 py-4 text-right font-bold text-[#14b8a6]">Beginning</th>
            <th className="px-4 py-4 text-right font-bold text-[#14b8a6]">Income</th>
            <th className="px-4 py-4 text-right font-bold text-rose-600">Expenses</th>
            <th className="px-4 py-4 text-right font-bold text-slate-600">Net</th>
            <th className="px-4 py-4 text-right font-bold text-[#14b8a6]">Ending</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {cycleData.map((row, i) => (
            <tr key={i} className="hover:bg-gradient-to-r hover:from-[#0f172a]/5/30 hover:to-[#14b8a6]/5/30">
              <td className="px-4 py-3 font-medium text-slate-900">{row.month} {row.year}</td>
              <td className="px-4 py-3 text-right text-[#14b8a6]">{currency(row.beginning)}</td>
              <td className="px-4 py-3 text-right text-[#14b8a6] font-medium">{currency(row.income)}</td>
              <td className="px-4 py-3 text-right text-rose-600">{currency(row.expenses)}</td>
              <td className={`px-4 py-3 text-right font-bold ${row.net >= 0 ? 'text-[#14b8a6]' : 'text-rose-600'}`}>{row.net >= 0 ? '+' : ''}{currency(row.net)}</td>
              <td className="px-4 py-3 text-right font-bold text-[#14b8a6]">{currency(row.ending)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
