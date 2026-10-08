import CurrentLoanCard from "./CurrentLoanCard";
import { effectiveLoanStatus } from "../MyLoans/loanRules.js";

const CurrentLoans = ({ loans = [], preview = false }) => {
  const activeLoans = loans.filter((loan) => ["CHECKED_OUT", "OVERDUE"].includes(effectiveLoanStatus(loan)));
  return (
    <div className="p-6">
      <h3 className="text-2xl font-bold text-gray-900 mb-6">
        Sách bạn đang mượn
      </h3>

      <div className="space-y-4">
        {activeLoans.map((loan) => (
          <CurrentLoanCard key={loan.id} loan={loan} preview={preview} />
        ))}
        {activeLoans.length === 0 && <p className="text-slate-600">Chưa có sách đang mượn.</p>}
      </div>
    </div>
  );
};

export default CurrentLoans;
