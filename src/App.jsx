import React, { Suspense, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import HomePage from "./pages/HomePage";
import GamePage from "./pages/GamePage";
import AdminPage from "./pages/AdminPage";
import TarkovMapPage from "./pages/TarkovMapPage";
import MapSelector from "./pages/MapSelector";
import TestInsertButton from "./components/TestInsertButton";
import StorageTest from "./components/StorageTest";
import { initDatabase } from "./services/gameService";
import "./App.css";

// Simple loading component
const Loading = () => (
  <div className="loading-container">
    <div className="loading-spinner"></div>
    <div>Loading...</div>
  </div>
);

function App() {
  // Initialize the database on app start
  useEffect(() => {
    const init = async () => {
      try {
        await initDatabase();
      } catch (error) {
        console.error("Failed to initialize database:", error);
      }
    };

    init();
  }, []);

  return (
    <Router>
      <div className="app">
        <Suspense fallback={<Loading />}>
          <Routes>
            {/* Home and maps selector routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/maps" element={<MapSelector />} />

            {/* Map viewing route */}
            <Route path="/map/:mapName" element={<TarkovMapPage />} />

            {/* Game routes */}
            <Route path="/play/:mapName/:rounds" element={<GamePage />} />

            {/* Admin route */}
            <Route path="/admin" element={<AdminPage />} />

            {/* Storage test route */}
            <Route path="/storage-test" element={<StorageTest />} />

            {/* Fallback for invalid routes */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>

        {/* Test buttons for debugging */}
        {/* <TestInsertButton /> */}
      </div>
    </Router>
  );
}

export default App;
