import DebugSharedList from "@/components/DebugSharedList";

export default function DebugPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Debug Tools</h1>
        <DebugSharedList />
      </div>
    </div>
  );
}
