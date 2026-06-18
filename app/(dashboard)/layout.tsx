import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f4f4f5] dark:bg-slate-950 transition-colors duration-300 flex">
      {/* The new persistent Sidebar */}
      <Sidebar />

      {/* 
        The main content area. 
        On desktop (lg), we add a left margin of 64 (16rem = 256px) 
        so it doesn't hide behind the fixed sidebar.
      */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen transition-all duration-300 w-full overflow-x-hidden">
        {children}
      </div>
    </div>
  );
}