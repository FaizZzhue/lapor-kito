"use client";

import React, { useEffect, useRef } from "react";
import L from "leaflet";
import { MapPin, Navigation, Crosshair, AlertCircle, Info } from "lucide-react";

interface InteractiveMapPickerProps {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  isManualPin: boolean;
  onLocationSelect: (lat: number, lng: number) => void;
  onResetToGps?: () => void;
  gpsCoords?: { lat: number; lng: number; accuracy: number | null } | null;
}

// Default center: Pusat Kota Palembang (Bundaran Air Mancur / Masjid Agung)
const PALEMBANG_DEFAULT_LAT = -2.989679;
const PALEMBANG_DEFAULT_LNG = 104.759885;

export function InteractiveMapPicker({
  latitude,
  longitude,
  accuracy,
  isManualPin,
  onLocationSelect,
  onResetToGps,
  gpsCoords,
}: InteractiveMapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const onLocationSelectRef = useRef(onLocationSelect);

  useEffect(() => {
    onLocationSelectRef.current = onLocationSelect;
  }, [onLocationSelect]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const initialLat = latitude ?? PALEMBANG_DEFAULT_LAT;
    const initialLng = longitude ?? PALEMBANG_DEFAULT_LNG;
    const initialZoom = latitude && longitude ? 16 : 13;

    // Create Map Instance
    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: initialZoom,
      zoomControl: false, // will add customized position
    });

    // Add Zoom Control to bottom-right
    L.control.zoom({ position: "bottomright" }).addTo(map);

    // Add OpenStreetMap Tile Layer with mandatory attribution
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Create Custom SVG DivIcon (reliable, crisp, and no asset file dependency)
    const pinIcon = L.divIcon({
      className: "laporkito-map-pin",
      html: `
        <div style="position:relative;width:34px;height:42px;display:flex;flex-direction:column;align-items:center;cursor:grab;">
          <div style="background-color:#0033a7;color:white;width:32px;height:32px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 3px 10px rgba(0,0,0,0.35);border:2.5px solid #ffffff;">
            <div style="transform:rotate(45deg);display:flex;align-items:center;justify-content:center;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
          </div>
          <div style="width:6px;height:6px;background-color:#0033a7;border-radius:50%;margin-top:-2px;opacity:0.8;"></div>
        </div>
      `,
      iconSize: [34, 42],
      iconAnchor: [17, 42],
      popupAnchor: [0, -42],
    });

    // Create Initial Draggable Marker if coordinates available
    if (latitude !== null && longitude !== null) {
      const marker = L.marker([latitude, longitude], {
        icon: pinIcon,
        draggable: true,
      }).addTo(map);

      marker.on("dragend", (e) => {
        const markerPos = e.target.getLatLng();
        const lat = Number(markerPos.lat.toFixed(6));
        const lng = Number(markerPos.lng.toFixed(6));
        onLocationSelectRef.current(lat, lng);
      });

      markerRef.current = marker;

      // Draw accuracy circle if from GPS and accuracy is defined
      if (accuracy && !isManualPin) {
        const circle = L.circle([latitude, longitude], {
          radius: accuracy,
          color: "#0033a7",
          weight: 1.5,
          fillColor: "#2563eb",
          fillOpacity: 0.12,
        }).addTo(map);
        circleRef.current = circle;
      }
    }

    // Map Click Listener: allow user to click anywhere to move/drop pin
    map.on("click", (e) => {
      const lat = Number(e.latlng.lat.toFixed(6));
      const lng = Number(e.latlng.lng.toFixed(6));
      onLocationSelectRef.current(lat, lng);
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
      circleRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Synchronize Marker & Accuracy Circle when Coordinates Change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (latitude === null || longitude === null) {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      if (circleRef.current) {
        circleRef.current.remove();
        circleRef.current = null;
      }
      return;
    }

    const pinIcon = L.divIcon({
      className: "laporkito-map-pin",
      html: `
        <div style="position:relative;width:34px;height:42px;display:flex;flex-direction:column;align-items:center;cursor:grab;">
          <div style="background-color:#0033a7;color:white;width:32px;height:32px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 3px 10px rgba(0,0,0,0.35);border:2.5px solid #ffffff;">
            <div style="transform:rotate(45deg);display:flex;align-items:center;justify-content:center;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
          </div>
          <div style="width:6px;height:6px;background-color:#0033a7;border-radius:50%;margin-top:-2px;opacity:0.8;"></div>
        </div>
      `,
      iconSize: [34, 42],
      iconAnchor: [17, 42],
      popupAnchor: [0, -42],
    });

    if (markerRef.current) {
      markerRef.current.setLatLng([latitude, longitude]);
    } else {
      const marker = L.marker([latitude, longitude], {
        icon: pinIcon,
        draggable: true,
      }).addTo(map);

      marker.on("dragend", (e) => {
        const markerPos = e.target.getLatLng();
        const lat = Number(markerPos.lat.toFixed(6));
        const lng = Number(markerPos.lng.toFixed(6));
        onLocationSelectRef.current(lat, lng);
      });

      markerRef.current = marker;
    }

    // Update or remove accuracy circle
    if (circleRef.current) {
      circleRef.current.remove();
      circleRef.current = null;
    }

    if (accuracy && !isManualPin) {
      const circle = L.circle([latitude, longitude], {
        radius: accuracy,
        color: "#0033a7",
        weight: 1.5,
        fillColor: "#2563eb",
        fillOpacity: 0.12,
      }).addTo(map);
      circleRef.current = circle;
    }

    // Pan map to new coordinate smoothly if not already centered
    const currentCenter = map.getCenter();
    if (
      Math.abs(currentCenter.lat - latitude) > 0.0001 ||
      Math.abs(currentCenter.lng - longitude) > 0.0001
    ) {
      map.panTo([latitude, longitude], { animate: true });
    }
  }, [latitude, longitude, accuracy, isManualPin]);

  const handleCenterOnMarker = () => {
    if (mapInstanceRef.current && latitude !== null && longitude !== null) {
      mapInstanceRef.current.setView([latitude, longitude], 17, { animate: true });
    }
  };

  const handleCenterOnPalembang = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([PALEMBANG_DEFAULT_LAT, PALEMBANG_DEFAULT_LNG], 13, {
        animate: true,
      });
    }
  };

  return (
    <div className="space-y-2">
      {/* Map Interactive Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
          <MapPin className="h-4 w-4 text-blue-700 shrink-0" />
          <span>Peta Penentuan Titik Lokasi:</span>
          {isManualPin ? (
            <span className="font-mono text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold border border-blue-200">
              Titik Dipilih Manual pada Peta
            </span>
          ) : (
            latitude !== null && (
              <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold border border-slate-200">
                Titik dari Geolocation
              </span>
            )
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {latitude !== null && (
            <button
              type="button"
              onClick={handleCenterOnMarker}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-[11px] font-mono font-semibold transition-colors cursor-pointer shadow-2xs"
              title="Arahkan peta ke posisi pin saat ini"
            >
              <Crosshair className="h-3 w-3 text-blue-700" />
              <span>Pusatkan Pin</span>
            </button>
          )}

          {isManualPin && gpsCoords?.lat && onResetToGps && (
            <button
              type="button"
              onClick={onResetToGps}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-800 hover:bg-blue-100 text-[11px] font-mono font-semibold transition-colors cursor-pointer shadow-2xs"
              title="Kembalikan titik ke koordinat GPS perangkat"
            >
              <Navigation className="h-3 w-3" />
              <span>Gunakan GPS Awal</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCenterOnPalembang}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-[11px] font-mono transition-colors cursor-pointer shadow-2xs"
            title="Tampilkan peta seluruh Kota Palembang"
          >
            <span>Pusat Kota</span>
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative rounded-xl overflow-hidden border border-slate-300 shadow-2xs bg-slate-100">
        <div
          ref={mapContainerRef}
          className="h-[270px] sm:h-[320px] w-full z-10"
          style={{ minHeight: "270px" }}
        />

        {/* Floating Instruction Banner on top of Map */}
        <div className="absolute top-2 left-2 right-2 sm:right-auto z-20 pointer-events-none">
          <div className="bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-slate-200/90 shadow-xs text-[11px] text-slate-700 flex items-center gap-1.5 max-w-sm pointer-events-auto">
            <Info className="h-3.5 w-3.5 text-blue-700 shrink-0" />
            <span className="leading-snug">
              <strong>Klik peta</strong> atau <strong>geser pin biru</strong> untuk menempatkan titik presisi jika lokasi otomatis melenceng.
            </span>
          </div>
        </div>

        {/* Visual Notice for Accuracy Radius if visible */}
        {accuracy && !isManualPin && accuracy > 100 && (
          <div className="absolute bottom-2 left-2 z-20 pointer-events-none">
            <div className="bg-amber-50/95 backdrop-blur-xs px-2.5 py-1 rounded-md border border-amber-300 shadow-xs text-[10px] text-amber-900 flex items-center gap-1 font-mono font-semibold pointer-events-auto">
              <AlertCircle className="h-3 w-3 text-amber-700 shrink-0" />
              <span>Lingkaran biru = Area toleransi ketidakpastian (±{accuracy}m)</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
