"use client";

import React, { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Search, UserPlus, Loader2 } from "lucide-react";
import CandidateTable from "@/components/CandidateTable"; // THIS IS THE MAGIC CONNECTION

export default function CandidatesPage() {
    const [candidates, setCandidates] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        fetchCandidates();
    }, []);

    const fetchCandidates = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("candidates")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching candidates:", error);
        } else {
            setCandidates(data || []);
        }
        setLoading(false);
    };

    // The Mega-Search Logic
    const filteredCandidates = candidates.filter((candidate) => {
        const query = searchQuery.toLowerCase();

        // 1. Search by Name
        const matchName = candidate.name?.toLowerCase().includes(query);

        // 2. Search by Candidate ID (CID-XXXX)
        const matchId = candidate.candidate_id?.toLowerCase().includes(query);

        // 3. Search by Skills
        const matchSkills = Array.isArray(candidate.skills)
            ? candidate.skills.some((skill: string) => skill.toLowerCase().includes(query))
            : candidate.skills?.toLowerCase().includes(query);

        // 4. Search by Role
        const matchRole = candidate.current_role?.toLowerCase().includes(query);

        return matchName || matchId || matchSkills || matchRole;
    });

    return (
        <div className="p-8 max-w-7xl mx-auto w-full">

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                        Candidates Directory
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Search, filter, and manage your entire talent pool.
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-sm shadow-blue-600/20">
                        <UserPlus className="w-4 h-4" />
                        Add Candidate
                    </button>
                </div>
            </div>

            {/* The Mega-Search Bar */}
            <div className="relative mb-8">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-slate-400" />
                </div>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, Candidate ID, role, or skills (e.g. 'React', 'Plumber')..."
                    className="w-full pl-11 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600 transition-all shadow-sm placeholder:text-slate-400"
                />
            </div>

            {/* Table Section */}
            <div className="w-full">
                {loading ? (
                    <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
                        <p className="text-slate-500 font-medium">Decrypting Vault Records...</p>
                    </div>
                ) : (
                    /* THE REAL TABLE IS NOW HERE! 
                       It receives the filtered list, so typing in the search bar updates the table instantly.
                    */
                    <CandidateTable
                        candidates={filteredCandidates}
                        onRefresh={fetchCandidates}
                    />
                )}
            </div>
        </div>
    );
}