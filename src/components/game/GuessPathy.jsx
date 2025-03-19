import { useEffect, useRef } from "react";
import L from "leaflet";

export const GuessPathy = ({ guessPosition, actualPosition, map }) => {
  const pathRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    // Safety checks with detailed validation
    if (!map) {
      console.warn("GuessPathy: Map is not available");
      return;
    }

    if (!guessPosition || !actualPosition) {
      console.warn("GuessPathy: Missing position data", {
        guessPosition,
        actualPosition,
      });
      return;
    }

    // Additional Leaflet-specific map readiness checks
    try {
      if (!map._container || !map._loaded) {
        console.warn("GuessPathy: Map container not fully loaded");
        return;
      }
    } catch (err) {
      console.warn("GuessPathy: Map container not fully loaded");
      return;
    }

    // Validate coordinates are numbers
    if (
      typeof guessPosition.z !== "number" ||
      typeof guessPosition.x !== "number" ||
      typeof actualPosition.z !== "number" ||
      typeof actualPosition.x !== "number"
    ) {
      console.warn("GuessPathy: Invalid coordinate types", {
        guessPosition,
        actualPosition,
      });
      return;
    }

    // Clean up existing resources first
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (pathRef.current) {
      try {
        pathRef.current.remove();
      } catch (err) {
        console.warn("GuessPathy: Error removing previous path:", err);
      }
      pathRef.current = null;
    }

    // Use a short delay to ensure map is fully ready
    timeoutRef.current = setTimeout(() => {
      try {
        // Verify map is still valid after timeout
        if (!map || !map._loaded) {
          console.warn("GuessPathy: Map no longer valid after delay");
          return;
        }

        console.log(
          "Creating path between:",
          guessPosition,
          "and",
          actualPosition
        );

        // Create lat/lng points with bounds checking
        const guessLatLng = L.latLng(
          Math.max(-90, Math.min(90, guessPosition.z)),
          Math.max(-180, Math.min(180, guessPosition.x))
        );

        const actualLatLng = L.latLng(
          Math.max(-90, Math.min(90, actualPosition.z)),
          Math.max(-180, Math.min(180, actualPosition.x))
        );

        // Styling for the line
        const pathOptions = {
          color: "#5d4b36", // Brown color
          weight: 3, // Line thickness
          opacity: 0.7, // Opacity
          dashArray: "5, 10", // Dashed line pattern
          zIndexOffset: 500, // Make sure it's below markers
        };

        // Create the polyline
        const path = L.polyline([guessLatLng, actualLatLng], pathOptions);

        // Add the path to the map
        path.addTo(map);
        pathRef.current = path;
      } catch (err) {
        console.error("GuessPathy: Error creating path:", err);
      }
    }, 400); // Longer delay to ensure markers are already placed

    return () => {
      // Cleanup function
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      if (pathRef.current) {
        try {
          pathRef.current.remove();
        } catch (err) {
          console.warn("GuessPathy: Error in cleanup:", err);
        }
        pathRef.current = null;
      }
    };
  }, [map, guessPosition, actualPosition]);

  return null; // No DOM rendering needed
};
