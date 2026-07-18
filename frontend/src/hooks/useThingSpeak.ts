import { useState, useEffect } from "react";
import { THINGSPEAK_CONFIG, SENSOR_MAPPING } from "@/lib/config";

export interface SensorData {
  flowRate: number;
  totalFlow: number;
  temperature: number;
  ph: number;
  waterLevel: number;
  ultrasonic: number;
  timestamp: string;
}

export function useThingSpeak() {
  const [data, setData] = useState<SensorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<SensorData[]>([]);

  const fetchData = async () => {
    try {
      // Use the local server proxy to avoid CORS restrictions on the ThingSpeak API
      const url = `/api/thingspeak?results=20`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Server responded with ${response.status}`);
      
      const json = await response.json();
      const feeds = json.feeds;
      
      if (feeds && feeds.length > 0) {
        const latest = feeds[feeds.length - 1];
        const parsedData: SensorData = {
          flowRate: parseFloat(latest[SENSOR_MAPPING.flowRate]) || 0,
          totalFlow: parseFloat(latest[SENSOR_MAPPING.totalFlow]) || 0,
          temperature: parseFloat(latest[SENSOR_MAPPING.temperature]) || 0,
          ph: parseFloat(latest[SENSOR_MAPPING.ph]) || 0,
          waterLevel: Math.min(100, Math.max(0, parseFloat(latest[SENSOR_MAPPING.waterLevel]) || 0)),
          ultrasonic: parseFloat(latest[SENSOR_MAPPING.ultrasonic]) || 0,
          timestamp: latest.created_at,
        };

        const parsedHistory = feeds.map((f: any) => ({
          flowRate: parseFloat(f[SENSOR_MAPPING.flowRate]) || 0,
          totalFlow: parseFloat(f[SENSOR_MAPPING.totalFlow]) || 0,
          temperature: parseFloat(f[SENSOR_MAPPING.temperature]) || 0,
          ph: parseFloat(f[SENSOR_MAPPING.ph]) || 0,
          waterLevel: parseFloat(f[SENSOR_MAPPING.waterLevel]) || 0,
          ultrasonic: parseFloat(f[SENSOR_MAPPING.ultrasonic]) || 0,
          timestamp: f.created_at,
        }));

        // Persist real-time reading to MongoDB
        try {
          fetch('/api/sensor-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(parsedData)
          }).catch(e => console.error('Failed to sync sensor data to DB', e));
        } catch (e) {
          // Silent catch for network errors
        }

        setData(parsedData);
        setHistory(parsedHistory);
        setError(null);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, THINGSPEAK_CONFIG.POLL_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  return { data, history, loading, error, refetch: fetchData };
}
