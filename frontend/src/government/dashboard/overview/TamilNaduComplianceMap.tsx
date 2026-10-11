import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import type * as LeafletType from "leaflet";
import {
  MapPin,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Search,
  ExternalLink,
  Droplets,
  Gauge,
  X,
  Loader2
} from "lucide-react";

export interface IndustryMapItem {
  id?: string;
  user_id?: string;
  industry_name?: string;
  name?: string;
  district?: string;
  compliance_status?: 'Safe' | 'Warning' | 'Critical' | string;
  current_cto_consumption?: number;
  daily_cto_limit?: number;
  current_reuse_percentage?: number;
  daily_reuse_target?: number;
  last_warning_date?: string;
  warning_count?: number;
  [key: string]: any;
}

// Accurate GPS Coordinates for all 38 districts of Tamil Nadu
export const TN_DISTRICT_COORDS: Record<string, [number, number]> = {
  'Ariyalur': [11.1401, 79.0786],
  'Chengalpattu': [12.6825, 79.9836],
  'Chennai': [13.0827, 80.2707],
  'Coimbatore': [11.0168, 76.9558],
  'Cuddalore': [11.7480, 79.7714],
  'Dharmapuri': [12.1211, 78.1582],
  'Dindigul': [10.3673, 77.9803],
  'Erode': [11.3410, 77.7172],
  'Kallakurichi': [11.7384, 78.9639],
  'Kanchipuram': [12.8342, 79.7036],
  'Kanyakumari': [8.1880, 77.4119],
  'Karur': [10.9601, 78.0766],
  'Krishnagiri': [12.5186, 78.2137],
  'Madurai': [9.9252, 78.1198],
  'Mayiladuthurai': [11.1018, 79.6522],
  'Nagapattinam': [10.7672, 79.8449],
  'Namakkal': [11.2189, 78.1674],
  'Nilgiris': [11.4102, 76.6950],
  'Perambalur': [11.2342, 78.8820],
  'Pudukkottai': [10.3797, 78.8208],
  'Ramanathapuram': [9.3639, 78.8395],
  'Ranipet': [12.9224, 79.3328],
  'Salem': [11.6643, 78.1460],
  'Sivaganga': [9.8433, 78.4809],
  'Tenkasi': [8.9594, 77.3152],
  'Thanjavur': [10.7870, 79.1378],
  'Theni': [10.0104, 77.4768],
  'Thoothukudi': [8.7642, 78.1348],
  'Tiruchirappalli': [10.7905, 78.7047],
  'Tirunelveli': [8.7139, 77.7567],
  'Tirupathur': [12.4958, 78.5678],
  'Tirupur': [11.1085, 77.3411],
  'Tiruvallur': [13.1432, 79.9079],
  'Tiruvannamalai': [12.2253, 79.0747],
  'Tiruvarur': [10.7661, 79.6344],
  'Vellore': [12.9165, 79.1325],
  'Viluppuram': [11.9401, 79.4861],
  'Villupuram': [11.9401, 79.4861],
  'Virudhunagar': [9.5872, 77.9514],
};

const TN_ALIASES: Record<string, string> = {
  'trichy': 'Tiruchirappalli',
  'thiruchirappalli': 'Tiruchirappalli',
  'tuticorin': 'Thoothukudi',
  'ooty': 'Nilgiris',
  'kanchi': 'Kanchipuram',
  'nellai': 'Tirunelveli',
  'thirunelveli': 'Tirunelveli',
  'thiruvallur': 'Tiruvallur',
  'thiruvannamalai': 'Tiruvannamalai',
  'thiruvarur': 'Tiruvarur',
  'thanjai': 'Thanjavur',
  'nagercoil': 'Kanyakumari',
};

// Returns GPS coordinates strictly bounded inside Tamil Nadu
export function getTamilNaduCoordinates(district?: string | null, id?: string | null): [number, number] {
  const clean = (district ?? '').toString().trim().toLowerCase();
  
  let match = clean ? Object.keys(TN_DISTRICT_COORDS).find(
    d => d.toLowerCase() === clean
  ) : undefined;
  
  if (!match && clean && TN_ALIASES[clean]) {
    match = TN_ALIASES[clean];
  }
  
  if (!match && clean) {
    match = Object.keys(TN_DISTRICT_COORDS).find(
      d => clean.includes(d.toLowerCase()) || d.toLowerCase().includes(clean)
    );
  }

  // Base coords: default to central Tamil Nadu (Tiruchirappalli) if district is missing or unknown
  const base = match ? TN_DISTRICT_COORDS[match] : [10.7905, 78.7047];

  // Apply deterministic micro-jitter (~1.5 to 3 km) so multiple industries in the same district don't overlap completely
  let hash = 0;
  const key = (id ?? district ?? 'tn').toString();
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) | 0;
  }
  
  const jitterLat = ((Math.abs(hash) % 40) - 20) * 0.0025;
  const jitterLng = ((Math.abs(hash >> 5) % 40) - 20) * 0.0025;

  // Strict clamp to Tamil Nadu's geographical boundary
  const lat = Math.min(Math.max(base[0] + jitterLat, 8.12), 13.50);
  const lng = Math.min(Math.max(base[1] + jitterLng, 76.35), 80.30);

  return [lat, lng];
}

interface TamilNaduComplianceMapProps {
  industries?: IndustryMapItem[];
  onSelectIndustry?: (industry: IndustryMapItem) => void;
}

export function TamilNaduComplianceMap({
  industries = [],
  onSelectIndustry,
}: TamilNaduComplianceMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletType.Map | null>(null);
  const markersLayerRef = useRef<LeafletType.LayerGroup | null>(null);
  const tileLayerRef = useRef<LeafletType.TileLayer | null>(null);
  const leafletLibRef = useRef<any>(null);

  const [isMounted, setIsMounted] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'Safe' | 'Warning' | 'Critical'>('all');
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryMapItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite' | 'dark'>('streets');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Counts
  const counts = useMemo(() => {
    const safeList = Array.isArray(industries) ? industries : [];
    const res = { all: safeList.length, Safe: 0, Warning: 0, Critical: 0 };
    safeList.forEach((ind) => {
      if (!ind) return;
      const status = ind.compliance_status || 'Safe';
      if (status === 'Critical') res.Critical++;
      else if (status === 'Warning') res.Warning++;
      else res.Safe++;
    });
    return res;
  }, [industries]);

  // Filtered industries
  const filteredIndustries = useMemo(() => {
    const safeList = Array.isArray(industries) ? industries : [];
    return safeList.filter((ind) => {
      if (!ind) return false;
      const matchesFilter = activeFilter === 'all' || ind.compliance_status === activeFilter;
      const q = (searchQuery || '').toLowerCase().trim();
      const name = (ind.industry_name || ind.name || '').toString().toLowerCase();
      const dist = (ind.district || '').toString().toLowerCase();
      const matchesSearch = !q || name.includes(q) || dist.includes(q);
      return matchesFilter && matchesSearch;
    });
  }, [industries, activeFilter, searchQuery]);

  // Map Tile configuration - 100% Free & Open-Source (No API Key Required)
  const getTileUrl = (style: 'streets' | 'satellite' | 'dark') => {
    switch (style) {
      case 'dark':
      case 'satellite':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      case 'streets':
      default:
        // Official Free OpenStreetMap tile server (Zero API key needed)
        return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    }
  };

  const getTileAttribution = (style: 'streets' | 'satellite' | 'dark') => {
    if (style === 'satellite' || style === 'dark') {
      return '&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';
    }
    return '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
  };

  // Helper to render markers using the loaded Leaflet instance
  const renderMarkers = useCallback((L: any, layerGroup: any, items: IndustryMapItem[]) => {
    layerGroup.clearLayers();

    items.forEach((ind) => {
      if (!ind) return;
      const id = ind.user_id || ind.id || Math.random().toString();
      const coords = getTamilNaduCoordinates(ind.district, id);
      const status = ind.compliance_status || 'Safe';

      let markerClass = 'tn-marker-safe';
      if (status === 'Warning') markerClass = 'tn-marker-warning';
      if (status === 'Critical') markerClass = 'tn-marker-critical';

      const customIcon = L.divIcon({
        className: 'tn-custom-marker',
        html: `
          <div class="tn-marker ${markerClass}">
            <span class="tn-marker-pulse"></span>
            <span class="tn-marker-dot"></span>
          </div>
        `,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });

      const marker = L.marker(coords, { icon: customIcon });

      const statusColor =
        status === 'Critical' ? '#ef4444' : status === 'Warning' ? '#f59e0b' : '#10b981';
      const statusBg =
        status === 'Critical' ? '#fef2f2' : status === 'Warning' ? '#fffbeb' : '#ecfdf5';

      const popupContent = `
        <div style="font-family: inherit; width: 260px; padding: 14px; background: white; border-radius: 10px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <span style="font-size: 11px; font-weight: 700; color: ${statusColor}; background: ${statusBg}; padding: 3px 8px; border-radius: 9999px; text-transform: uppercase;">
              ● ${status}
            </span>
            <span style="font-size: 11px; color: #64748b; font-weight: 600;">
              ${ind.district || 'Tamil Nadu'}
            </span>
          </div>
          <h4 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 700; color: #0f172a; line-height: 1.3;">
            ${ind.industry_name || ind.name || 'Industrial Facility'}
          </h4>
          <p style="margin: 0 0 10px 0; font-size: 11px; color: #64748b;">
            TNPCB Monitored Unit
          </p>

          <div style="background: #f8fafc; border-radius: 6px; padding: 8px 10px; margin-bottom: 10px; font-size: 12px; border: 1px solid #e2e8f0;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span style="color: #64748b;">CTO Usage:</span>
              <span style="font-weight: 700; color: #1e293b;">${Number(ind.current_cto_consumption || 0).toLocaleString()} L</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span style="color: #64748b;">Reuse Target:</span>
              <span style="font-weight: 700; color: #1e293b;">${ind.current_reuse_percentage || 0}%</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #64748b;">Warnings:</span>
              <span style="font-weight: 700; color: ${Number(ind.warning_count || 0) > 0 ? '#ef4444' : '#10b981'};">
                ${ind.warning_count || 0}
              </span>
            </div>
          </div>

          <button 
            id="popup-btn-${id}" 
            style="width: 100%; background: #2563eb; color: white; border: none; padding: 7px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px; transition: background 0.2s;"
            onmouseover="this.style.background='#1d4ed8'"
            onmouseout="this.style.background='#2563eb'"
          >
            Inspect Details &rarr;
          </button>
        </div>
      `;

      marker.bindPopup(popupContent, {
        closeButton: false,
        offset: [0, -8],
      });

      marker.on('click', () => {
        setSelectedIndustry(ind);
        if (onSelectIndustry) onSelectIndustry(ind);
      });

      marker.on('popupopen', () => {
        const btn = document.getElementById(`popup-btn-${id}`);
        if (btn) {
          btn.onclick = () => {
            window.dispatchEvent(new CustomEvent('gov-navigate', { detail: 'industries' }));
          };
        }
      });

      marker.addTo(layerGroup);
    });
  }, [onSelectIndustry]);

  // Client-side Leaflet Initialization
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;
    let isCancelled = false;

    async function initLeaflet() {
      try {
        const leafletModule = await import("leaflet");
        const L = (leafletModule as any).default || leafletModule;
        leafletLibRef.current = L;

        if (isCancelled || !mapContainerRef.current) return;

        if (!mapRef.current) {
          const tnCenter: [number, number] = [11.1271, 78.6569];

          const map = L.map(mapContainerRef.current, {
            center: tnCenter,
            zoom: 7,
            minZoom: 6,
            maxZoom: 16,
            maxBounds: [
              [7.8, 75.8],
              [13.9, 80.8]
            ],
            zoomControl: false,
          });

          L.control.zoom({ position: 'topright' }).addTo(map);

          const tileLayer = L.tileLayer(getTileUrl(mapStyle), {
            attribution: getTileAttribution(mapStyle),
            maxZoom: 18,
          }).addTo(map);

          tileLayerRef.current = tileLayer;

          const markersLayer = L.layerGroup().addTo(map);
          markersLayerRef.current = markersLayer;

          mapRef.current = map;

          renderMarkers(L, markersLayer, filteredIndustries);

          setTimeout(() => {
            if (!isCancelled && mapRef.current) {
              mapRef.current.invalidateSize();
            }
          }, 300);
        }
      } catch (err) {
        console.error("Error loading Leaflet map:", err);
      }
    }

    initLeaflet();

    return () => {
      isCancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markersLayerRef.current = null;
        tileLayerRef.current = null;
      }
    };
  }, []);

  // Update tile layer when style changes
  useEffect(() => {
    if (!mapRef.current || !tileLayerRef.current) return;
    tileLayerRef.current.setUrl(getTileUrl(mapStyle));
  }, [mapStyle]);

  // Update markers on filter or industry changes
  useEffect(() => {
    const L = leafletLibRef.current;
    if (!mapRef.current || !markersLayerRef.current || !L) return;
    renderMarkers(L, markersLayerRef.current, filteredIndustries);
  }, [filteredIndustries, renderMarkers]);

  // Recenter Map on Tamil Nadu
  const handleRecenter = () => {
    if (!mapRef.current) return;
    mapRef.current.setView([11.1271, 78.6569], 7, { animate: true });
    setSelectedIndustry(null);
  };

  return (
    <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden flex flex-col w-full">
      {/* Top Header & Toolbar */}
      <div className="p-4 md:p-5 border-b border-slate-200 dark:border-slate-700 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/40">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
              <MapPin className="w-5 h-5" />
            </span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Tamil Nadu Industry Compliance Map
            </h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
              Live GIS
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time geolocation of active manufacturing units across all 38 districts of Tamil Nadu
          </p>
        </div>

        {/* Filter Pills & Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filters */}
          <div className="flex items-center bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm text-xs font-medium">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeFilter === 'all'
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              All ({counts.all})
            </button>
            <button
              onClick={() => setActiveFilter('Critical')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
                activeFilter === 'Critical'
                  ? 'bg-red-600 text-white font-semibold shadow-xs'
                  : 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              Critical ({counts.Critical})
            </button>
            <button
              onClick={() => setActiveFilter('Warning')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
                activeFilter === 'Warning'
                  ? 'bg-amber-500 text-white font-semibold shadow-xs'
                  : 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Warning ({counts.Warning})
            </button>
            <button
              onClick={() => setActiveFilter('Safe')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
                activeFilter === 'Safe'
                  ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                  : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Safe ({counts.Safe})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search industry / district..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 w-44"
            />
          </div>

          {/* Style Selector */}
          <div className="flex items-center bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-1">
            <button
              onClick={() => setMapStyle('streets')}
              title="OpenStreetMap (Free & Open Source)"
              className={`px-2 py-1 rounded text-xs transition-colors ${
                mapStyle === 'streets'
                  ? 'bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-bold'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              OSM Map
            </button>
            <button
              onClick={() => setMapStyle('satellite')}
              title="Satellite Imagery (Open Source)"
              className={`px-2 py-1 rounded text-xs transition-colors ${
                mapStyle === 'satellite'
                  ? 'bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-bold'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Satellite
            </button>
          </div>

          {/* Recenter Button */}
          <button
            onClick={handleRecenter}
            title="Reset to Tamil Nadu"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-sm transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Recenter
          </button>
        </div>
      </div>

      {/* Map Body */}
      <div className="relative w-full h-[540px] bg-slate-100 dark:bg-slate-900">
        <div ref={mapContainerRef} className="w-full h-full" />

        {!isMounted && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-500 text-xs gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            <span>Initializing Tamil Nadu Map...</span>
          </div>
        )}

        {/* Floating Bottom Legend */}
        <div className="absolute bottom-4 left-4 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-700/80 rounded-xl shadow-lg p-3 text-xs flex flex-col gap-2 max-w-xs pointer-events-auto">
          <div className="flex items-center justify-between font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-1.5">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> Compliance Status
            </span>
            <span className="text-[10px] text-slate-400">38 Districts</span>
          </div>
          <div className="flex items-center gap-4 text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20"></span>
              <span>Safe</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-500 ring-4 ring-amber-500/20"></span>
              <span>Warning</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500 ring-4 ring-red-500/30 animate-pulse"></span>
              <span>Critical</span>
            </div>
          </div>
        </div>

        {/* Selected Industry Card Drawer */}
        {selectedIndustry && (
          <div className="absolute top-4 right-14 z-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl p-5 w-80 animate-in fade-in slide-in-from-right-4 duration-200">
            <div className="flex items-start justify-between mb-3">
              <div>
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-1.5 ${
                    selectedIndustry.compliance_status === 'Critical'
                      ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400 border border-red-200 dark:border-red-800'
                      : selectedIndustry.compliance_status === 'Warning'
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                  }`}
                >
                  ● {selectedIndustry.compliance_status || 'Safe'}
                </span>
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-base leading-snug">
                  {selectedIndustry.industry_name || selectedIndustry.name || 'Industrial Facility'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-blue-500" />
                  {selectedIndustry.district || 'Tamil Nadu'}, TN
                </p>
              </div>
              <button
                onClick={() => setSelectedIndustry(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs mb-4 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center pb-1.5 border-b border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Gauge className="w-3.5 h-3.5 text-slate-400" /> Daily CTO Consumption
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {Number(selectedIndustry.current_cto_consumption || 0).toLocaleString()} L
                </span>
              </div>
              <div className="flex justify-between items-center pb-1.5 border-b border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Droplets className="w-3.5 h-3.5 text-blue-500" /> Water Reuse Target
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {selectedIndustry.current_reuse_percentage || 0}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Warnings Issued
                </span>
                <span className={`font-bold ${Number(selectedIndustry.warning_count || 0) > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  {selectedIndustry.warning_count || 0}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('gov-navigate', { detail: 'industries' }));
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <span>View in Directory</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
