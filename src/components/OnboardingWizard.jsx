import { useState } from 'react';
import { ChevronRight, DollarSign, Target, CheckCircle } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { CATEGORIES, FULL_MONTHS } from '../utils/constants';

const STEPS = [
  { id: 'welcome', title: 'Welcome' },
  { id: 'balance', title: 'Starting Balance' },
  { id: 'budget', title: 'Budget Goal' },
];

export default function OnboardingWizard() {
  const [step, setStep] = useState(0);
  const [balance, setBalance] = useState('');
  const [selectedBudgetCat, setSelectedBudgetCat] = useState('dining');
  const [budgetAmount, setBudgetAmount] = useState('');
  const month = useAppStore(s => s.month);
  const year = useAppStore(s => s.year);
  const setBeginningBalance = useAppStore(s => s.setBeginningBalance);
  const setBudgetGoals = useAppStore(s => s.setBudgetGoals);
  const budgetGoals = useAppStore(s => s.budgetGoals);
  const setOnboarded = useAppStore(s => s.setOnboarded);

  const finish = () => setOnboarded(true);
  const skip = () => setOnboarded(true);

  const next = () => {
    if (step === 0) {
      setStep(1);
    } else if (step === 1) {
      if (balance) setBeginningBalance(balance);
      setStep(2);
    } else if (step === 2) {
      if (budgetAmount && selectedBudgetCat) {
        setBudgetGoals({ ...budgetGoals, [selectedBudgetCat]: parseFloat(budgetAmount) || 0 });
      }
      finish();
    }
  };

  const topBudgetCats = CATEGORIES.filter(c => !['income', 'savings', 'investment'].includes(c.id)).slice(0, 8);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="flex gap-1 p-4 pb-0">
          {STEPS.map((s, i) => (
            <div key={s.id} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? 'bg-gradient-to-r from-[#12233d] to-[#00b4d8]' : 'bg-slate-200'}`} />
          ))}
        </div>

        <div className="p-6">
          {step === 0 && (
            <div className="text-center space-y-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#12233d] to-[#00b4d8] flex items-center justify-center mx-auto shadow-lg">
                <svg viewBox="0 0 100 100" className="w-14 h-14">
                  <defs><linearGradient id="obTeal" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style={{stopColor:'#00b4d8'}} /><stop offset="100%" style={{stopColor:'#0096b7'}} /></linearGradient></defs>
                  <circle cx="50" cy="52" r="24" fill="url(#obTeal)"/><path d="M 36 52 L 46 62 L 66 42" fill="none" stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-[#12233d] to-[#00b4d8] bg-clip-text text-transparent">Welcome to BalanceBooks Pro</h2>
              <p className="text-slate-500">Let's set up your finances in under a minute. You can always change these later.</p>
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="bg-[#00b4d8]/5 rounded-xl p-3 text-center border border-[#00b4d8]/20">
                  <DollarSign size={20} className="mx-auto text-[#00b4d8] mb-1" /><p className="text-xs text-slate-600 font-medium">Track Money</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-200">
                  <Target size={20} className="mx-auto text-blue-500 mb-1" /><p className="text-xs text-slate-600 font-medium">Set Budgets</p>
                </div>
                <div className="bg-emerald-50 rounded-xl p-3 text-center border border-emerald-200">
                  <CheckCircle size={20} className="mx-auto text-emerald-500 mb-1" /><p className="text-xs text-slate-600 font-medium">Save More</p>
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#00b4d8]/20 to-blue-100 flex items-center justify-center mx-auto mb-3">
                  <DollarSign size={28} className="text-[#00b4d8]" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">What's your starting balance?</h2>
                <p className="text-sm text-slate-500 mt-1">Your current account balance for {FULL_MONTHS[month]} {year}</p>
              </div>
              <div>
                <label className="block text-sm text-slate-600 font-medium mb-2">Beginning Balance</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-slate-400">$</span>
                  <input type="number" placeholder="0.00" value={balance} onChange={(e) => setBalance(e.target.value)} className="w-full pl-10 pr-4 py-4 bg-white border-2 border-[#00b4d8]/30 rounded-xl text-2xl font-bold text-[#00b4d8] focus:ring-2 focus:ring-[#00b4d8] focus:outline-none" autoFocus />
                </div>
              </div>
              <p className="text-xs text-slate-400">This is the amount in your account at the start of the month.</p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center mx-auto mb-3">
                  <Target size={28} className="text-blue-500" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Set your first budget</h2>
                <p className="text-sm text-slate-500 mt-1">Pick a category and set a monthly limit</p>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {topBudgetCats.map(cat => (
                  <button key={cat.id} onClick={() => setSelectedBudgetCat(cat.id)} className={`flex flex-col items-center p-2 rounded-xl border-2 transition-all ${selectedBudgetCat === cat.id ? 'border-[#00b4d8] bg-[#00b4d8]/5' : 'border-slate-200 hover:border-slate-300'}`}>
                    <span className="text-xl mb-1">{cat.icon}</span>
                    <span className="text-[10px] text-slate-600 font-medium leading-tight text-center">{cat.name}</span>
                  </button>
                ))}
              </div>
              <div>
                <label className="block text-sm text-slate-600 font-medium mb-2">Monthly limit for {CATEGORIES.find(c => c.id === selectedBudgetCat)?.name}</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-slate-400">$</span>
                  <input type="number" placeholder="200" value={budgetAmount} onChange={(e) => setBudgetAmount(e.target.value)} className="w-full pl-10 pr-4 py-4 bg-white border-2 border-blue-300 rounded-xl text-2xl font-bold text-blue-600 focus:ring-2 focus:ring-blue-400 focus:outline-none" autoFocus />
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
            <button onClick={skip} className="text-sm text-slate-400 hover:text-slate-600">
              {step === 0 ? 'Skip setup' : 'Skip'}
            </button>
            <button onClick={next} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#12233d] to-[#00b4d8] text-white rounded-xl font-semibold shadow-lg hover:from-[#0a1628] hover:to-[#0096b7]">
              {step === 2 ? <><CheckCircle size={18} />Finish</> : <><span>Next</span><ChevronRight size={18} /></>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
