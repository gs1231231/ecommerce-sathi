export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dashboard shell will be implemented in Prompt 18 */}
      <main>{children}</main>
    </div>
  );
}
