import supabase from "../api/supabase";
import { log, error } from "./logger";

/**
 * Get a public URL for a file in the Supabase storage bucket
 * @param {string} bucketName - Name of the storage bucket
 * @param {string} filePath - Path to the file within the bucket
 * @returns {string} - Public URL for the file
 */
export const getPublicUrl = (bucketName, filePath) => {
  const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);

  return data.publicUrl;
};

/**
 * Get URLs for all files in a folder inside a bucket
 * @param {string} bucketName - Name of the storage bucket (default: "tarkov-images")
 * @param {string} folderPath - Path to the folder within the bucket (default: "customs")
 * @returns {Promise<Array<Object>>} - Array of objects containing file names and their URLs
 */
export const getUrlsForFolder = async (
  bucketName = "tarkov-images",
  folderPath = "customs"
) => {
  try {
    log(`Listing files in ${bucketName}/${folderPath}`);

    // List all files in the folder
    const { data: files, error } = await supabase.storage
      .from(bucketName)
      .list(folderPath);

    if (error) {
      error(`Error listing files in ${bucketName}/${folderPath}:`, error);
      throw error;
    }

    if (!files || files.length === 0) {
      log(`No files found in ${bucketName}/${folderPath}`);
      return [];
    }

    log(`Found ${files.length} files in ${bucketName}/${folderPath}`);

    // Filter out the .emptyFolderPlaceholder file - it's a system file Supabase creates
    const validFiles = files.filter(
      (file) => file.name !== ".emptyFolderPlaceholder"
    );

    if (validFiles.length !== files.length) {
      log(`Filtered out ${files.length - validFiles.length} placeholder files`);
    }

    if (validFiles.length === 0) {
      log(
        `No valid files found in ${bucketName}/${folderPath} after filtering placeholders`
      );
      return [];
    }

    // Get public URL for each file
    const urlsWithNames = validFiles.map((file) => {
      const path = `${folderPath}/${file.name}`;
      const url = getPublicUrl(bucketName, path);

      return {
        name: file.name,
        path: path,
        url: url,
      };
    });

    return urlsWithNames;
  } catch (error) {
    error("Error getting URLs for folder:", error);
    throw error;
  }
};

/**
 * Get a list of all available maps (folders) in the storage bucket
 * @param {string} bucketName - Name of the storage bucket (default: "tarkov-images")
 * @returns {Promise<Array<string>>} - Array of map names (folder names)
 */
export const getAvailableMaps = async (bucketName = "tarkov-images") => {
  try {
    // List all folders in the root
    const { data: items, error } = await supabase.storage
      .from(bucketName)
      .list("");

    if (error) {
      error(`Error listing root folders in ${bucketName}:`, error);
      throw error;
    }

    if (!items || items.length === 0) {
      log(`No items found in ${bucketName}`);
      return [];
    }

    // Filter to include only folders
    const folders = items
      .filter((item) => item.id === null) // In Supabase, folders have null id
      .map((folder) => folder.name);

    log(`Found ${folders.length} maps in ${bucketName}:`, folders);

    return folders;
  } catch (error) {
    error("Error getting available maps:", error);
    throw error;
  }
};

/**
 * Get a sample image URL from each available map
 * @param {string} bucketName - Name of the storage bucket (default: "tarkov-images")
 * @returns {Promise<Object>} - Object with map names as keys and sample image URLs as values
 */
export const getSampleImagesForMaps = async (bucketName = "tarkov-images") => {
  try {
    const maps = await getAvailableMaps(bucketName);
    const result = {};

    for (const map of maps) {
      try {
        // Get files in this map folder
        const { data: files, error } = await supabase.storage
          .from(bucketName)
          .list(map);

        if (error || !files || files.length === 0) {
          log(`No files found for map: ${map}`);
          result[map] = null;
          continue;
        }

        // Filter out placeholder files
        const validFiles = files.filter(
          (file) => file.name !== ".emptyFolderPlaceholder"
        );

        if (validFiles.length === 0) {
          log(`No valid files found for map: ${map} (only placeholders found)`);
          result[map] = null;
          continue;
        }

        // Get URL for the first valid file
        const sampleFile = validFiles[0];
        const path = `${map}/${sampleFile.name}`;
        result[map] = getPublicUrl(bucketName, path);
      } catch (error) {
        error(`Error getting sample image for map ${map}:`, error);
        result[map] = null;
      }
    }

    return result;
  } catch (error) {
    error("Error getting sample images:", error);
    throw error;
  }
};

/**
 * Lists files within a specific folder in the specified bucket
 * @param {Object} supabase - Supabase client
 * @param {string} bucketName - Name of the storage bucket
 * @param {string} folderPath - Path to the folder (e.g., 'customs/')
 * @returns {Promise<Array>} - Array of file objects
 */
export const listFiles = async (supabase, bucketName, folderPath = "") => {
  try {
    // Normalize folder path to ensure it ends with a slash if not empty
    if (folderPath && !folderPath.endsWith("/")) {
      folderPath = `${folderPath}/`;
    }

    log(`Listing files in ${bucketName}/${folderPath}`);

    // List all files in the specified folder
    const { data, error: listError } = await supabase.storage
      .from(bucketName)
      .list(folderPath);

    if (listError) {
      error(`Error listing files in ${bucketName}/${folderPath}:`, listError);
      return [];
    }

    // Filter out folders (items without metadata)
    const files = data.filter((item) => item.metadata);

    if (files.length === 0) {
      log(`No files found in ${bucketName}/${folderPath}`);
      return [];
    }

    log(`Found ${files.length} files in ${bucketName}/${folderPath}`);
    return files;
  } catch (error) {
    error(`Error listing files in ${bucketName}/${folderPath}:`, error);
    return [];
  }
};
