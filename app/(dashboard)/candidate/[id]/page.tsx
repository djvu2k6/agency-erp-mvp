"use client";

import React, { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, User, Briefcase, FileText, MapPin, Edit, Download, ShieldCheck, Camera, Loader2, Table } from "lucide-react";
import CandidateEditor from "@/components/CandidateEditor";
import * as XLSX from "xlsx"; // Make sure to import this!

export default function CandidateProfilePage() {
  const params = useParams();
  const router = useRouter();
  const candidateId = params.id as string;

  const [candidate, setCandidate] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    fetchEverything();
  }, [candidateId]);

  const fetchEverything = async () => {
    setLoading(true);
    const { data: candData } = await supabase.from("candidates").select("*").eq("id", candidateId).single();
    setCandidate(candData);

    const { data: docsData } = await supabase.storage.from("vault").list(`candidates/${candidateId}`);
    if (docsData) setDocuments(docsData.filter(d => d.name !== ".emptyFolderPlaceholder"));

    const { data: teamData } = await supabase.from("profiles").select("id, email, role");
    if (teamData) setAgents(teamData);

    setLoading(false);
  };

  const handleAssignAgent = async (agentId: string) => {
    await supabase.from("candidates").update({ assigned_agent_id: agentId }).eq("id", candidateId);
    fetchEverything();
  };

  const handleStatusChange = async (newStatus: string) => {
    await supabase.from("candidates").update({ status: newStatus }).eq("id", candidateId);
    fetchEverything();
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !candidate) return;

    setIsUploadingAvatar(true);
    const fileExt = file.name.split('.').pop();
    const filePath = `${candidateId}/avatar_${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file);

    if (!uploadError) {
      const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
      await supabase.from("candidates").update({ avatar_url: publicUrlData.publicUrl }).eq("id", candidateId);
      fetchEverything();
    }
    setIsUploadingAvatar(false);
  };

  // --- NEW: Bulletproof Native PDF Generation ---
  const handleGeneratePDF = () => {
    // This triggers the browser's print dialog. 
    // Tailwind's "print:" classes ensure only the resume section prints beautifully.
    window.print();
  };

  // --- NEW: Individual Excel Export ---
  const handleExportExcel = () => {
    if (!candidate) return;
    const exportData = [{
      "Candidate ID": candidate.candidate_id,
      "Full Name": candidate.name,
      "Email Address": candidate.email,
      "Phone Number": candidate.phone || "N/A",
      "Current Role": candidate.current_role,
      "Years Exp": candidate.experience_years,
      "Country": candidate.country,
      "Visa Track": candidate.visa_track_recommendation,
      "Skills": Array.isArray(candidate.skills) ? candidate.skills.join(", ") : candidate.skills,
      "Status": candidate.status,
    }];

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Candidate Profile");
    XLSX.writeFile(workbook, `${candidate.name.replace(/\s+/g, '_')}_Profile.xlsx`);
  };

  if (loading) return <div className="p-8 text-slate-500">Loading Command Center...</div>;
  if (!candidate) return <div className="p-8 text-red-500">Candidate not found.</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto w-full print:p-0 print:m-0">

      {/* Hide all navigation/buttons when printing */}
      <div className="print:hidden">
        <button onClick={() => router.push('/candidates')} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Roster
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-5">
            <div className="relative group cursor-pointer">
              <label className="cursor-pointer block relative">
                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={isUploadingAvatar} />
                {candidate.avatar_url ? (
                  <img src={candidate.avatar_url} alt={candidate.name} className="w-16 h-16 rounded-full object-cover border-2 border-slate-200 dark:border-slate-800" />
                ) : (
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-2xl font-bold border-2 border-transparent">
                    {candidate.name.charAt(0)}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {isUploadingAvatar ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Camera className="w-5 h-5 text-white" />}
                </div>
              </label>
            </div>

            <div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                {candidate.name}
                <span className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded font-mono uppercase tracking-wider align-middle">
                  {candidate.candidate_id || 'CID-PENDING'}
                </span>
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-4">
                <span className="flex items-center gap-1"><Briefcase className="w-4 h-4" /> {candidate.current_role}</span>
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {candidate.country}</span>
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm">
              <Edit className="w-4 h-4" /> Edit Profile
            </button>
            <button onClick={handleExportExcel} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-all shadow-sm shadow-emerald-600/20">
              <Table className="w-4 h-4" /> Excel
            </button>
            <button onClick={handleGeneratePDF} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-sm shadow-blue-600/20">
              <Download className="w-4 h-4" /> Generate PDF
            </button>
          </div>
        </div>
      </div>

      {/* Grid Layout (Becomes stacked list on Print) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print:grid-cols-1 print:gap-4 print:w-full">

        {/* Core Details - THIS IS WHAT PRINTS */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm h-fit print:border-none print:shadow-none print:p-0 print:block">

          {/* Print-only Header (Replaces the top UI in the PDF) */}
          <div className="hidden print:flex print:items-center print:gap-4 print:mb-8 print:border-b print:pb-6 print:border-slate-200">
            {candidate.avatar_url && (
              <img src={candidate.avatar_url} alt="Profile" className="w-24 h-24 rounded-full object-cover" />
            )}
            <div>
              <h1 className="text-4xl font-black text-black">{candidate.name}</h1>
              <p className="text-lg text-slate-600">{candidate.current_role} | {candidate.country}</p>
              <p className="text-sm text-slate-400 mt-1">{candidate.email} | {candidate.phone}</p>
            </div>
          </div>

          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2 print:text-black">
            <User className="w-5 h-5 text-blue-600 print:text-black" /> Professional Summary
          </h2>

          <div className="space-y-4 print:space-y-6">
            <div className="print:hidden">
              <p className="text-sm text-slate-500 mb-1">Email</p>
              <p className="font-medium text-slate-900 dark:text-white">{candidate.email}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 mb-1">Experience</p>
              <p className="font-medium text-slate-900 dark:text-white print:text-black">{candidate.experience_years} Years</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 mb-1">Target Visa Track</p>
              <p className="font-medium text-slate-900 dark:text-white print:text-black">{candidate.visa_track_recommendation}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 mb-2">Verified Skills</p>
              <div className="flex flex-wrap gap-2">
                {Array.isArray(candidate.skills) ? candidate.skills.map((skill: string) => (
                  <span key={skill} className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 print:text-black print:border-slate-300 text-xs font-bold rounded-md border border-slate-200 dark:border-slate-700">
                    {skill}
                  </span>
                )) : <span className="text-sm text-slate-500">No skills listed</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Hide internal data from the PDF print out */}
        <div className="print:hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm h-fit">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" /> Pipeline & Assignment
          </h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Assigned Agent</label>
              <select value={candidate.assigned_agent_id || ""} onChange={(e) => handleAssignAgent(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600/50 outline-none">
                <option value="">-- Unassigned --</option>
                {agents.map(agent => (
                  <option key={agent.id} value={agent.id}>{agent.email}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Placement Status</label>
              <select value={candidate.status || "Pending"} onChange={(e) => handleStatusChange(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600/50 outline-none">
                <option value="Pending">Pending Review</option>
                <option value="Interviewing">Interviewing</option>
                <option value="Visa Processing">Visa Processing</option>
                <option value="Placed">Placed / Hired</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        <div className="print:hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm h-fit">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-600" /> Document Vault
          </h2>
          <div className="space-y-3">
            {documents.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                No documents uploaded yet.
              </p>
            ) : (
              documents.map(doc => (
                <div key={doc.name} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate pr-4">
                    {doc.name.split('_').slice(1).join('_') || doc.name}
                  </span>
                </div>
              ))
            )}
            <button onClick={() => setIsEditing(true)} className="w-full mt-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
              Open Vault Manager
            </button>
          </div>
        </div>
      </div>

      <CandidateEditor candidate={candidate} isOpen={isEditing} onClose={() => setIsEditing(false)} onRefresh={fetchEverything} />
    </div>
  );
}