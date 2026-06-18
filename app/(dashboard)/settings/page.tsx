"use client";

import React, { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Settings as SettingsIcon, Shield, UserPlus, Mail, Lock, Loader2 } from "lucide-react";

export default function SettingsPage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // New employee form state
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("Employee");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
        setProfile(data);
      }
      setLoading(false);
    };
    loadProfile();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ text: "", type: "" });

    try {
      const res = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail, password: newPassword, role: newRole }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setMessage({ text: "Team member added successfully!", type: "success" });
      setNewEmail("");
      setNewPassword("");
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-8">Loading settings...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
          <SettingsIcon className="w-8 h-8 text-blue-600" />
          System Settings
        </h1>
        <p className="text-slate-500 mt-2">Manage your account and system preferences.</p>
      </div>

      <div className="space-y-8">
        {/* Personal Account Section - Visible to EVERYONE */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-600" /> My Profile
          </h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-500 mb-1">Email Address</label>
              <div className="text-slate-900 dark:text-white font-medium">{profile?.email}</div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-500 mb-1">Access Role</label>
              <span className={`inline-flex px-3 py-1 rounded-md text-sm font-bold ${profile?.role === 'Admin' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                {profile?.role}
              </span>
            </div>
          </div>
        </div>

        {/* Team Management Section - Visible ONLY to ADMINS */}
        {profile?.role === "admin" && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-600" /> Add New Team Member
            </h2>
            <p className="text-sm text-slate-500 mb-6">Create credentials for new agents or admins to access VaultOS.</p>

            <form onSubmit={handleCreateUser} className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Email</label>
                <div className="relative">
                  <Mail className="w-5 h-5 absolute left-3 top-2.5 text-slate-400" />
                  <input required type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-600 text-slate-900 dark:text-white" placeholder="agent@company.com" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Temporary Password</label>
                <div className="relative">
                  <Lock className="w-5 h-5 absolute left-3 top-2.5 text-slate-400" />
                  <input required type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-600 text-slate-900 dark:text-white" placeholder="Min 6 characters" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Role</label>
                <select value={newRole} onChange={e => setNewRole(e.target.value)} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-600 text-slate-900 dark:text-white">
                  <option value="employee">Employee (Agent)</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {message.text && (
                <div className={`p-3 rounded-lg text-sm font-semibold ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {message.text}
                </div>
              )}

              <button type="submit" disabled={isSubmitting} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Account"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}