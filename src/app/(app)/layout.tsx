import Sidebar from "@/components/layout/sidebar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Sidebar />
      <main className="flex-1 bg-background p-8 overflow-auto min-h-screen">
        {children}
      </main>
    </>
  );
}
