// src/App.tsx
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Login from "./screens/Login";
import CrewView from "./views/CrewView";
import GroundView from "./views/GroundView";
import TrifoldBrochureScreen from "./screens/TrifoldBrochureScreen";
import DemoScreen from "./screens/DemoScreen";
import VendorView from "./views/VendorView";

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <div className="animate-in" key={`${location.pathname}${location.search}`}>
      <Routes location={location}>
        <Route path="/" element={<Login />} />
        <Route path="/crew" element={<CrewView />} />
        <Route path="/ground" element={<GroundView />} />
        <Route path="/vendors" element={<VendorView />} />
        <Route path="/trifold" element={<TrifoldBrochureScreen />} />
        <Route path="/demo" element={<DemoScreen />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "var(--t-bg)" }}>
        <main style={{ flex: "1 1 auto", width: "100%" }}>
          <AnimatedRoutes />
        </main>
      </div>
    </BrowserRouter>
  );
}
