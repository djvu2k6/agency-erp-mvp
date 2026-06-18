"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    Settings,
    LogOut,
    Menu,
    X
} from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [role, setRole] = useState<string | null>(null);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Fetch the current user's role on load
    useEffect(() => {
        const fetchRole = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
                if (data) setRole(data.role);
            }
        };
        fetchRole();
    }, []);

    const isAdmin = role?.toLowerCase() === "admin";

    // Navigation Items: Dashboard requires Admin. Candidates now points to your new section.
    const allNavItems = [
        { name: "Dashboard", href: "/", icon: LayoutDashboard, reqAdmin: true },
        { name: "Candidates", href: "/candidate-section", icon: Users, reqAdmin: false },
        { name: "Settings", href: "/settings", icon: Settings, reqAdmin: false },
    ];

    // Filter items based on role
    const navItems = allNavItems.filter(item => !item.reqAdmin || isAdmin);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
    };

    return (
        <>
            {/* Mobile Hamburger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200"
            >
                {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Sidebar Container */}
            <div className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-transform duration-300 ease-in-out flex flex-col print:hidden
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>

                {/* Logo Area */}
                <div className="h-[84px] flex items-center px-8 border-b border-slate-100 dark:border-slate-800 shrink-0">
                    <div className="w-8 h-8 bg-slate-900 dark:bg-blue-600 rounded-lg flex items-center justify-center mr-3 shrink-0 shadow-sm">
                        <Users className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                        Candidate <span className="text-blue-600 dark:text-blue-400">Flow</span>
                    </span>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={() => setIsOpen(false)}
                                className={`
                  flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-sm transition-all
                  ${isActive
                                        ? "bg-slate-900 dark:bg-blue-600 text-white shadow-sm"
                                        : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"}
                `}
                            >
                                <Icon className="w-5 h-5" />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer / Sign Out */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="px-4 py-2 mb-2 text-xs font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        Role: <span className={isAdmin ? "text-blue-600 dark:text-blue-400 font-bold" : "text-emerald-600 dark:text-emerald-400 font-bold"}>{role || "..."}</span>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 w-full rounded-xl font-bold text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                    >
                        <LogOut className="w-5 h-5" />
                        Sign Out
                    </button>
                </div>
            </div>

            {/* Mobile Overlay Background */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/20 dark:bg-slate-900/60 z-30 lg:hidden backdrop-blur-sm"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </>
    );
}