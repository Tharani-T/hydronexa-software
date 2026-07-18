import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import https from 'https';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'hydronexa-super-secret-key-2026';

// Supabase setup
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env");
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);

app.use(cors());
app.use(express.json());

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token.' });
    req.user = user;
    next();
  });
};

// --- AUTHENTICATION ROUTES ---

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const { data: existingUser } = await supabase
      .from('users')
      .select('_id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(409).json({ error: 'Email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const { data: newUser, error } = await supabase
      .from('users')
      .insert({ email, password: hashedPassword, role: role || 'industry' })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ message: 'User registered successfully', userId: newUser._id });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });

    res.json({ token, user: { id: user._id, email: user.email, role: user.role } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// --- SETUP ROUTES ---

// Get Setup Data
app.get('/api/setup', authenticateToken, async (req, res) => {
  try {
    const { data: setup, error } = await supabase
      .from('setups')
      .select('*')
      .eq('user_id', req.user.id)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      throw error;
    }

    if (!setup) {
      return res.json({});
    }

    res.json(setup);
  } catch (error) {
    console.error('Error fetching setup:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Create or Update Setup Data
app.post('/api/setup', authenticateToken, async (req, res) => {
  try {
    const data = req.body;
    const userId = req.user.id;

    // Check if setup exists
    const { data: existing } = await supabase
      .from('setups')
      .select('_id')
      .eq('user_id', userId)
      .single();

    if (existing) {
      // Update
      const { error } = await supabase
        .from('setups')
        .update(data)
        .eq('user_id', userId);
      if (error) throw error;
      res.json({ message: 'Setup updated successfully' });
    } else {
      // Insert
      const { error } = await supabase
        .from('setups')
        .insert({ ...data, user_id: userId });
      if (error) throw error;
      res.status(201).json({ message: 'Setup created successfully' });
    }
  } catch (error) {
    console.error('Error saving setup:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// --- SENSOR DATA ROUTES ---

// Save real-time sensor data
app.post('/api/sensor-data', async (req, res) => {
  try {
    const data = req.body;
    if (!data.timestamp) {
      return res.status(400).json({ error: 'Timestamp is required' });
    }

    const { error } = await supabase
      .from('sensor_data')
      .upsert({ ...data }, { onConflict: 'timestamp' });

    if (error) throw error;
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error saving sensor data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Fetch stored sensor data (for download/history)
app.get('/api/sensor-data', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 1000;
    
    const { data: records, error } = await supabase
      .from('sensor_data')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) throw error;
    // Return chronologically (oldest first)
    res.json(records.reverse());
  } catch (error) {
    console.error('Error fetching sensor data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- THINGSPEAK PROXY ROUTE ---
app.get('/api/thingspeak', async (req, res) => {
  try {
    const channelId = process.env.THINGSPEAK_CHANNEL_ID || '3376172';
    const apiKey    = process.env.THINGSPEAK_API_KEY    || 'MPS9SI3M2DCXGVKO';
    const results   = req.query.results || 20;
    const url = `https://api.thingspeak.com/channels/${channelId}/feeds.json?api_key=${apiKey}&results=${results}`;

    const data = await new Promise((resolve, reject) => {
      https.get(url, (tsRes) => {
        let body = '';
        tsRes.on('data', chunk => (body += chunk));
        tsRes.on('end', () => {
          try { resolve(JSON.parse(body)); }
          catch (e) { reject(new Error('Invalid JSON from ThingSpeak')); }
        });
      }).on('error', reject);
    });

    res.json(data);
  } catch (err) {
    console.error('ThingSpeak proxy error:', err.message);
    res.status(502).json({ error: 'Failed to fetch from ThingSpeak', detail: err.message });
  }
});

// --- CONTACT ROUTE ---
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, company, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required.' });
    }
    const { error } = await supabase
      .from('contact_messages')
      .insert({ name, email, company, message });
      
    if (error) throw error;
    res.status(201).json({ success: true, message: 'Message saved successfully!' });
  } catch (error) {
    console.error('Error saving contact message:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// --- SMTP ROUTE ---
app.post('/api/send-email', async (req, res) => {
  try {
    const { to, subject, text } = req.body;
    
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    await transporter.sendMail({
      from: `"HydroNexa Govt Sentinel" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text
    });

    res.json({ success: true });
  } catch (err) {
    console.error('SMTP Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/send-cto-alert', authenticateToken, async (req, res) => {
  try {
    const { to, industryName, dailyLimit, currentUsage, exceededAmount, timestamp } = req.body;
    const userId = req.user.id;
    
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const text = `Dear ${industryName || 'Industry'},

Our HydroNexa monitoring system has detected that your industrial water consumption has exceeded the configured Daily CTO Water Limit.

Operational Summary:
* Configured Daily Limit: ${dailyLimit} KL
* Current Water Usage: ${currentUsage} KL
* Exceeded Amount: ${exceededAmount} KL
* Detection Time: ${timestamp || new Date().toLocaleString()}

Immediate operational attention is recommended to maintain sustainability and compliance standards.

Please optimize water usage and reuse operations to avoid further compliance risks.

Regards,
HydroNexa Monitoring Intelligence System`;

    // Try sending email
    let deliveryStatus = 'Sent';
    try {
      await transporter.sendMail({
        from: `"HydroNexa Monitoring Intelligence System" <${process.env.SMTP_USER}>`,
        to,
        subject: '🚨 CTO Compliance Warning — HydroNexa Monitoring System',
        text
      });
      deliveryStatus = 'Delivered';
    } catch (emailErr) {
      console.error('Nodemailer failed to send email. Saving history as failed.', emailErr);
      deliveryStatus = 'Failed';
    }

    // Save alert history
    const { error } = await supabase
      .from('alert_history')
      .insert({
        user_id: userId,
        industryName: industryName || 'Industry',
        alertType: 'Daily CTO Limit Violation',
        message: `Daily CTO Limit of ${dailyLimit} KL exceeded. Current: ${currentUsage} KL. Exceeded by: ${exceededAmount} KL.`,
        deliveryStatus,
        timestamp: new Date()
      });

    if (error) throw error;

    res.json({ success: true, deliveryStatus });
  } catch (err) {
    console.error('CTO Alert SMTP / Saving Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/send-quality-alert', authenticateToken, async (req, res) => {
  try {
    const { to, industryName, ph, temperature, reason, warningMessage, recommendation, timestamp } = req.body;
    const userId = req.user.id;
    
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const text = `Dear ${industryName || 'Industry'},

Our HydroNexa AI-powered Water Reusability Intelligence System has detected that your water quality has breached safe operational standard limits. Water reuse is temporarily RESTRICTED.

Operational Water Quality Breach Summary:
* Current pH Value: ${ph} pH
* Current Temperature: ${temperature} °C
* Reason for Restriction: ${reason}
* AI Operational Warning: ${warningMessage}
* Recommendation: ${recommendation}
* Detection Time: ${timestamp || new Date().toLocaleString()}

Immediate operational attention is recommended to adjust chemical dosage or check thermal loop sync systems.

Regards,
HydroNexa AI Water Intelligence Engine`;

    let deliveryStatus = 'Sent';
    try {
      await transporter.sendMail({
        from: `"HydroNexa AI Water Intelligence Engine" <${process.env.SMTP_USER}>`,
        to,
        subject: '⚠️ WATER QUALITY BREACH ALERT — HydroNexa AI Engine',
        text
      });
      deliveryStatus = 'Delivered';
    } catch (emailErr) {
      console.error('Nodemailer failed to send quality alert email:', emailErr);
      deliveryStatus = 'Failed';
    }

    // Save alert history
    const { error } = await supabase
      .from('alert_history')
      .insert({
        user_id: userId,
        industryName: industryName || 'Industry',
        alertType: 'Water Quality Breach',
        message: `Quality Breach: pH ${ph} pH, Temp ${temperature}°C. Restriction: ${reason}. Recommendation: ${recommendation}`,
        deliveryStatus,
        timestamp: new Date()
      });
      
    if (error) throw error;

    res.json({ success: true, deliveryStatus });
  } catch (err) {
    console.error('Quality Alert SMTP / Saving Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/alerts/history', authenticateToken, async (req, res) => {
  try {
    const { data: history, error } = await supabase
      .from('alert_history')
      .select('*')
      .eq('user_id', req.user.id)
      .order('timestamp', { ascending: false });

    if (error) throw error;
    res.json(history);
  } catch (err) {
    console.error('Error fetching alert history:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
