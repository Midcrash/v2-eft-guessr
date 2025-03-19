import supabase from "../api/supabase";
import { parseCoordinatesFromFilename } from "../utils/coordinateUtils";
import { parseImageFilename } from "../utils/imageUtils";
import { getPublicUrl, getUrlsForFolder } from "../utils/storageUtils";

/**
 * Get all maps available in the database
 * @returns {Array} - Array of map objects
 */
export const getMaps = async () => {
  const { data, error } = await supabase
    .from("locations")
    .select("map_name")
    .order("map_name")
    .then(({ data }) => {
      // Get unique map names
      return [...new Set(data.map((item) => item.map_name))];
    });

  if (error) {
    console.error("Error fetching maps:", error);
    throw error;
  }

  return data || [];
};

/**
 * Get locations for a specific map
 * @param {string} mapName - Name of the map
 * @returns {Array} - Array of location objects
 */
export const getLocations = async (mapName) => {
  const { data, error } = await supabase
    .from("locations")
    .select("*")
    .eq("map_name", mapName);

  if (error) {
    console.error("Error fetching locations:", error);
    throw error;
  }

  return data || [];
};

/**
 * Upload a screenshot to Supabase Storage
 * @param {File} file - Screenshot file
 * @param {string} mapName - Name of the map
 * @returns {Object} - Upload result
 */
export const uploadScreenshot = async (file, mapName) => {
  try {
    // Store the original filename for extraction of coordinates later
    const originalFilename = file.name;

    // Sanitize filename for Supabase Storage
    // Replace problematic characters with safe alternatives
    const sanitizedFilename = sanitizeFilenameForStorage(file.name);

    // Create storage path with sanitized filename
    const filePath = `${mapName}/${sanitizedFilename}`;

    console.log(
      `Uploading file to ${filePath} (sanitized from ${originalFilename})`
    );

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("tarkov-images")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false, // Don't overwrite if exists
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      // If error is not just "file already exists", throw it
      if (uploadError.message !== "The resource already exists") {
        throw uploadError;
      }
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("tarkov-images")
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;
    console.log("Supabase returned URL:", publicUrl);

    // Try to parse coordinates just to verify the file has valid coordinates
    try {
      const coords = parseCoordinatesFromFilename(originalFilename);
      console.log("Successfully parsed coordinates:", coords);
    } catch (parseError) {
      console.warn(
        "Warning: Could not parse coordinates from filename:",
        parseError
      );
      // Continue anyway - we're just logging, not using for DB
    }

    return {
      success: true,
      fileUrl: publicUrl,
      fileName: originalFilename,
      sanitizedName: sanitizedFilename,
    };
  } catch (error) {
    console.error("Error uploading screenshot:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Sanitize a filename for Supabase Storage
 * Replaces problematic characters that cause issues with Supabase Storage paths
 * while preserving the coordinate format as much as possible
 * @param {string} filename - The original filename
 * @returns {string} - A sanitized filename safe for Supabase Storage
 */
export const sanitizeFilenameForStorage = (filename) => {
  console.log("Original filename before sanitization:", filename);

  // Extract components - we want to preserve the coordinate part
  // Typical format: 2023-12-05[22-32]_676.0, 8.5, 126.1_0.0, -0.9, 0.1, 0.5_12.78 (0).png
  const parts = filename.split("_");

  // Process each part separately
  const processedParts = parts.map((part, index) => {
    // The first part usually contains the timestamp with brackets
    if (index === 0) {
      return part.replace(/\[/g, "TS-").replace(/\]/g, "-TS");
    }

    // For parts that likely contain coordinates (second and third parts)
    // We'll preserve commas but replace spaces, brackets, and parentheses
    if (index === 1 || index === 2) {
      // Keep commas for coordinates but replace spaces with an underscore
      // Don't add any additional characters after the comma
      return part.replace(/,\s+/g, ",").replace(/\s+/g, "_");
    }

    // For the last part which may contain parentheses (index)
    if (index === parts.length - 1) {
      // Replace parentheses and spaces
      return part.replace(/\(/g, "P").replace(/\)/g, "P").replace(/\s+/g, "_");
    }

    // For any other part, just return as is
    return part;
  });

  // Join the processed parts back with underscores
  let safeFilename = processedParts.join("_");

  // Add a timestamp to ensure uniqueness
  const timestamp = new Date().getTime();
  const filenameParts = safeFilename.split(".");
  const extension = filenameParts.pop();

  // Insert timestamp before extension
  safeFilename = `${filenameParts.join(".")}-${timestamp}.${extension}`;

  console.log("Sanitized filename:", safeFilename);
  return safeFilename;
};

/**
 * Upload multiple screenshots at once
 * @param {Array<File>} files - Array of screenshot files
 * @param {string} mapName - Name of the map
 * @returns {Object} - Upload results
 */
export const uploadBatchScreenshots = async (files, mapName) => {
  const results = {
    success: [],
    failures: [],
  };

  for (const file of files) {
    try {
      const result = await uploadScreenshot(file, mapName);

      if (result.success) {
        results.success.push({
          fileUrl: result.fileUrl,
          fileName: result.fileName,
        });
      } else {
        results.failures.push({
          file: file.name,
          error: result.error,
        });
      }
    } catch (error) {
      results.failures.push({
        file: file.name,
        error: error.message,
      });
    }
  }

  return results;
};

/**
 * Get map configuration (bounds, etc.)
 * @param {string} mapName - Name of the map
 * @returns {Object} - Map configuration
 */
export const getMapConfig = async (mapName) => {
  const { data, error } = await supabase
    .from("map_configs")
    .select("*")
    .eq("map_name", mapName)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // If no config found, return a default one
      return {
        map_name: mapName,
        worldBounds: {
          x1: -1000,
          z1: -1000,
          x2: 1000,
          z2: 1000,
        },
        imageWidth: 1024,
        imageHeight: 1024,
      };
    }
    console.error("Error fetching map config:", error);
    throw error;
  }

  return data;
};

/**
 * Store/update map configuration
 * @param {Object} mapConfig - Map configuration object
 * @returns {Object} - Updated map configuration
 */
export const saveMapConfig = async (mapConfig) => {
  const { data, error } = await supabase
    .from("map_configs")
    .upsert({
      map_name: mapConfig.map_name,
      world_bounds: mapConfig.worldBounds,
      image_width: mapConfig.imageWidth,
      image_height: mapConfig.imageHeight,
    })
    .select()
    .single();

  if (error) {
    console.error("Error saving map config:", error);
    throw error;
  }

  return data;
};

/**
 * Get locations for a specific map by listing files directly from storage
 * This replaces the database query approach with direct storage access
 * @param {string} mapName - Name of the map
 * @returns {Array} - Array of location objects with coordinates parsed from filenames
 */
export const getLocationsFromStorage = async (mapName) => {
  try {
    console.log(
      `Fetching locations for map "${mapName}" directly from storage bucket "tarkov-images"`
    );

    // Get all image URLs using our new utility
    const imagesWithUrls = await getUrlsForFolder("tarkov-images", mapName);

    console.log(`Found ${imagesWithUrls.length} files for map: "${mapName}"`);

    if (imagesWithUrls.length === 0) {
      console.log(`No files found for map: "${mapName}" in storage bucket`);

      // Try to list the root folder to see what's available
      console.log("Attempting to list root folder to debug...");
      const { data: rootFiles, error: rootError } = await supabase.storage
        .from("tarkov-images")
        .list("");

      if (rootError) {
        console.error("Error listing root folder:", rootError);
      } else {
        console.log("Available folders/files in root:", rootFiles);
      }

      throw new Error(
        `No images found in folder "${mapName}" - please verify folder exists and contains images`
      );
    }

    // Filter out any placeholder files
    const validImages = imagesWithUrls.filter(
      (img) => img.name !== ".emptyFolderPlaceholder"
    );

    if (validImages.length < imagesWithUrls.length) {
      console.log(
        `Filtered out ${
          imagesWithUrls.length - validImages.length
        } placeholder files`
      );
    }

    if (validImages.length === 0) {
      console.log(`All files were placeholders in map: "${mapName}"`);
      throw new Error(`Only placeholder files found in folder "${mapName}"`);
    }

    // Log all filenames for debugging
    console.log(
      `All valid filenames: ${validImages.map((f) => f.name).join(", ")}`
    );

    // Process each file to extract coordinates from filename
    const locations = validImages
      .map((imageInfo) => {
        try {
          // Use our improved parseImageFilename function from imageUtils
          const parsedInfo = parseImageFilename(imageInfo.name);

          if (!parsedInfo || !parsedInfo.coordinates) {
            console.warn(`Failed to parse coordinates from ${imageInfo.name}`);
            return null;
          }

          const coords = parsedInfo.coordinates;

          // Extra validation to ensure we got valid coordinates
          if (isNaN(coords.x) || isNaN(coords.y) || isNaN(coords.z)) {
            console.warn(
              `Invalid coordinates after parsing: x=${coords.x}, y=${coords.y}, z=${coords.z} from ${imageInfo.name}`
            );
            return null;
          }

          console.log(
            `Successfully extracted coordinates from ${imageInfo.name}:`,
            coords
          );

          // Generate a stable ID from the filename
          const stableId = `${mapName}-${imageInfo.name.replace(/\..+$/, "")}`;

          // Return a location object similar to what would come from the database
          // Explicitly ensure all coordinates are stored as floats
          return {
            id: stableId,
            map_name: mapName,
            x_coord: parseFloat(coords.x),
            y_coord: parseFloat(coords.y),
            z_coord: parseFloat(coords.z),
            image_path: imageInfo.url,
            filename: imageInfo.name,
            created_at: new Date().toISOString(),
          };
        } catch (error) {
          console.warn(
            `Could not parse coordinates from filename: ${imageInfo.name}`,
            error
          );
          // Return null for files that don't match the expected format
          return null;
        }
      })
      .filter(Boolean); // Remove any null entries (files that couldn't be parsed)

    console.log(
      `Successfully parsed ${locations.length} locations from storage for map "${mapName}"`
    );

    if (locations.length === 0) {
      console.warn(
        `WARNING: No valid locations could be parsed for map "${mapName}". Check if filenames follow the correct format.`
      );
      throw new Error(
        `Found ${validImages.length} files but none had valid coordinates in their filenames`
      );
    } else {
      // Log a sample location for debugging
      console.log("Sample location parsed:", locations[0]);
    }

    return locations;
  } catch (error) {
    console.error(
      `Error fetching locations from storage for map "${mapName}":`,
      error
    );
    throw new Error(`Failed to load locations from storage: ${error.message}`);
  }
};

/**
 * Get all maps available in the storage bucket
 * This replaces the database query approach with direct storage access
 * @returns {Array} - Array of map names
 */
export const getMapsFromStorage = async () => {
  try {
    console.log("Fetching maps directly from storage bucket 'tarkov-images'");

    // List all top-level folders (each folder is a map)
    const { data: folders, error } = await supabase.storage
      .from("tarkov-images")
      .list("", { sortBy: { column: "name", order: "asc" } });

    if (error) {
      console.error(
        "Error listing maps from storage bucket 'tarkov-images':",
        error
      );
      throw new Error(`Failed to list maps: ${error.message}`);
    }

    if (!folders || folders.length === 0) {
      console.log("No maps found in storage bucket 'tarkov-images'");
      return [];
    }

    console.log("Raw storage response:", folders);

    // Filter out any non-folder items and extract map names
    const mapNames = folders
      .filter((item) => item.id === null) // Folders have null id in Supabase storage
      .map((folder) => folder.name);

    if (mapNames.length === 0) {
      console.warn(
        "Found items in storage but none were valid map folders. Raw items:",
        folders.map((f) => `${f.name} (id: ${f.id})`)
      );
    }

    console.log(
      `Found ${mapNames.length} maps in storage: ${mapNames.join(", ")}`
    );
    return mapNames;
  } catch (error) {
    console.error("Error fetching maps from storage:", error);
    throw new Error(`Failed to fetch maps: ${error.message}`);
  }
};
