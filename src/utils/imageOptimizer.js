/**
 * Image optimization utility functions for compressing screenshots before upload
 * This helps reduce storage costs and improve loading times
 */

/**
 * Optimize an image file by resizing and compressing it
 * @param {File} file - The original image file
 * @param {Object} options - Optimization options
 * @param {number} options.maxWidth - Maximum width in pixels (default: 1280)
 * @param {number} options.quality - JPEG quality from 0 to 1 (default: 0.8)
 * @param {string} options.format - Output format ('jpeg', 'png', or 'webp') (default: 'jpeg')
 * @param {boolean} options.preserveFilename - Whether to keep the original filename (default: true)
 * @returns {Promise<File>} - A promise that resolves to the optimized image file
 */
export const optimizeImage = async (
  file,
  {
    maxWidth = 1280,
    quality = 0.8,
    format = "jpeg",
    preserveFilename = true,
  } = {}
) => {
  return new Promise((resolve, reject) => {
    // Create an image to load the file
    const img = new Image();
    img.onload = () => {
      // Calculate dimensions while maintaining aspect ratio
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        const ratio = maxWidth / width;
        width = maxWidth;
        height = Math.round(height * ratio);
      }

      // Create a canvas for the resized image
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      // Draw the image onto the canvas
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      // Determine the mime type based on format
      let mimeType;
      switch (format.toLowerCase()) {
        case "jpeg":
        case "jpg":
          mimeType = "image/jpeg";
          break;
        case "png":
          mimeType = "image/png";
          break;
        case "webp":
          mimeType = "image/webp";
          break;
        default:
          mimeType = "image/jpeg";
      }

      // Convert canvas to blob
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Failed to create blob from image"));
            return;
          }

          // Create a new file from the blob
          let filename;
          if (preserveFilename) {
            // Keep original filename but change extension if format changed
            const originalExt = file.name.split(".").pop().toLowerCase();
            const newExt = format.toLowerCase();
            if (originalExt !== newExt && format !== "jpeg") {
              filename = file.name.replace(
                new RegExp(`\\.${originalExt}$`),
                `.${newExt}`
              );
            } else {
              filename = file.name;
            }
          } else {
            // Create a new filename
            const timestamp = new Date().getTime();
            filename = `optimized_${timestamp}.${format}`;
          }

          const optimizedFile = new File([blob], filename, {
            type: mimeType,
            lastModified: new Date().getTime(),
          });

          resolve(optimizedFile);
        },
        mimeType,
        quality
      );
    };

    img.onerror = () => {
      reject(new Error("Failed to load image for optimization"));
    };

    // Load the image from the file
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Batch optimize multiple image files
 * @param {Array<File>} files - Array of image files to optimize
 * @param {Object} options - Optimization options (see optimizeImage)
 * @returns {Promise<Array<File>>} - Promise resolving to array of optimized files
 */
export const batchOptimizeImages = async (files, options = {}) => {
  const optimizationPromises = files.map((file) =>
    optimizeImage(file, options)
  );
  return Promise.all(optimizationPromises);
};

/**
 * Get file size in a human-readable format
 * @param {number} bytes - Size in bytes
 * @param {number} decimals - Number of decimal places
 * @returns {string} - Formatted size string (e.g., "1.5 MB")
 */
export const formatFileSize = (bytes, decimals = 1) => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${
    sizes[i]
  }`;
};

/**
 * Calculate the compression ratio between original and optimized files
 * @param {File} originalFile - The original file
 * @param {File} optimizedFile - The optimized file
 * @returns {number} - Compression ratio as a percentage (e.g., 40 means 40% savings)
 */
export const calculateCompressionRatio = (originalFile, optimizedFile) => {
  const originalSize = originalFile.size;
  const optimizedSize = optimizedFile.size;
  const savings = originalSize - optimizedSize;

  return Math.round((savings / originalSize) * 100);
};
