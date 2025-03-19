import React from "react";
import { testInsert, checkAuth } from "../services/testInsert";

const TestInsertButton = () => {
  const handleTestInsert = async () => {
    const result = await testInsert();
    console.log("Test insert result:", result);
    alert(
      result.success
        ? "Insert successful!"
        : `Insert failed: ${result.error.message}`
    );
  };

  const handleCheckAuth = async () => {
    const result = await checkAuth();
    console.log("Auth check result:", result);
    alert(
      result.success
        ? "Auth check successful!"
        : `Auth check failed: ${result.error?.message || "Unknown error"}`
    );
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      <button
        onClick={handleTestInsert}
        style={{
          padding: "10px 15px",
          backgroundColor: "#4CAF50",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        Test Insert
      </button>
      <button
        onClick={handleCheckAuth}
        style={{
          padding: "10px 15px",
          backgroundColor: "#2196F3",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        Check Auth
      </button>
    </div>
  );
};

export default TestInsertButton;
