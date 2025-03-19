import React, { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../modules/leaflet-control-coordinates.js";
import "./CustomsMap.css"; // We can reuse the existing CSS
import mapData from "../data/maps.json";

// Helper functions for map positioning and coordinate transformation
function getCRS(mapConfig) {
  let scaleX = 1;
  let scaleY = 1;
  let marginX = 0;
  let marginY = 0;

  if (mapConfig && mapConfig.transform) {
    scaleX = mapConfig.transform[0];
    scaleY = mapConfig.transform[2] * -1; // Invert Y scale for proper orientation
    marginX = mapConfig.transform[1];
    marginY = mapConfig.transform[3];
  }

  return L.extend({}, L.CRS.Simple, {
    transformation: new L.Transformation(scaleX, marginX, scaleY, marginY),
    projection: L.extend({}, L.Projection.LonLat, {
      project: (latLng) => {
        return L.Projection.LonLat.project(
          applyRotation(latLng, mapConfig.coordinateRotation)
        );
      },
      unproject: (point) => {
        return applyRotation(
          L.Projection.LonLat.unproject(point),
          mapConfig.coordinateRotation * -1
        );
      },
    }),
  });
}

function applyRotation(latLng, rotation) {
  if (!latLng.lng && !latLng.lat) {
    return L.latLng(0, 0);
  }
  if (!rotation) {
    return latLng;
  }

  const angleInRadians = (rotation * Math.PI) / 180;
  const cosAngle = Math.cos(angleInRadians);
  const sinAngle = Math.sin(angleInRadians);

  const { lng: x, lat: y } = latLng;
  const rotatedX = x * cosAngle - y * sinAngle;
  const rotatedY = x * sinAngle + y * cosAngle;
  return L.latLng(rotatedY, rotatedX);
}

function getBounds(bounds) {
  if (!bounds) {
    return undefined;
  }
  return L.latLngBounds(
    [bounds[0][1], bounds[0][0]],
    [bounds[1][1], bounds[1][0]]
  );
}

const TarkovMap = () => {
  const { mapName } = useParams();
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);

  useEffect(() => {
    // Handle window resize to maintain full map size
    const handleResize = () => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (mapRef.current) {
      // Clean up previous map instance if exists
      mapRef.current.remove();
      mapRef.current = null;
    }

    // Find the appropriate map data from maps.json
    const mapEntry = mapData.find((entry) => entry.normalizedName === mapName);

    // Find the interactive map configuration
    const mapConfig = mapEntry?.maps.find(
      (map) => map.projection === "interactive"
    );

    // Default to customs if map not found
    const interactiveMapConfig =
      mapConfig ||
      mapData
        .find((entry) => entry.normalizedName === "customs")
        .maps.find((map) => map.projection === "interactive");

    // Calculate center from bounds if not explicitly provided
    const center = interactiveMapConfig.bounds
      ? [
          (interactiveMapConfig.bounds[0][0] +
            interactiveMapConfig.bounds[1][0]) /
            2,
          (interactiveMapConfig.bounds[0][1] +
            interactiveMapConfig.bounds[1][1]) /
            2,
        ]
      : [0, 0];

    // Initialize map with custom CRS
    const map = L.map("tarkov-map", {
      crs: getCRS(interactiveMapConfig),
      center: center,
      zoom: interactiveMapConfig.minZoom + 1,
      minZoom: interactiveMapConfig.minZoom,
      maxZoom: interactiveMapConfig.maxZoom,
      zoomControl: true,
      attributionControl: false,
      scrollWheelZoom: true,
    });

    mapRef.current = map;

    // Calculate bounds
    const bounds = getBounds(interactiveMapConfig.bounds);

    // Base layer options
    const baseLayerOptions = {
      maxZoom: interactiveMapConfig.maxZoom,
      bounds: bounds,
      interactive: true,
    };

    // Add the base map layer (ground level)
    try {
      L.imageOverlay(
        interactiveMapConfig.svgPath,
        bounds,
        baseLayerOptions
      ).addTo(map);
    } catch (error) {
      console.log("Failed to load SVG, falling back to image", error);
      // Fallback to jpg image
      L.imageOverlay(
        `${process.env.PUBLIC_URL}/maps/${mapName}-2d.jpg`,
        bounds,
        baseLayerOptions
      ).addTo(map);
    }

    // Add coordinates control
    L.control
      .coordinates({
        position: "bottomright",
        decimals: 2,
        labelTemplateLat: "z: {y}",
        labelTemplateLng: "x: {x}",
        enableUserInput: false,
        wrapCoordinate: false,
        customLabelFcn: (latLng, opts) => {
          return `x: ${latLng.lng.toFixed(
            opts.decimals
          )} z: ${latLng.lat.toFixed(opts.decimals)}`;
        },
      })
      .addTo(map);

    // Set initial view to fit bounds
    map.fitBounds(bounds);

    // Make sure the map is properly sized
    setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    }, 100);

    // Cleanup on unmount or map change
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [mapName]); // Re-run when mapName changes

  // Get map display name from mapData
  const mapEntry = mapData.find((entry) => entry.normalizedName === mapName);

  // Default to "Unknown Map" if not found
  let displayName = "Unknown Map";

  // Check if mapEntry exists and get display name
  if (mapEntry) {
    const interactiveMapConfig = mapEntry.maps.find(
      (map) => map.projection === "interactive"
    );

    if (interactiveMapConfig) {
      // If there's a displayName property in the map data, use it
      if (interactiveMapConfig.displayName) {
        displayName = interactiveMapConfig.displayName;
      } else if (interactiveMapConfig.key) {
        // Otherwise convert map key to title case (e.g. "streets-of-tarkov" -> "Streets Of Tarkov")
        displayName = interactiveMapConfig.key
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
      }
    }
  }

  return (
    <div className="customs-map-container" ref={mapContainerRef}>
      <div className="map-title">{displayName}</div>
      <div id="tarkov-map" className="map-container"></div>
    </div>
  );
};

export default TarkovMap;
