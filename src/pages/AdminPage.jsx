import React from "react";
import { Link } from "react-router-dom";
import OptimizedImageUploader from "../components/upload/OptimizedImageUploader";
import "./AdminPage.css";

const AdminPage = () => {
  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>EFTGuessr Admin</h1>
        <Link to="/" className="back-link">
          ← Back to Home
        </Link>
      </div>

      <div className="admin-content">
        <div className="admin-card">
          <h2>Upload Screenshots</h2>
          <p className="admin-description">
            Upload screenshots from Escape from Tarkov. The filename must
            contain the coordinates in the format:
            <br />
            <code>
              2023-12-05[22-28]_482.0, 2.6, -118.5_0.0, 0.4, 0.0, 0.9_12.29
              (0).png
            </code>
          </p>

          <OptimizedImageUploader />
        </div>

        <div className="admin-info">
          <h3>Instructions</h3>
          <ol>
            <li>Select the map the screenshots belong to</li>
            <li>Choose one or more screenshot files</li>
            <li>Configure image optimization settings (recommended)</li>
            <li>Click "Upload Screenshots" to add them to the database</li>
            <li>
              The coordinates will be automatically extracted from the filename
            </li>
          </ol>

          <h3>Tips</h3>
          <ul>
            <li>Make sure the screenshots have clear visibility</li>
            <li>Try to include recognizable landmarks</li>
            <li>Avoid very similar locations</li>
            <li>Add a variety of difficulty levels</li>
            <li>
              Using image optimization can significantly reduce storage costs
            </li>
          </ul>

          <h3>Optimization Benefits</h3>
          <ul>
            <li>
              <strong>Reduced Storage Costs:</strong> Optimized images use less
              Supabase storage space, reducing your monthly bill
            </li>
            <li>
              <strong>Faster Load Times:</strong> Smaller file sizes mean images
              load faster during gameplay, improving the user experience
            </li>
            <li>
              <strong>Lower Bandwidth Usage:</strong> Optimized images use less
              bandwidth for both you and your players
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
