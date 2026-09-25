import { useState, type FormEvent, type ReactElement } from "react";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, Loader2, LockKeyhole } from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Field, inputClass, primaryButtonClass } from "@/components/register/primitives";
import { eventConfig } from "@/config/eventConfig";
import { apiPost, errorMessage } from "@/lib/api";
import { useAdminSession } from "@/lib/adminSession";
import { beginSession } from "@/lib/session";
import type { AdminLogin as AdminLoginBody, AdminMe } from "@/lib/types";

export default function AdminLogin(): ReactElement {
  const navigate = useNavigate();
  const session = useAdminSession();
  const [form, setForm] = useState<AdminLoginBody>({ username: "", password: "" });

  const login = useMutation({
    mutationFn: (body: AdminLoginBody) => apiPost<AdminMe>("/admin/login", body),
    onSuccess: () => { beginSession(); navigate("/admin", { replace: true }); },
  });

  if (session.data) return <Navigate to="/admin" replace />;

  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (!form.username.trim() || !form.password) return;
    login.mutate({ username: form.username.trim(), password: form.password });
  };

  return (
    <div data-testid="admin-login-page" className="flex min-h-screen flex-col bg-[#070707] text-[#F5F5F5]">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
        <Link to="/" data-testid="admin-login-home-link" aria-label="KRIDANGAN home"><img src={eventConfig.logoPaths.kridanganOnDark} alt="KRIDANGAN logo" className="h-10 w-[88px] object-cover" /></Link>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#666]">Admin access</span>
      </header>
      <main className="relative flex flex-1 items-center justify-center overflow-hidden px-5 py-16">
        <div className="hero-grid pointer-events-none absolute inset-0 -z-10 opacity-40" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 size-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#F97316]/[0.07] blur-[100px]" />
        <form data-testid="admin-login-form" onSubmit={submit} className="w-full max-w-sm border border-white/10 bg-[#0B0B0B]/90 p-7 backdrop-blur-sm sm:p-9">
          <div className="flex size-11 items-center justify-center border border-[#F97316]/30 bg-[#F97316]/10"><LockKeyhole className="size-4 text-[#F97316]" aria-hidden="true" /></div>
          <p className="mt-7 font-mono text-[10px] uppercase tracking-[0.2em] text-[#F97316]">KRIDANGAN admin</p>
          <h1 data-testid="admin-login-title" className="mt-2 font-heading text-3xl font-bold uppercase tracking-tight">Sign in<span className="text-[#F97316]">.</span></h1>
          <div className="mt-8 space-y-5">
            <Field id="username" label="Username"><input id="username" data-testid="admin-username-input" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className={inputClass} autoComplete="username" autoCapitalize="off" /></Field>
            <Field id="password" label="Password"><input id="password" data-testid="admin-password-input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={inputClass} autoComplete="current-password" /></Field>
          </div>
          {login.isError && <p data-testid="admin-login-error" role="alert" className="mt-5 text-sm text-[#FCA5A5]">{errorMessage(login.error, "Invalid username or password")}</p>}
          <button type="submit" disabled={login.isPending} data-testid="admin-login-submit" className={`${primaryButtonClass} mt-8 w-full`}>
            {login.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null} Sign in {!login.isPending && <ArrowRight className="size-4" aria-hidden="true" />}
          </button>
        </form>
      </main>
    </div>
  );
}
