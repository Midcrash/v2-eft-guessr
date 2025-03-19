import React, {
  useEffect,
  useRef,
  forwardRef,
  useState,
  useImperativeHandle,
  useCallback,
} from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import mapData from "../../data/maps.json";
import "./TarkovMap.css";
import markerIcon from "../../assets/marker-icon.png";
import markerShadow from "../../assets/marker-shadow.png";

// Fix Leaflet's default icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Preload marker images to ensure they're cached
const preloadMarkerImages = () => {
  try {
    const img1 = new Image();
    img1.src = markerIcon;
    const img2 = new Image();
    img2.src = markerShadow;
  } catch (e) {
    console.warn("Failed to preload marker images:", e);
  }
};
preloadMarkerImages();

// Create custom icons for guess and actual location
const createCustomIcons = () => {
  // Red icon for user's guess
  const redIcon = new L.Icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
    className: "guess-marker-icon", // We'll style this with CSS
  });

  // Blue icon for actual location
  const blueIcon = new L.Icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
    className: "actual-marker-icon", // We'll style this with CSS
  });

  return { redIcon, blueIcon };
};

// Create the icons only once
const defaultIcons = createCustomIcons();

// Helper functions for map positioning and coordinate transformation
const getCRS = (mapConfig) => {
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
};

const applyRotation = (latLng, rotation) => {
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
};

const getBounds = (bounds) => {
  if (!bounds) {
    return undefined;
  }
  return L.latLngBounds(
    [bounds[0][1], bounds[0][0]],
    [bounds[1][1], bounds[1][0]]
  );
};

const TarkovMap = forwardRef(
  (
    {
      mapName = "customs",
      children,
      onClick,
      showCoordinates = false,
      height = "100vh",
    },
    ref
  ) => {
    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const [mapReady, setMapReady] = useState(false);
    const mapConfig = useRef(null);
    const mapInitializedRef = useRef(false);
    const lastMapName = useRef(mapName);
    const initializationTimestampRef = useRef(null);
    const iconsRef = useRef({});

    // Store onClick in a ref to avoid dependency changes triggering reinit
    const onClickRef = useRef(onClick);

    // Update the onClick ref when it changes
    useEffect(() => {
      onClickRef.current = onClick;
    }, [onClick]);

    // Get the map configuration data
    const getMapConfig = useCallback(() => {
      const mapEntry = mapData.find(
        (entry) => entry.normalizedName === mapName
      );
      const config =
        mapEntry?.maps.find((map) => map.projection === "interactive") ||
        mapData
          .find((entry) => entry.normalizedName === "customs")
          .maps.find((map) => map.projection === "interactive");

      return config;
    }, [mapName]);

    // Calculate center and bounds from map config
    const getMapSettings = useCallback((config) => {
      const bounds = getBounds(config.bounds);
      const center = config.bounds
        ? [
            (config.bounds[0][0] + config.bounds[1][0]) / 2,
            (config.bounds[0][1] + config.bounds[1][1]) / 2,
          ]
        : [0, 0];

      return { bounds, center };
    }, []);

    // Initialize map safely
    const initializeMap = useCallback(() => {
      // Prevent multiple initializations
      if (mapInitializedRef.current) {
        console.log("Map already initialized - skipping initialization");
        return true;
      }

      if (!mapContainerRef.current) {
        console.warn("Map container not ready - cannot initialize map");
        return false;
      }

      if (mapInstanceRef.current) {
        console.log("Map instance already exists - initialization not needed");
        return true;
      }

      try {
        console.log("Initializing map for the first time...");

        // Get map configuration
        const config = getMapConfig();
        mapConfig.current = config;
        const { bounds, center } = getMapSettings(config);

        // Create map instance
        const map = L.map(mapContainerRef.current, {
          crs: getCRS(config),
          center: center,
          zoom: config.minZoom + 1,
          minZoom: config.minZoom,
          maxZoom: config.maxZoom,
          zoomControl: true,
          attributionControl: false,
          scrollWheelZoom: true,
          fadeAnimation: false, // Disable animations to reduce errors
          zoomAnimation: false, // Disable animations to reduce errors
        });

        // Store map reference
        mapInstanceRef.current = map;

        // Add base layer
        try {
          L.imageOverlay(config.svgPath, bounds, {
            maxZoom: config.maxZoom,
            bounds: bounds,
            interactive: true,
          }).addTo(map);
          console.log("SVG map layer added successfully");
        } catch (error) {
          console.warn("Failed to load SVG, using fallback image:", error);
          L.imageOverlay(`/maps/${mapName}-2d.jpg`, bounds, {
            maxZoom: config.maxZoom,
            bounds: bounds,
            interactive: true,
          }).addTo(map);
          console.log("Fallback image layer added successfully");
        }

        // Add click handler - use onClickRef.current instead of onClick
        if (onClickRef.current) {
          map.on("click", (e) => {
            // Don't create markers here anymore, just call the onClick handler
            if (onClickRef.current) {
              console.log("Map click detected at leaflet coords:", e.latlng);
              onClickRef.current({ x: e.latlng.lng, y: 0, z: e.latlng.lat });
            }
          });
          console.log("Map click handler registered");
        } else {
          console.log("No click handler provided - map clicks will be ignored");
        }

        // Set initial view
        map.fitBounds(bounds);
        console.log("Initial map view set to bounds");

        // Initialize marker system immediately to avoid first render delay
        const initMarkerSystem = () => {
          try {
            console.log(
              "Pre-initializing marker system for better performance"
            );
            // Create a temporary offscreen marker
            const tempMarker = L.marker([-9999, -9999], {
              icon: defaultIcons.redIcon,
              opacity: 0,
            }).addTo(map);

            // Remove after a brief moment
            setTimeout(() => {
              try {
                tempMarker.remove();
                console.log("Temporary marker removed");
              } catch (e) {
                console.warn("Failed to remove temporary marker:", e);
              }
            }, 100);
          } catch (e) {
            console.warn("Failed to initialize marker system:", e);
          }
        };
        initMarkerSystem();

        // Mark map as ready
        map.on("load", () => {
          console.log("Map load event triggered");
          setMapReady(true);
          mapInitializedRef.current = true;
        });

        // Fallback in case the load event doesn't fire
        setTimeout(() => {
          if (!mapInitializedRef.current) {
            console.log("Map ready fallback timeout triggered");
            setMapReady(true);
            mapInitializedRef.current = true;
          }
        }, 1000);

        console.log("Map initialization completed successfully");
        return true;
      } catch (err) {
        console.error("Error initializing map:", err);
        return false;
      }
    }, [mapName, getMapConfig, getMapSettings]); // Remove onClick dependency

    // Expose map methods to parent
    useImperativeHandle(
      ref,
      () => {
        return {
          isReady: () => !!mapInstanceRef.current && mapReady,
          fitBounds: (bounds, options = {}) => {
            try {
              if (mapInstanceRef.current && mapReady) {
                mapInstanceRef.current.fitBounds(bounds, {
                  padding: [50, 50],
                  ...options,
                });
              }
            } catch (err) {
              console.error("Error fitting bounds:", err);
            }
          },
          // Pass through other map methods
          invalidateSize: () => {
            if (mapInstanceRef.current) {
              mapInstanceRef.current.invalidateSize();
            }
          },
          getCenter: () => {
            return mapInstanceRef.current
              ? mapInstanceRef.current.getCenter()
              : null;
          },
          // Add direct access to the map instance - with safety check to prevent reinitializing
          getMap: () => {
            if (!mapInstanceRef.current && !mapInitializedRef.current) {
              console.warn("getMap called but map not initialized yet");
            }
            return mapInstanceRef.current;
          },
          // Export the icons for child components
          icons: defaultIcons,
        };
      },
      [mapReady]
    );

    // Initialize the map - only when necessary
    useEffect(() => {
      console.log("Map initialization effect running. Current state:", {
        hasMapInstance: !!mapInstanceRef.current,
        lastMapName: lastMapName.current,
        currentMapName: mapName,
        isInitialized: mapInitializedRef.current,
      });

      // If a reload flag was externally set, return immediately and don't reinitialize
      // CRITICAL: Skip initialization if we already have a map instance AND the map name hasn't changed
      if (mapInstanceRef.current && lastMapName.current === mapName) {
        console.log(
          "Map already initialized with correct mapName - skipping initialization"
        );
        return;
      }

      // Track when the map was last initialized for debugging
      const initTime = new Date().toISOString();
      console.log(
        `Map initialization triggered for map: ${mapName} at ${initTime}`
      );

      // Update reference value
      lastMapName.current = mapName;

      // Clean up existing map if mapName changes
      if (mapInstanceRef.current) {
        try {
          console.log("Cleaning up previous map instance");
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
          setMapReady(false);
          mapInitializedRef.current = false;
        } catch (err) {
          console.warn("Error cleaning up map:", err);
        }
      }

      // Give the DOM a moment to stabilize
      console.log("Scheduling map initialization with delay");
      const timer = setTimeout(() => {
        const initialized = initializeMap();
        console.log(
          `Map initialization ${
            initialized ? "succeeded" : "failed"
          } for ${mapName}`
        );
      }, 100);

      // This cleanup function will be called when either:
      // 1. The component unmounts
      // 2. The mapName changes (causing the effect to run again)
      return () => {
        console.log(`Cleanup for map initialization effect from ${initTime}`);
        clearTimeout(timer);

        // ONLY clean up on component unmount (not on mapName change, as that is handled above)
        // We can detect unmount vs. dependency change by checking if this cleanup is being
        // called as part of a re-render with the same mapName
        const isUnmounting = true; // Assume unmounting by default

        if (isUnmounting && mapInstanceRef.current) {
          try {
            console.log(
              "Cleanup: Map component unmounting, removing map instance"
            );
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
            setMapReady(false);
            mapInitializedRef.current = false;
          } catch (err) {
            console.warn("Error cleaning up map on unmount:", err);
          }
        }
      };
    }, [mapName, initializeMap]); // Keep only mapName as dependency

    // Ensure map size is correct after render
    useEffect(() => {
      if (!mapInstanceRef.current) return;

      const resizeTimer = setTimeout(() => {
        try {
          mapInstanceRef.current.invalidateSize();
        } catch (err) {
          console.warn("Error invalidating map size:", err);
        }
      }, 200);

      return () => clearTimeout(resizeTimer);
    }, [mapReady, children]);

    // Render children only when map is ready
    const renderChildren = () => {
      if (!mapInstanceRef.current || !mapReady || !children) return null;

      return React.Children.map(children, (child) => {
        if (!child) return null;

        return React.cloneElement(child, {
          map: mapInstanceRef.current,
          blueIcon: defaultIcons.blueIcon,
          redIcon: defaultIcons.redIcon,
        });
      });
    };

    return (
      <div className="tarkov-map-container">
        <style>
          {`
            /* Styling for markers */
            .guess-marker-icon {
              filter: hue-rotate(140deg) saturate(2) brightness(0.8);
            }
            .actual-marker-icon {
              /* Blue is the default color for Leaflet markers */
            }
          `}
        </style>
        <div
          ref={mapContainerRef}
          className="tarkov-map"
          style={{ height }}
        ></div>
        {renderChildren()}
      </div>
    );
  }
);

TarkovMap.displayName = "TarkovMap";

export default TarkovMap;
