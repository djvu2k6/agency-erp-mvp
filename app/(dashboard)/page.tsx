"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  FileText, Users, Clock, Calendar, Search, Activity, BarChart3, Plus, Loader2
} from "lucide-react";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import ResumeUploader from "@/components/ResumeUploader";
import CandidateTable, { Candidate } from "@/components/CandidateTable";
import { supabase } from "@/lib/supabase";
import { ThemeToggle } from "@/components/ThemeToggle";
import Link from "next/link";

export default function DashboardPage() {
  const [isUploaderOpen, setIsUploaderOpen] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [metrics, setMetrics] = useState({
    docsPending: 0,
    interviewsScheduled: 0,
    newThisMonth: 0,
    interviewsThisMonth: 0,
    placementsThisMonth: 0
  });

  useEffect(() => {
    if (!isUploaderOpen) {
      fetchDashboardData();
    }
  }, [isUploaderOpen]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [candRes, docsRes, intRes, intAllRes, placeRes] = await Promise.all([
        supabase.from("candidates").select("*").order("created_at", { ascending: false }),
        supabase.from("documents").select("*", { count: 'exact', head: true }).eq("status", "Pending"),
        supabase.from("interviews").select("*", { count: 'exact', head: true }).eq("status", "Scheduled"),
        supabase.from("interviews").select("created_at"),
        supabase.from("placements").select("created_at")
      ]);

      if (candRes.error) throw candRes.error;

      const fetchedCandidates = candRes.data || [];
      setCandidates(fetchedCandidates);

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const isThisMonth = (dateString: string) => {
        const d = new Date(dateString);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      };

      setMetrics({
        docsPending: docsRes.count || 0,
        interviewsScheduled: intRes.count || 0,
        newThisMonth: fetchedCandidates.filter(c => isThisMonth(c.created_at)).length,
        interviewsThisMonth: (intAllRes.data || []).filter(i => isThisMonth(i.created_at)).length,
        placementsThisMonth: (placeRes.data || []).filter(p => isThisMonth(p.created_at)).length
      });

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCandidates = useMemo(() => {
    if (!searchQuery.trim()) return candidates;
    const query = searchQuery.toLowerCase();
    return candidates.filter(c => {
      return (
        c.name.toLowerCase().includes(query) ||
        (c.current_role && c.current_role.toLowerCase().includes(query)) ||
        (c.visa_track_recommendation && c.visa_track_recommendation.toLowerCase().includes(query)) ||
        (c.status && c.status.toLowerCase().includes(query)) ||
        (c.skills && c.skills.some(s => s.toLowerCase().includes(query)))
      );
    });
  }, [candidates, searchQuery]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f4f5] dark:bg-slate-950 flex items-center justify-center transition-colors duration-300">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-slate-400 dark:text-slate-600" />
          <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-xs">Syncing Enterprise Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f4f4f5] dark:bg-slate-950 min-h-screen flex flex-col font-sans transition-colors duration-300">
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 py-5 flex items-center justify-between sticky top-0 z-20 transition-colors duration-300">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">System Dashboard</h1>
        <div className="flex items-center gap-4">

          <div className="relative w-80">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search by role, name, or skill..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800 border-2 border-transparent rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-slate-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>

          <ThemeToggle />

          <Link href="/import" className="px-5 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">
            Bulk Import
          </Link>

          <Dialog open={isUploaderOpen} onOpenChange={setIsUploaderOpen}>
            <DialogTrigger className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-slate-900 dark:bg-blue-600 rounded-xl hover:bg-black dark:hover:bg-blue-700 transition-colors shadow-md cursor-pointer">
              <Plus className="w-4 h-4" />
              New Candidate
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl bg-transparent border-none shadow-none p-0">
              <DialogTitle className="sr-only">Upload Resume</DialogTitle>
              <ResumeUploader />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="p-8 max-w-[1600px] w-full mx-auto space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-5 transition-colors duration-300">
            <div className="p-4 bg-slate-900 dark:bg-slate-800 rounded-2xl shadow-inner shrink-0">
              <Users className="w-7 h-7 text-white dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Candidates</p>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white mt-1">{candidates.length}</h2>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-5 transition-colors duration-300">
            <div className={`p-4 rounded-2xl border shrink-0 ${metrics.docsPending > 0 ? 'bg-red-50 dark:bg-red-900/30 border-red-100 dark:border-red-800/50 text-red-600 dark:text-red-400' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-300'}`}>
              <FileText className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Docs Pending</p>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white mt-1">{metrics.docsPending}</h2>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-5 transition-colors duration-300">
            <div className={`p-4 rounded-2xl border shrink-0 ${metrics.interviewsScheduled > 0 ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-100 dark:border-blue-800/50 text-blue-600 dark:text-blue-400' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-300'}`}>
              <Calendar className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Interviews</p>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white mt-1">{metrics.interviewsScheduled}</h2>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-5 transition-colors duration-300">
            <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shrink-0">
              <BarChart3 className="w-7 h-7 text-slate-900 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">New This Month</p>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white mt-1">+{metrics.newThisMonth}</h2>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2">
            <CandidateTable candidates={filteredCandidates} onRefresh={fetchDashboardData} />
          </div>

          <div className="space-y-8">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 transition-colors duration-300">
              <div className="flex items-center gap-3 mb-6">
                <BarChart3 className="w-5 h-5 text-slate-900 dark:text-white" />
                <h3 className="font-bold text-slate-900 dark:text-white text-lg">Monthly Report</h3>
              </div>
              <div className="space-y-5">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
                  <span className="text-sm font-bold text-slate-500 dark:text-slate-400">New Registrations</span>
                  <span className="text-base font-black text-slate-900 dark:text-white">{metrics.newThisMonth}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
                  <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Interviews Held</span>
                  <span className="text-base font-black text-slate-900 dark:text-white">{metrics.interviewsThisMonth}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Placements Completed</span>
                  <span className="text-base font-black text-slate-900 dark:text-white">{metrics.placementsThisMonth}</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 transition-colors duration-300">
              <div className="flex items-center gap-3 mb-6">
                <Activity className="w-5 h-5 text-slate-900 dark:text-white" />
                <h3 className="font-bold text-slate-900 dark:text-white text-lg">Activity Feed</h3>
              </div>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="mt-1 bg-slate-100 dark:bg-slate-800 p-2 rounded-full h-fit">
                    <Users className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">System Live</p>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">ERP Pipeline completely synced.</p>
                    <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mt-1 uppercase">Just Now</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}