import { useState, useCallback } from "react";
import {
  mapPixelsToTarkovCoords,
  tarkovCoordsToMapPixels,
} from "../utils/coordinateUtils";

/**
 * Custom hook for map interactions
 * @param {Object} mapConfig - Map configuration object
 * @returns {Object} - Map state and functions
 */
const useMap = (mapConfig) => {
  const [state, setState] = useState({
    isMapReady: false,
    isLoading: true,
    zoom: 1,
    center: { x: 0, y: 0 },
    markers: [],
    hoveredCoords: null,
    selectedCoords: null,
  });

  /**
   * Handle map click event
   * @param {Object} event - The click event object
   * @param {Object} mapElement - Reference to the map element
   * @param {Function} onClick - Callback function when a click is made
   */
  const handleMapClick = useCallback(
    (event, mapElement, onClick) => {
      if (!mapConfig || !mapElement) return;

      // Get click coordinates relative to the map
      const rect = mapElement.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      // Convert to map coordinates (accounting for zoom and centering)
      const pixelCoords = {
        x: (x - mapElement.offsetWidth / 2) / state.zoom + state.center.x,
        y: (y - mapElement.offsetHeight / 2) / state.zoom + state.center.y,
      };

      // Convert to Tarkov world coordinates
      const tarkovCoords = mapPixelsToTarkovCoords(pixelCoords, mapConfig);

      // Set selected coordinates
      setState((prev) => ({
        ...prev,
        selectedCoords: tarkovCoords,
      }));

      // Call callback function if provided
      if (onClick) {
        onClick(tarkovCoords);
      }
    },
    [mapConfig, state.zoom, state.center]
  );

  /**
   * Handle map hover event to show coordinates
   * @param {Object} event - The mousemove event object
   * @param {Object} mapElement - Reference to the map element
   */
  const handleMapHover = useCallback(
    (event, mapElement) => {
      if (!mapConfig || !mapElement) return;

      // Get mouse coordinates relative to the map
      const rect = mapElement.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      // Convert to map coordinates (accounting for zoom and centering)
      const pixelCoords = {
        x: (x - mapElement.offsetWidth / 2) / state.zoom + state.center.x,
        y: (y - mapElement.offsetHeight / 2) / state.zoom + state.center.y,
      };

      // Convert to Tarkov world coordinates
      const tarkovCoords = mapPixelsToTarkovCoords(pixelCoords, mapConfig);

      // Set hovered coordinates
      setState((prev) => ({
        ...prev,
        hoveredCoords: tarkovCoords,
      }));
    },
    [mapConfig, state.zoom, state.center]
  );

  /**
   * Add a marker to the map
   * @param {Object} coords - Coordinates for the marker
   * @param {Object} options - Options for the marker
   */
  const addMarker = useCallback((coords, options = {}) => {
    const { type = "guess", color = "#FF5733", label } = options;

    const marker = {
      id: Date.now().toString(),
      coords,
      type,
      color,
      label,
    };

    setState((prev) => ({
      ...prev,
      markers: [...prev.markers, marker],
    }));

    return marker.id;
  }, []);

  /**
   * Remove a marker from the map
   * @param {string} markerId - ID of the marker to remove
   */
  const removeMarker = useCallback((markerId) => {
    setState((prev) => ({
      ...prev,
      markers: prev.markers.filter((marker) => marker.id !== markerId),
    }));
  }, []);

  /**
   * Clear all markers from the map
   */
  const clearMarkers = useCallback(() => {
    setState((prev) => ({
      ...prev,
      markers: [],
    }));
  }, []);

  /**
   * Set the zoom level of the map
   * @param {number} zoom - Zoom level
   */
  const setZoom = useCallback((zoom) => {
    setState((prev) => ({
      ...prev,
      zoom,
    }));
  }, []);

  /**
   * Set the center of the map
   * @param {Object} center - Center coordinates
   */
  const setCenter = useCallback((center) => {
    setState((prev) => ({
      ...prev,
      center,
    }));
  }, []);

  /**
   * Convert Tarkov coordinates to map pixel coordinates
   * @param {Object} coords - Tarkov coordinates
   * @returns {Object} - Map pixel coordinates
   */
  const worldToPixels = useCallback(
    (coords) => {
      if (!mapConfig) return { x: 0, y: 0 };
      return tarkovCoordsToMapPixels(coords, mapConfig);
    },
    [mapConfig]
  );

  /**
   * Convert map pixel coordinates to Tarkov coordinates
   * @param {Object} pixels - Map pixel coordinates
   * @returns {Object} - Tarkov coordinates
   */
  const pixelsToWorld = useCallback(
    (pixels) => {
      if (!mapConfig) return { x: 0, z: 0 };
      return mapPixelsToTarkovCoords(pixels, mapConfig);
    },
    [mapConfig]
  );

  /**
   * Set map ready state
   * @param {boolean} ready - Whether the map is ready
   */
  const setMapReady = useCallback((ready) => {
    setState((prev) => ({
      ...prev,
      isMapReady: ready,
      isLoading: !ready,
    }));
  }, []);

  return {
    ...state,
    handleMapClick,
    handleMapHover,
    addMarker,
    removeMarker,
    clearMarkers,
    setZoom,
    setCenter,
    worldToPixels,
    pixelsToWorld,
    setMapReady,
  };
};

export default useMap;
