// src/components/LeafletMap.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup,
  CircleMarker,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const BACKEND_URL = import.meta.env.VITE_BACKEND_BASE_URL;

// Fix default marker icons for Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function FitToBounds({ positions }) {
  const map = useMap();
  useEffect(() => {
    if (!positions || positions.length === 0) return;
    if (positions.length === 1) map.setView(positions[0], 17);
    else map.fitBounds(L.latLngBounds(positions), { padding: [32, 32] });
  }, [positions, map]);
  return null;
}

const LeafletMap = ({ userId, from, to }) => {
  const [points, setPoints] = useState([]);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) {
      setPoints([]);
      return;
    }
    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (from) params.append("from", from);
        if (to) params.append("to", to);
        const qs = params.toString() ? `?${params.toString()}` : "";
        const res = await axios.get(`${BACKEND_URL}/tracking/${userId}${qs}`);
        if (ignore) return;
        setPoints(Array.isArray(res.data?.data) ? res.data.data : []);
        setErr(null);
      } catch (e) {
        if (!ignore) setErr(e?.response?.data?.message || e.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, [userId, from, to]);

  const cleanPoints = useMemo(() => {
    const rows = (points || []).filter((p) => Number.isFinite(p?.lat) && Number.isFinite(p?.lng));
    const dedup = [];
    for (let i = 0; i < rows.length; i++) {
      const prev = dedup[dedup.length - 1];
      const cur = rows[i];
      if (!prev || prev.lat !== cur.lat || prev.lng !== cur.lng) dedup.push(cur);
    }
    return dedup;
  }, [points]);

  const positions = useMemo(() => cleanPoints.map((p) => [p.lat, p.lng]), [cleanPoints]);

  if (!userId) return <div className="p-4">Pick a user and date range, then Apply.</div>;
  if (loading) return <div className="p-4">Loading map…</div>;
  if (err) return <div className="p-4 text-red-600">Error: {String(err)}</div>;
  if (cleanPoints.length === 0) return <div className="p-4">No tracking data found.</div>;

  const start = cleanPoints[0];
  const end = cleanPoints[cleanPoints.length - 1];
  const hasMovement = positions.length > 1;

  return (
    <div style={{ height: "75vh", width: "100%" }}>
      <MapContainer center={positions[0]} zoom={14} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitToBounds positions={positions} />
        {hasMovement ? (
          <Polyline positions={positions} weight={4} dashArray="6 8" />
        ) : (
          <CircleMarker center={[start.lat, start.lng]} radius={10}>
            <Popup>No movement in this range</Popup>
          </CircleMarker>
        )}
        <Marker position={[start.lat, start.lng]}>
          <Popup><b>Start</b><br/>{start.timestamp ? new Date(start.timestamp).toLocaleString() : "—"}</Popup>
        </Marker>
        <Marker position={[end.lat, end.lng]}>
          <Popup><b>End</b><br/>{end.timestamp ? new Date(end.timestamp).toLocaleString() : "—"}</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default LeafletMap;
