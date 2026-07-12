import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar from "./components/layout/Sidebar";
import Navbar from "./components/layout/Navbar";

import Dashboard from "./components/pages/Dashboard";
import OrganizationSetup from "./components/pages/OrganizationSetup";
import AssetDirectory from "./components/pages/AssetDirectory";
import AssetDetail from "./components/pages/AssetDetail";
import Allocations from "./components/pages/Allocations";
function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen bg-surface">
        <Sidebar />

        <div className="flex-1 flex flex-col overflow-hidden">
          <Navbar />

          <main className="flex-1 overflow-y-auto p-6">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/organization" element={<OrganizationSetup />} />
              <Route path="/assets" element={<AssetDirectory />} />
              <Route path="/assets/:id" element={<AssetDetail />} />
              <Route path="/allocations" element={<Allocations />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;

