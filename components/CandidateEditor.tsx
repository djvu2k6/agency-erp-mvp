"use client";

import React, { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { X, Upload, FileText, Save, Loader2, Trash2 } from "lucide-react";

interface CandidateEditorProps {
    candidate: any;
    isOpen: boolean;
    onClose: () => void;
    onRefresh: () => void; // Trigger a refresh in the parent table
}

export default function CandidateEditor({ candidate, isOpen, onClose, onRefresh }: CandidateEditorProps) {
    const [formData, setFormData] = useState({
        name: "",
        skills: "",
        status: "",
    });
    const [documents, setDocuments] = useState<any[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Populate data when panel opens
    useEffect(() => {
        if (candidate && isOpen) {
            setFormData({
                name: candidate.name || "",
                // Convert skills array to comma string for easy editing
                skills: Array.isArray(candidate.skills) ? candidate.skills.join(", ") : (candidate.skills || ""),
                status: candidate.status || "Pending",
            });
            fetchDocuments();
        }
    }, [candidate, isOpen]);

    // Fetch files from this candidate's specific folder in the 'vault' bucket
    const fetchDocuments = async () => {
        if (!candidate) return;
        const { data, error } = await supabase.storage
            .from("vault")
            .list(`candidates/${candidate.id}`);

        if (!error && data) {
            // Filter out the empty folder placeholder if it exists
            setDocuments(data.filter(file => file.name !== ".emptyFolderPlaceholder"));
        }
    };

    // Handle standard text updates
    const handleSave = async () => {
        setIsSaving(true);
        // Convert comma string back to array if your DB expects text[]
        const skillsArray = formData.skills.split(",").map(s => s.trim()).filter(s => s);

        const { error } = await supabase
            .from("candidates")
            .update({
                name: formData.name,
                skills: skillsArray,
                status: formData.status,
                updated_at: new Date().toISOString()
            })
            .eq("id", candidate.id);

        setIsSaving(false);
        if (!error) {
            onRefresh(); // Refresh table
            onClose();   // Close panel
        } else {
            console.error("Save failed:", error);
        }
    };

    // Handle file uploads directly to Supabase Storage
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !candidate) return;

        setIsUploading(true);

        // Path: candidates/{uuid}/{filename}
        const filePath = `candidates/${candidate.id}/${Date.now()}_${file.name}`;

        const { error } = await supabase.storage
            .from("vault")
            .upload(filePath, file);

        setIsUploading(false);

        if (!error) {
            fetchDocuments(); // Refresh the file list
        } else {
            console.error("Upload failed:", error);
        }
    };

    const deleteDocument = async (fileName: string) => {
        const { error } = await supabase.storage
            .from("vault")
            .remove([`candidates/${candidate.id}/${fileName}`]);

        if (!error) fetchDocuments();
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Background Overlay */}
            <div
                className="fixed inset-0 bg-slate-900/20 dark:bg-slate-900/60 backdrop-blur-sm z-40"
                onClick={onClose}
            />

            {/* Slide-over Panel */}
            <div className={`fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 transform transition-transform duration-300 ease-in-out flex flex-col`}>

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Edit Candidate</h2>
                        <p className="text-xs font-mono text-slate-500 mt-1">{candidate?.candidate_id}</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                    {/* Details Form */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600/50 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Skills (Comma separated)</label>
                            <textarea
                                value={formData.skills}
                                onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                                rows={3}
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600/50 outline-none"
                            />
                        </div>
                    </div>

                    <hr className="border-slate-100 dark:border-slate-800" />

                    {/* Document Vault Section */}
                    <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-600" /> Document Vault
                        </h3>

                        {/* Upload Button */}
                        <label className="flex items-center justify-center w-full p-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors mb-4 group">
                            <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                            {isUploading ? (
                                <span className="flex items-center gap-2 text-sm font-medium text-slate-500"><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</span>
                            ) : (
                                <span className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                    <Upload className="w-4 h-4" /> Click to upload PDF/Doc
                                </span>
                            )}
                        </label>

                        {/* File List */}
                        <div className="space-y-2">
                            {documents.length === 0 && !isUploading && (
                                <p className="text-xs text-center text-slate-500">No documents in vault.</p>
                            )}
                            {documents.map((doc) => (
                                <div key={doc.name} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-lg">
                                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate pr-4">{doc.name.split('_').slice(1).join('_') || doc.name}</span>
                                    <button onClick={() => deleteDocument(doc.name)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded-md transition-colors shrink-0">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex gap-3">
                    <button onClick={onClose} className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                        Cancel
                    </button>
                    <button onClick={handleSave} disabled={isSaving} className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/20 flex items-center justify-center gap-2">
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Changes
                    </button>
                </div>
            </div>
        </>
    );
}