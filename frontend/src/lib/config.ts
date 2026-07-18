export const THINGSPEAK_CONFIG = {
  CHANNEL_ID: import.meta.env.VITE_THINGSPEAK_CHANNEL_ID || "3376172",
  API_KEY: import.meta.env.VITE_THINGSPEAK_API_KEY || "MPS9SI3M2DCXGVKO",
  POLL_INTERVAL: 5000, // 5 seconds
};

export const SENSOR_MAPPING = {
  flowRate: "field1",
  totalFlow: "field2",
  temperature: "field3",
  ph: "field4",
  waterLevel: "field5",
  ultrasonic: "field6",
};

export const THRESHOLDS = {
  PH_MIN: 6.5,
  PH_MAX: 8.5,
  TEMP_MAX: 45,
  LEVEL_MAX: 90,
  LEVEL_MIN: 20,
};
