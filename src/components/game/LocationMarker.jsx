import { useEffect, useRef, memo } from "react";
import L from "leaflet";
import "./Markers.css";
import markerIcon from "../../assets/marker-icon.png";
import markerShadow from "../../assets/marker-shadow.png";

// Pre-create the icon to avoid creating it on every render
const actualIcon = new L.Icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: "actual-marker-icon",
});

export const LocationMarker = memo(
  ({ map, position, gameOver, distance, blueIcon }) => {
    const markerRef = useRef(null);

    useEffect(() => {
      // Quick exit for missing props
      if (!map || !position || !gameOver) return;

      // Clean up any existing marker first
      if (markerRef.current) {
        try {
          markerRef.current.remove();
        } catch (err) {}
        markerRef.current = null;
      }

      // Use the pre-created icon or the custom one provided
      const icon = blueIcon || actualIcon;

      try {
        // Create and add marker directly - skip unnecessary validation
        const marker = L.marker([position.z, position.x], {
          icon: icon,
          zIndexOffset: 900,
        }).addTo(map);

        // Store reference for cleanup
        markerRef.current = marker;
      } catch (err) {
        console.error("Error creating location marker:", err);
      }

      return () => {
        if (markerRef.current) {
          try {
            markerRef.current.remove();
          } catch (err) {}
          markerRef.current = null;
        }
      };
    }, [map, position, gameOver, distance, blueIcon]);

    return null;
  }
);
