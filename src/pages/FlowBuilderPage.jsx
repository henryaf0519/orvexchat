import MainSidebar from "../components/MainSidebar";
import FlowBuilder from "../components/FlowBuilder";

export default function FlowBuilderPage() {
  return (
    <div className="h-screen flex bg-gray-100">
      <MainSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">
              Constructor de Flujos
            </h1>
            <div style={{ width: '100%', height: '80vh' }}>
                 <FlowBuilder />
            </div>
        </main>
      </div>
    </div>
  );
}