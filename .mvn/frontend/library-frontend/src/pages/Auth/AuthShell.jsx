import { Link as RouterLink } from "react-router-dom";

const AuthShell = ({ title, subtitle, children }) => (
  <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-sky-100 flex items-center justify-center px-4 py-10">
    <section className="w-full max-w-md rounded-2xl bg-white p-6 sm:p-8 shadow-xl border border-blue-100">
      <RouterLink
        to="/"
        className="text-sm font-semibold text-[#1769ff] hover:underline"
      >
        ← Trang chủ
      </RouterLink>
      <h1 className="text-3xl font-bold text-slate-900 mt-6 mb-2">{title}</h1>
      <p className="text-slate-600 mb-6">{subtitle}</p>
      {children}
    </section>
  </main>
);

export default AuthShell;
