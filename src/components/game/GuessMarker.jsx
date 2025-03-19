import { useEffect, useRef, memo } from "react";
import L from "leaflet";
import "./Markers.css";
import markerIcon from "../../assets/marker-icon.png";
import markerShadow from "../../assets/marker-shadow.png";

// Pre-create the icon to avoid creating it on every render
const guessIcon = new L.Icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: "guess-marker-icon",
});

export const GuessMarker = memo(({ map, position, redIcon }) => {
  const markerRef = useRef(null);

  useEffect(() => {
    // Quick exit for missing props
    if (!map || !position) return;

    // Clean up any existing marker first
    if (markerRef.current) {
      try {
        markerRef.current.remove();
      } catch (err) {}
      markerRef.current = null;
    }

    // Use the pre-created icon or the custom one provided
    const icon = redIcon || guessIcon;

    try {
      // Create and add marker directly - skip unnecessary validation
      const marker = L.marker([position.z, position.x], {
        icon: icon,
        zIndexOffset: 1000,
      }).addTo(map);

      // Store reference for cleanup
      markerRef.current = marker;
    } catch (err) {
      console.error("Error creating guess marker:", err);
    }

    return () => {
      if (markerRef.current) {
        try {
          markerRef.current.remove();
        } catch (err) {}
        markerRef.current = null;
      }
    };
  }, [map, position, redIcon]);

  return null;
});
