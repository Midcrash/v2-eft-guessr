import React, { useState, useEffect } from "react";
import {
  uploadScreenshot,
  getMapsFromStorage,
  getLocationsFromStorage,
} from "../services/locationService";
import { loadGameImagesOptimized } from "../utils/imageUtils";
import supabase from "../api/supabase";

const StorageTest = () => {
  const [maps, setMaps] = useState([]);
  const [selectedMap, setSelectedMap] = useState("");
  const [locations, setLocations] = useState([]);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [files, setFiles] = useState([]);
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [imageCount, setImageCount] = useState(5);

  // Add a direct test function to check Supabase connection
  const [directTestStatus, setDirectTestStatus] = useState(null);
  const [directTestUrl, setDirectTestUrl] = useState(null);

  // Load available maps
  useEffect(() => {
    const loadMaps = async () => {
      try {
        const mapsList = await getMapsFromStorage();
        setMaps(mapsList);
        if (mapsList.length > 0) {
          setSelectedMap(mapsList[0]);
        }
      } catch (error) {
        console.error("Error loading maps:", error);
      }
    };

    loadMaps();
  }, []);

  // Load locations when map changes
  useEffect(() => {
    if (!selectedMap) return;

    const loadLocations = async () => {
      try {
        const locationsList = await getLocationsFromStorage(selectedMap);
        setLocations(locationsList);
      } catch (error) {
        console.error(`Error loading locations for ${selectedMap}:`, error);
      }
    };

    loadLocations();
  }, [selectedMap]);

  // Handle file selection
  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  // Handle map selection
  const handleMapChange = (e) => {
    setSelectedMap(e.target.value);
  };

  // Handle file upload
  const handleUpload = async () => {
    if (files.length === 0 || !selectedMap) {
      alert("Please select files and a map first");
      return;
    }

    setUploadStatus({ uploading: true, success: 0, failed: 0 });
    const results = { success: [], failures: [] };

    for (const file of files) {
      try {
        const result = await uploadScreenshot(file, selectedMap);
        if (result.success) {
          results.success.push(result);
        } else {
          results.failures.push({ file: file.name, error: result.error });
        }

        // Update status
        setUploadStatus({
          uploading: true,
          success: results.success.length,
          failed: results.failures.length,
          total: files.length,
        });
      } catch (error) {
        results.failures.push({ file: file.name, error: error.message });
        setUploadStatus((prev) => ({
          ...prev,
          failed: (prev?.failed || 0) + 1,
        }));
      }
    }

    // Final status update
    setUploadStatus({
      uploading: false,
      success: results.success.length,
      failed: results.failures.length,
      total: files.length,
      details: results,
    });

    // Refresh locations list
    if (results.success.length > 0) {
      const locationsList = await getLocationsFromStorage(selectedMap);
      setLocations(locationsList);
    }
  };

  // Handle optimized loading test
  const testOptimizedLoading = async () => {
    if (!selectedMap) {
      alert("Please select a map first");
      return;
    }

    setTestLoading(true);
    setTestResult(null);

    try {
      console.time("optimizedLoading");
      const startTime = performance.now();

      const images = await loadGameImagesOptimized(selectedMap, imageCount);

      const endTime = performance.now();
      console.timeEnd("optimizedLoading");

      setTestResult({
        success: true,
        count: images.length,
        time: (endTime - startTime).toFixed(2),
        firstImage: images.length > 0 ? images[0] : null,
      });
    } catch (error) {
      console.error("Error testing optimized loading:", error);
      setTestResult({
        success: false,
        error: error.message,
      });
    } finally {
      setTestLoading(false);
    }
  };

  // Debug storage function to directly test the raw Supabase functions
  const debugStorage = async () => {
    setTestLoading(true);
    setTestResult({
      stage: "starting",
      results: [],
    });

    const results = [];

    try {
      // Test 1: Check if we can connect to Supabase
      results.push({
        test: "Supabase Connection",
        status: "Checking...",
      });

      setTestResult({
        stage: "testing connection",
        results: [...results],
      });

      // Simple health check query
      const { data: healthCheck, error: healthError } = await supabase
        .from("locations")
        .select("count()", { count: "exact" })
        .limit(1);

      if (healthError) {
        results[results.length - 1] = {
          test: "Supabase Connection",
          status: "Failed",
          error: healthError.message,
        };
        throw new Error(`Connection check failed: ${healthError.message}`);
      }

      results[results.length - 1] = {
        test: "Supabase Connection",
        status: "Success",
      };

      // Test 2: List storage buckets
      results.push({
        test: "List Storage Buckets",
        status: "Checking...",
      });

      setTestResult({
        stage: "testing buckets",
        results: [...results],
      });

      const { data: buckets, error: bucketsError } =
        await supabase.storage.listBuckets();

      if (bucketsError) {
        results[results.length - 1] = {
          test: "List Storage Buckets",
          status: "Failed",
          error: bucketsError.message,
        };
        throw new Error(`Failed to list buckets: ${bucketsError.message}`);
      }

      results[results.length - 1] = {
        test: "List Storage Buckets",
        status: "Success",
        details: buckets.map((b) => b.name).join(", "),
      };

      // Test 3: Try listing the tarkov-images bucket
      results.push({
        test: "List tarkov-images Bucket",
        status: "Checking...",
      });

      setTestResult({
        stage: "listing images bucket",
        results: [...results],
      });

      const { data: imageFiles, error: imageFilesError } =
        await supabase.storage.from("tarkov-images").list("");

      if (imageFilesError) {
        results[results.length - 1] = {
          test: "List tarkov-images Bucket",
          status: "Failed",
          error: imageFilesError.message,
        };
        throw new Error(
          `Failed to list tarkov-images bucket: ${imageFilesError.message}`
        );
      }

      results[results.length - 1] = {
        test: "List tarkov-images Bucket",
        status: "Success",
        details:
          `Found ${imageFiles.length} items at root level` +
          (imageFiles.length > 0
            ? `: ${imageFiles.map((f) => f.name).join(", ")}`
            : ""),
      };

      // If we found any folders, try listing one of them
      const folders = imageFiles.filter((item) => item.id === null);

      if (folders.length > 0) {
        const testFolder = folders[0].name;

        results.push({
          test: `List Contents of ${testFolder} Folder`,
          status: "Checking...",
        });

        setTestResult({
          stage: `listing folder ${testFolder}`,
          results: [...results],
        });

        const { data: folderFiles, error: folderFilesError } =
          await supabase.storage.from("tarkov-images").list(testFolder);

        if (folderFilesError) {
          results[results.length - 1] = {
            test: `List Contents of ${testFolder} Folder`,
            status: "Failed",
            error: folderFilesError.message,
          };
        } else {
          results[results.length - 1] = {
            test: `List Contents of ${testFolder} Folder`,
            status: "Success",
            details:
              `Found ${folderFiles.length} items` +
              (folderFiles.length > 0
                ? ` (Examples: ${folderFiles
                    .slice(0, 3)
                    .map((f) => f.name)
                    .join(", ")})`
                : ""),
          };
        }
      }

      // Test 4: Try listing customs directory specifically
      results.push({
        test: "List 'customs' Folder",
        status: "Checking...",
      });

      setTestResult({
        stage: "listing customs folder",
        results: [...results],
      });

      const { data: customsFiles, error: customsFilesError } =
        await supabase.storage.from("tarkov-images").list("customs");

      if (customsFilesError) {
        results[results.length - 1] = {
          test: "List 'customs' Folder",
          status: "Failed",
          error: customsFilesError.message,
        };
      } else {
        results[results.length - 1] = {
          test: "List 'customs' Folder",
          status: "Success",
          details:
            `Found ${customsFiles.length} items` +
            (customsFiles.length > 0
              ? ` (Examples: ${customsFiles
                  .slice(0, 3)
                  .map((f) => f.name)
                  .join(", ")})`
              : ""),
        };
      }

      // Final results
      setTestResult({
        stage: "complete",
        results: results,
        success: true,
      });
    } catch (error) {
      console.error("Storage debug error:", error);
      setTestResult({
        stage: "error",
        results: results,
        error: error.message,
        success: false,
      });
    } finally {
      setTestLoading(false);
    }
  };

  // Add a direct test function to check Supabase connection
  const testDirectAccess = async () => {
    try {
      setDirectTestStatus("testing");

      // Test listing the root folder
      console.log("Testing direct root folder access");
      const { data: rootFolders, error: rootError } = await supabase.storage
        .from("tarkov-images")
        .list("");

      if (rootError) {
        throw new Error(`Error listing root folder: ${rootError.message}`);
      }

      console.log("Root folders:", rootFolders);

      // Test listing the customs folder if it exists
      const customsFolder = rootFolders.find((f) => f.name === "customs");
      if (!customsFolder) {
        throw new Error("Customs folder not found in storage bucket");
      }

      console.log("Found customs folder, testing file listing");
      const { data: customsFiles, error: customsError } = await supabase.storage
        .from("tarkov-images")
        .list("customs");

      if (customsError) {
        throw new Error(
          `Error listing customs folder: ${customsError.message}`
        );
      }

      if (!customsFiles || customsFiles.length === 0) {
        throw new Error("No files found in customs folder");
      }

      console.log(`Found ${customsFiles.length} files in customs folder`);
      const sampleFile = customsFiles[0];

      // Get the public URL for a sample file
      const { data: urlData } = supabase.storage
        .from("tarkov-images")
        .getPublicUrl(`customs/${sampleFile.name}`);

      console.log("Sample file URL:", urlData.publicUrl);
      setDirectTestUrl(urlData.publicUrl);

      // Test if we can actually load the image
      const img = new Image();
      img.onload = () => {
        console.log("Successfully loaded test image");
        setDirectTestStatus("success");
      };
      img.onerror = (err) => {
        console.error("Failed to load test image:", err);
        setDirectTestStatus("error-load");
      };
      img.src = urlData.publicUrl;
    } catch (error) {
      console.error("Direct test failed:", error);
      setDirectTestStatus("error");
      setDirectTestUrl("");
    }
  };

  // Add a test for the direct Supabase URL
  const testDirectUrl = async () => {
    try {
      setDirectTestStatus("testing-url");

      // The exact URL from your example
      const directUrl =
        "https://zzskvzngwjuccpsdnvlh.supabase.co/storage/v1/object/public/tarkov-images/customs/2023-12-05B-22-28-E_482.0-_2.6-_-118.5_0.0-_0.4-_0.0-_0.9_12.29_P0P-1742335795669.png";

      console.log("Testing direct URL access:", directUrl);
      setDirectTestUrl(directUrl);

      // Test if we can actually load the image
      const img = new Image();
      img.onload = () => {
        console.log("Successfully loaded direct test URL");
        setDirectTestStatus("url-success");
      };
      img.onerror = (err) => {
        console.error("Failed to load direct test URL:", err);
        setDirectTestStatus("url-error");
      };
      img.src = directUrl;

      // Also test if we can get it via the Supabase client
      console.log("Testing Supabase client access for the same file");
      const { data: signedUrlData, error: signedUrlError } =
        await supabase.storage
          .from("tarkov-images")
          .createSignedUrl(
            "customs/2023-12-05B-22-28-E_482.0-_2.6-_-118.5_0.0-_0.4-_0.0-_0.9_12.29_P0P-1742335795669.png",
            60
          );

      if (signedUrlError) {
        console.error("Error creating signed URL:", signedUrlError);
      } else {
        console.log("Successfully created signed URL:", signedUrlData);
      }
    } catch (error) {
      console.error("Direct URL test failed:", error);
      setDirectTestStatus("url-error");
    }
  };

  // Add comprehensive test for bucket access
  const testBucketAccess = async () => {
    try {
      console.log("====== STARTING COMPREHENSIVE BUCKET TEST ======");
      setDirectTestStatus("testing-bucket");

      // Step 1: List all buckets
      console.log("Step 1: Listing all buckets");
      const { data: buckets, error: bucketsError } =
        await supabase.storage.listBuckets();

      if (bucketsError) {
        console.error("Error listing buckets:", bucketsError);
        throw new Error(`Cannot list buckets: ${bucketsError.message}`);
      }

      console.log("Available buckets:", buckets);

      // Step 2: Check for tarkov-images bucket
      const tarkovBucket = buckets.find((b) => b.name === "tarkov-images");
      if (!tarkovBucket) {
        throw new Error(
          "tarkov-images bucket not found. Available buckets: " +
            buckets.map((b) => b.name).join(", ")
        );
      }

      console.log("Found tarkov-images bucket:", tarkovBucket);

      // Step 3: List root folder contents
      console.log("Step 3: Listing root folder of tarkov-images");
      const { data: rootItems, error: rootError } = await supabase.storage
        .from("tarkov-images")
        .list("");

      if (rootError) {
        console.error("Error listing root folder:", rootError);
        throw new Error(`Cannot list root folder: ${rootError.message}`);
      }

      console.log("Root folder contents:", rootItems);

      // Step 4: Try to find customs folder
      const customsFolder = rootItems.find((item) => item.name === "customs");
      if (!customsFolder) {
        throw new Error(
          "customs folder not found in root. Available items: " +
            rootItems.map((i) => i.name).join(", ")
        );
      }

      console.log("Found customs folder:", customsFolder);

      // Step 5: List customs folder contents
      console.log("Step 5: Listing contents of customs folder");
      const { data: customsFiles, error: customsError } = await supabase.storage
        .from("tarkov-images")
        .list("customs");

      if (customsError) {
        console.error("Error listing customs folder:", customsError);
        throw new Error(`Cannot list customs folder: ${customsError.message}`);
      }

      console.log("Customs folder contents:", customsFiles);

      if (!customsFiles || customsFiles.length === 0) {
        throw new Error("No files found in customs folder");
      }

      // Step 6: Get URL for a sample file
      console.log("Step 6: Getting URL for sample file");
      const sampleFile = customsFiles[0];

      // Try both public URL and signed URL methods
      const { data: publicUrlData } = supabase.storage
        .from("tarkov-images")
        .getPublicUrl(`customs/${sampleFile.name}`);

      console.log("Public URL:", publicUrlData);

      const { data: signedUrlData, error: signedUrlError } =
        await supabase.storage
          .from("tarkov-images")
          .createSignedUrl(`customs/${sampleFile.name}`, 60); // 60 second expiry

      if (signedUrlError) {
        console.error("Error creating signed URL:", signedUrlError);
      } else {
        console.log("Signed URL:", signedUrlData);
      }

      // Step 7: Try to download the file directly
      console.log("Step 7: Downloading file directly");
      const { data: fileData, error: fileError } = await supabase.storage
        .from("tarkov-images")
        .download(`customs/${sampleFile.name}`);

      if (fileError) {
        console.error("Error downloading file:", fileError);
      } else {
        console.log("File downloaded successfully:", fileData);
        // Create object URL from blob
        const objectUrl = URL.createObjectURL(fileData);
        console.log("Created object URL:", objectUrl);
      }

      // Set success status
      setDirectTestStatus("bucket-success");

      // Use the public URL for display
      setDirectTestUrl(publicUrlData.publicUrl);

      console.log("====== BUCKET TEST COMPLETED SUCCESSFULLY ======");
    } catch (error) {
      console.error("Bucket test failed:", error);
      setDirectTestStatus("bucket-error");
      setDirectTestUrl(null);
    }
  };

  return (
    <div
      className="storage-test"
      style={{
        padding: "20px",
        maxWidth: "800px",
        margin: "0 auto",
      }}
    >
      <h2>Storage-Based Upload Test</h2>

      <div className="card mb-4">
        <div className="card-header">
          <h2>Direct Storage Access Test</h2>
        </div>
        <div className="card-body">
          <button
            className="btn btn-primary mb-3"
            onClick={testDirectAccess}
            disabled={directTestStatus === "testing"}
          >
            {directTestStatus === "testing"
              ? "Testing..."
              : "Test Direct Supabase Access"}
          </button>

          {directTestStatus && (
            <div
              className={`alert ${
                directTestStatus.includes("error")
                  ? "alert-danger"
                  : "alert-success"
              }`}
            >
              {directTestStatus === "success" && (
                <>
                  <p>✅ Successfully connected to Supabase storage!</p>
                  {directTestUrl && (
                    <div>
                      <p>Sample image URL:</p>
                      <code style={{ wordBreak: "break-all" }}>
                        {directTestUrl}
                      </code>
                      <div className="mt-2">
                        <img
                          src={directTestUrl}
                          alt="Test image"
                          style={{
                            maxWidth: "300px",
                            border: "1px solid #ddd",
                          }}
                        />
                      </div>
                    </div>
                  )}
                </>
              )}
              {directTestStatus === "error" && (
                <p>
                  ❌ Failed to connect to Supabase storage. Check console for
                  details.
                </p>
              )}
              {directTestStatus === "error-load" && (
                <>
                  <p>❌ Connected to Supabase but failed to load the image.</p>
                  {directTestUrl && (
                    <div>
                      <p>URL that failed to load:</p>
                      <code style={{ wordBreak: "break-all" }}>
                        {directTestUrl}
                      </code>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Add the direct URL test button */}
          <button
            className="btn btn-warning mt-3"
            onClick={testDirectUrl}
            disabled={directTestStatus?.includes("testing")}
          >
            Test Direct Image URL
          </button>

          {directTestStatus?.includes("url") && (
            <div
              className={`alert mt-3 ${
                directTestStatus.includes("url-error")
                  ? "alert-danger"
                  : "alert-success"
              }`}
            >
              {directTestStatus === "url-success" && (
                <>
                  <p>✅ Successfully loaded the direct URL!</p>
                  {directTestUrl && (
                    <div>
                      <p>Direct image URL:</p>
                      <code style={{ wordBreak: "break-all" }}>
                        {directTestUrl}
                      </code>
                      <div className="mt-2">
                        <img
                          src={directTestUrl}
                          alt="Direct test image"
                          style={{
                            maxWidth: "300px",
                            border: "1px solid #ddd",
                          }}
                        />
                      </div>
                    </div>
                  )}
                </>
              )}
              {directTestStatus === "url-error" && (
                <>
                  <p>❌ Failed to load the direct URL.</p>
                  {directTestUrl && (
                    <div>
                      <p>URL that failed to load:</p>
                      <code style={{ wordBreak: "break-all" }}>
                        {directTestUrl}
                      </code>
                    </div>
                  )}
                </>
              )}
              {directTestStatus === "testing-url" && (
                <p>Testing direct URL access...</p>
              )}
            </div>
          )}

          {/* Add the comprehensive bucket test button */}
          <button
            className="btn btn-info mt-3"
            onClick={testBucketAccess}
            disabled={directTestStatus?.includes("testing")}
          >
            Run Comprehensive Bucket Test
          </button>

          {directTestStatus?.includes("bucket") && (
            <div
              className={`alert mt-3 ${
                directTestStatus.includes("bucket-error")
                  ? "alert-danger"
                  : "alert-success"
              }`}
            >
              {directTestStatus === "bucket-success" && (
                <>
                  <p>✅ Comprehensive bucket test successful!</p>
                  {directTestUrl && (
                    <div>
                      <p>Sample image URL from bucket:</p>
                      <code style={{ wordBreak: "break-all" }}>
                        {directTestUrl}
                      </code>
                      <div className="mt-2">
                        <img
                          src={directTestUrl}
                          alt="Bucket test image"
                          style={{
                            maxWidth: "300px",
                            border: "1px solid #ddd",
                          }}
                        />
                      </div>
                    </div>
                  )}
                </>
              )}
              {directTestStatus === "bucket-error" && (
                <p>
                  ❌ Bucket test failed. Check console for detailed error logs.
                </p>
              )}
              {directTestStatus === "testing-bucket" && (
                <p>
                  Running comprehensive bucket tests... Check console for
                  progress.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <h3>1. Select a Map</h3>
        <select value={selectedMap} onChange={handleMapChange}>
          {maps.length === 0 && <option value="">No maps found</option>}
          {maps.map((map) => (
            <option key={map} value={map}>
              {map}
            </option>
          ))}
        </select>
        {!selectedMap && maps.length > 0 && (
          <button onClick={() => setSelectedMap(maps[0])}>
            Select First Map
          </button>
        )}
      </div>

      <div style={{ marginBottom: "20px" }}>
        <h3>2. Select Tarkov Screenshot(s)</h3>
        <input
          type="file"
          accept=".png,.jpg,.jpeg"
          multiple
          onChange={handleFileChange}
        />
        <div>
          {files.length > 0 && (
            <p>
              Selected {files.length} file(s):{" "}
              {files.map((f) => f.name).join(", ")}
            </p>
          )}
        </div>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <h3>3. Upload Files</h3>
        <button
          onClick={handleUpload}
          disabled={
            !selectedMap || files.length === 0 || uploadStatus?.uploading
          }
          style={{
            padding: "8px 16px",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor:
              !selectedMap || files.length === 0 ? "not-allowed" : "pointer",
          }}
        >
          {uploadStatus?.uploading ? "Uploading..." : "Upload Files"}
        </button>

        {uploadStatus && (
          <div style={{ marginTop: "10px" }}>
            {uploadStatus.uploading ? (
              <p>
                Uploading: {uploadStatus.success + uploadStatus.failed}/
                {uploadStatus.total}
              </p>
            ) : (
              <p>
                Upload complete: {uploadStatus.success} successful,{" "}
                {uploadStatus.failed} failed
              </p>
            )}
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: "40px",
          borderTop: "1px solid #ddd",
          paddingTop: "20px",
        }}
      >
        <h3>Test Optimized Image Loading</h3>
        <div style={{ marginBottom: "15px" }}>
          <label style={{ marginRight: "10px" }}>
            Number of images:
            <input
              type="number"
              min="1"
              max="20"
              value={imageCount}
              onChange={(e) => setImageCount(parseInt(e.target.value) || 5)}
              style={{ marginLeft: "10px", width: "60px" }}
            />
          </label>
          <button
            onClick={testOptimizedLoading}
            disabled={!selectedMap || testLoading}
            style={{
              padding: "8px 16px",
              backgroundColor: "#2196F3",
              color: "white",
              border: "none",
              borderRadius: "4px",
              marginLeft: "10px",
              cursor: !selectedMap ? "not-allowed" : "pointer",
            }}
          >
            {testLoading ? "Loading..." : "Test Optimized Loading"}
          </button>
        </div>

        {testResult && (
          <div
            style={{
              backgroundColor: "#f0f8ff",
              padding: "15px",
              borderRadius: "4px",
            }}
          >
            {testResult.success ? (
              <>
                <h4 style={{ color: "#2196F3", margin: "0 0 10px 0" }}>
                  Test Successful ✓
                </h4>
                <p>
                  Loaded {testResult.count} images in {testResult.time}ms
                </p>
                {testResult.firstImage && (
                  <div>
                    <p>
                      <strong>Sample Image:</strong>
                    </p>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <img
                        src={testResult.firstImage.path}
                        alt="Sample"
                        style={{
                          width: "200px",
                          height: "auto",
                          marginRight: "15px",
                        }}
                      />
                      <div>
                        <p style={{ margin: "5px 0" }}>
                          <strong>ID:</strong> {testResult.firstImage.id}
                        </p>
                        <p style={{ margin: "5px 0" }}>
                          <strong>Coords:</strong> X:
                          {testResult.firstImage.coordinates.x.toFixed(2)}, Y:
                          {testResult.firstImage.coordinates.y.toFixed(2)}, Z:
                          {testResult.firstImage.coordinates.z.toFixed(2)}
                        </p>
                        <p style={{ margin: "5px 0" }}>
                          <strong>Original:</strong>{" "}
                          {testResult.firstImage.originalFilename}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                <p
                  style={{ marginTop: "10px", fontSize: "12px", color: "#666" }}
                >
                  Images are being preloaded in the background. Check console
                  for details.
                </p>
              </>
            ) : (
              <>
                <h4 style={{ color: "#f44336", margin: "0 0 10px 0" }}>
                  Test Failed ✗
                </h4>
                <p>{testResult.error}</p>
              </>
            )}
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: "40px",
          borderTop: "1px solid #ddd",
          paddingTop: "20px",
        }}
      >
        <h3>Debug Storage Configuration</h3>
        <div style={{ marginBottom: "15px" }}>
          <button
            onClick={debugStorage}
            disabled={testLoading}
            style={{
              padding: "8px 16px",
              backgroundColor: "#FF5722",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: testLoading ? "not-allowed" : "pointer",
            }}
          >
            {testLoading ? "Testing..." : "Run Storage Tests"}
          </button>
        </div>

        {testResult && testResult.stage && (
          <div
            style={{
              backgroundColor: "#fff3e0",
              padding: "15px",
              borderRadius: "4px",
            }}
          >
            <h4 style={{ margin: "0 0 10px 0" }}>
              Storage Tests{" "}
              {testResult.stage === "complete"
                ? "Complete"
                : `(${testResult.stage})`}
            </h4>

            <div style={{ marginBottom: "10px" }}>
              {testResult.results.map((result, index) => (
                <div
                  key={index}
                  style={{
                    padding: "10px",
                    marginBottom: "5px",
                    backgroundColor:
                      result.status === "Success"
                        ? "#e8f5e9"
                        : result.status === "Failed"
                        ? "#ffebee"
                        : "#f5f5f5",
                  }}
                >
                  <strong>{result.test}:</strong> {result.status}
                  {result.error && (
                    <div style={{ color: "#d32f2f", marginTop: "5px" }}>
                      {result.error}
                    </div>
                  )}
                  {result.details && (
                    <div style={{ fontSize: "0.9em", marginTop: "5px" }}>
                      {result.details}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {testResult.error && (
              <div style={{ color: "#d32f2f", marginTop: "10px" }}>
                <strong>Error:</strong> {testResult.error}
              </div>
            )}
          </div>
        )}
      </div>

      <div>
        <h3>Locations from Storage ({locations.length})</h3>
        {locations.length === 0 ? (
          <p>No locations found for {selectedMap || "selected map"}</p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: "16px",
            }}
          >
            {locations.map((location, index) => (
              <div
                key={index}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  padding: "10px",
                  backgroundColor: "#f9f9f9",
                }}
              >
                <img
                  src={location.image_path}
                  alt={`Location ${index}`}
                  style={{ width: "100%", height: "auto", marginBottom: "8px" }}
                />
                <div
                  style={{
                    fontSize: "12px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  <p>
                    <strong>Coords:</strong> X:{location.x_coord.toFixed(2)}, Y:
                    {location.y_coord.toFixed(2)}, Z:
                    {location.z_coord.toFixed(2)}
                  </p>
                  <p>
                    <strong>Filename:</strong> {location.filename}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StorageTest;
