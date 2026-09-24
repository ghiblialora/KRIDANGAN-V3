import type { ReactElement } from "react";
import { Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import Home from "@/pages/Home";
import Contact from "@/pages/Contact";
import Register from "@/pages/Register";
import RegistrationStatus from "@/pages/RegistrationStatus";
import AdminLogin from "@/pages/admin/AdminLogin";
import AdminDashboard from "@/pages/admin/AdminDashboard";

// One <Route> per page in src/pages; BrowserRouter already wraps this in main.tsx.
export default function App(): ReactElement {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/register" element={<Register />} />
        <Route path="/registration-status" element={<RegistrationStatus />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
      <Toaster position="bottom-center" theme="dark" toastOptions={{ style: { background: "#111111", border: "1px solid rgba(255,255,255,0.1)", color: "#F5F5F5" } }} />
    </>
  );
}
