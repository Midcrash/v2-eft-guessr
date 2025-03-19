import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import GameView from "./components/game/GameView";
import StorageTest from "./components/StorageTest";
import StorageURLDemo from "./components/StorageURLDemo";
import DirectURLDemo from "./components/DirectURLDemo";
import "./App.css";

// Debug tools component that shows in dev mode
const DebugTools = () => {
  // Only show in development mode
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: "10px",
        right: "10px",
        zIndex: 9999,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        padding: "10px",
        borderRadius: "4px",
        boxShadow: "0 2px 5px rgba(0,0,0,0.3)",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <Link
          to="/storage-test"
          style={{
            color: "#fff",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: "5px",
            fontSize: "14px",
          }}
        >
          <span style={{ fontSize: "18px" }}>⚙️</span>
          Storage Debug
        </Link>
        <Link
          to="/storage-url-demo"
          style={{
            color: "#fff",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: "5px",
            fontSize: "14px",
          }}
        >
          <span style={{ fontSize: "18px" }}>🔗</span>
          Storage URL Demo
        </Link>
        <Link
          to="/direct-url-demo"
          style={{
            color: "#fff",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: "5px",
            fontSize: "14px",
          }}
        >
          <span style={{ fontSize: "18px" }}>🪄</span>
          Direct URL Access
        </Link>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/play/:mapName" element={<GameView roundCount={5} />} />
        <Route path="/storage-test" element={<StorageTest />} />
        <Route path="/storage-url-demo" element={<StorageURLDemo />} />
        <Route path="/direct-url-demo" element={<DirectURLDemo />} />
      </Routes>
      <DebugTools />
    </Router>
  );
}

export default App;
