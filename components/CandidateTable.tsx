"use client";

import React, { useState } from "react";
import { Download, FileText, Users, Edit } from "lucide-react"; // Added Edit icon
import * as XLSX from "xlsx";
import { useRouter } from "next/navigation";
import CandidateEditor from "./CandidateEditor"; // Make sure this path matches where you saved it!

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  current_role: string;
  country: string;
  skills: string[];
  experience_years: number;
  education: string;
  visa_track_recommendation: string;
  status: string;
  created_at: string;
}

interface CandidateTableProps {
  candidates: Candidate[];
  onRefresh?: () => void; // Added this so the parent page can refresh the data after an edit
}

export default function CandidateTable({ candidates, onRefresh }: CandidateTableProps) {
  const router = useRouter();

  // State to track which candidate is currently loaded in the slide-over panel
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);

  const handleExportExcel = () => {
    if (candidates.length === 0) return;

    const exportData = candidates.map((c) => ({
      "Full Name": c.name,
      "Email Address": c.email || "N/A",
      "Phone Number": c.phone || "N/A",
      "Current Role": c.current_role || "N/A",
      "Years Exp": c.experience_years || 0,
      "Country": c.country || "N/A",
      "Recommended Visa": c.visa_track_recommendation || "N/A",
      "Application Status": c.status,
      "Date Added": new Date(c.created_at).toLocaleDateString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Candidates");
    XLSX.writeFile(workbook, "Vault_Candidates_Export.xlsx");
  };

  return (
    <>
      <div className="w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-[600px] transition-colors duration-300">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 rounded-t-2xl shrink-0 transition-colors duration-300">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-900 dark:bg-slate-800 text-white dark:text-blue-400 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-lg">Candidate Roster</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Scroll to view all {candidates.length} records</p>
            </div>
          </div>

          <button
            onClick={handleExportExcel}
            disabled={candidates.length === 0}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-slate-900 dark:bg-blue-600 rounded-lg hover:bg-black dark:hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 transition-colors shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800 z-10 border-b border-slate-200 dark:border-slate-700 shadow-sm transition-colors duration-300">
              <tr>
                <th className="p-4 pl-6 text-slate-700 dark:text-slate-300 font-bold">Candidate Profile</th>
                <th className="p-4 text-slate-700 dark:text-slate-300 font-bold">Target Track</th>
                <th className="p-4 text-slate-700 dark:text-slate-300 font-bold">Experience</th>
                <th className="p-4 text-slate-700 dark:text-slate-300 font-bold">Status</th>
                <th className="p-4 text-slate-700 dark:text-slate-300 font-bold">Date Added</th>
                <th className="p-4 pr-6 text-right text-slate-700 dark:text-slate-300 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm text-slate-700 dark:text-slate-300">
              {candidates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500 font-medium">
                    No candidates in the vault yet.
                  </td>
                </tr>
              ) : (
                candidates.map((cand) => (
                  <tr
                    key={cand.id}
                    onClick={() => router.push(`/candidate/${cand.id}`)}
                    className="hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                  >
                    <td className="p-4 pl-6 flex items-center gap-4">
                      <div className="p-2.5 bg-slate-100 dark:bg-slate-800 group-hover:bg-white dark:group-hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-colors">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white text-base group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{cand.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">{cand.current_role} &bull; {cand.country}</div>
                      </div>
                    </td>
                    <td className="p-4 align-middle">
                      <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                        {cand.visa_track_recommendation}
                      </span>
                    </td>
                    <td className="p-4 align-middle font-medium text-slate-600 dark:text-slate-400">
                      {cand.experience_years} Years
                    </td>
                    <td className="p-4 align-middle">
                      <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-bold bg-slate-900 dark:bg-blue-600 text-white">
                        {cand.status}
                      </span>
                    </td>
                    <td className="p-4 text-sm font-medium text-slate-500 dark:text-slate-400 align-middle">
                      {new Date(cand.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4 pr-6 text-right align-middle">
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Stops the row click from navigating to /candidate/[id]
                          setEditingCandidate(cand);
                        }}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors inline-flex"
                        title="Edit Candidate"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* The Slide-Over Editor Component */}
      <CandidateEditor
        candidate={editingCandidate}
        isOpen={!!editingCandidate}
        onClose={() => setEditingCandidate(null)}
        onRefresh={() => {
          if (onRefresh) onRefresh();
        }}
      />
    </>
  );
}