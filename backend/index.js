import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import https from 'https';
import multer from 'multer';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

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

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use.`);
    console.error(`Please kill the process using this port or change the PORT in .env.`);
  } else {
    console.error('❌ Server error:', err);
  }
  process.exit(1);
});

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

  // Try custom JWT first (for Admin)
  jwt.verify(token, JWT_SECRET, async (err, user) => {
    if (!err) {
      req.user = user;
      return next();
    }
    
    // If custom JWT fails, try Supabase Auth
    const { data: { user: sbUser }, error } = await supabase.auth.getUser(token);
    if (error || !sbUser) {
      return res.status(403).json({ error: 'Invalid token.' });
    }
    req.user = { id: sbUser.id, email: sbUser.email, role: 'industry' };
    next();
  });
};

// --- AUTHENTICATION ROUTES ---

// Register (Legacy)
app.post('/api/auth/register', async (req, res) => {
  res.status(403).json({ error: 'Registration disabled. Admins must create accounts.' });
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // Login using Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error || !data.user) {
      return res.status(401).json({ error: error?.message || 'Invalid credentials.' });
    }

    res.json({ 
      token: data.session.access_token, 
      user: { id: data.user.id, email: data.user.email, role: 'industry' } 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Admin Login Prototype Route
app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (email === "tharani.t.ciet@gmail.com" && password === "HydroNexa@2026") {
      const token = jwt.sign({ id: "admin-123", email, role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
      return res.json({ token, success: true });
    }
    res.status(401).json({ error: 'Invalid admin credentials' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin Create Auth User
app.post('/api/admin/create-auth', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (error) {
      if (error.code === 'user_already_exists' || error.code === 'email_exists' || (error.message && error.message.includes('already') && error.message.includes('registered'))) {
        const { data: usersData } = await supabase.auth.admin.listUsers();
        const existing = usersData.users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (existing) {
          await supabase.auth.admin.updateUserById(existing.id, { password });
          return res.json({ authUserId: existing.id, success: true });
        }
      }
      throw error;
    }

    res.json({ authUserId: data.user.id, success: true });
  } catch (error) {
    console.error('Error creating auth user:', error);
    res.status(500).json({ error: error.message || 'Failed to create auth user' });
  }
});

// --- PROTECTED ROUTES ---

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
    const rawData = req.body;
    const userId = req.user.id;

    const allowedColumns = [
      'industrytype', 'plantscale', 'processtype', 'plantname', 'location', 
      'dailycapacity', 'ctolimit', 'monthlyctolimit', 'reusetarget', 
      'monitoringfrequency', 'shifttimings', 'workingdays', 'units', 
      'watersource', 'benchmark', 'alertsensitivity', 'notifications', 
      'aimonitoring', 'compliancealerts', 'sustainabilityreports', 'completed', 'ctovalidity'
    ];

    // Map to lowercase for Postgres compatibility and filter out unallowed columns
    const data = {};
    for (const key in rawData) {
      if (rawData.hasOwnProperty(key)) {
        const lowerKey = key.toLowerCase();
        if (allowedColumns.includes(lowerKey)) {
          data[lowerKey] = rawData[key];
        }
      }
    }

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

    // Postgres / Supabase usually prefers lowercase column names
    const mappedData = {};
    for (const key in data) {
      mappedData[key.toLowerCase()] = data[key];
    }

    const { error } = await supabase
      .from('sensor_data')
      .upsert({ ...mappedData }, { onConflict: 'timestamp' });

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
    const { name, email, phone, company, message } = req.body;
    if (!name || !email || !message || !phone) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    const { error } = await supabase
      .from('contact_messages')
      .insert({ name, email, phone, company, industryType: 'Not Specified', message, status: 'Pending' });
      
    if (error) throw error;
    res.status(201).json({ success: true, message: 'Message saved successfully!' });
  } catch (error) {
    console.error('Error saving contact message:', error);
    res.status(500).json({ error: error.message || 'Internal server error.', detail: error });
  }
});

app.get('/api/admin/contact-requests', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('contact_messages')
      .select('*')
      .order('createdat', { ascending: false });
      
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching contact messages:', error);
    res.status(500).json({ error: 'Internal server error.', details: error.message || error });
  }
});

const upload = multer({ storage: multer.memoryStorage() });

app.post('/api/admin/parse-pdf', authenticateToken, upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const data = await pdfParse(req.file.buffer);
    const text = data.text;

    const extractedData = {
      companyName: text.match(/Company(?: Name)?:\s*([^\n]+)/i)?.[1]?.trim() || '',
      location: text.match(/Location:\s*([^\n]+)/i)?.[1]?.trim() || '',
      capacity: text.match(/Capacity:\s*([^\n]+)/i)?.[1]?.trim() || '',
      waterSource: text.match(/(?:Water )?Source:\s*([^\n]+)/i)?.[1]?.trim() || '',
      type: text.match(/Type:\s*([^\n]+)/i)?.[1]?.trim() || '',
      ctoValidity: text.match(/CTO Validity:\s*([^\n]+)/i)?.[1]?.trim() || '',
    };

    res.json({ success: true, extractedData });
  } catch (error) {
    console.error('Error parsing PDF:', error);
    res.status(500).json({ error: 'Failed to parse PDF' });
  }
});

// Admin Approve Industry
app.post('/api/admin/approve-industry', authenticateToken, async (req, res) => {
  try {
    // Only allow admin to perform this. Add basic check:
    if (req.user.role !== 'admin') {
      // In this demo environment, we'll allow it if role is missing, but log a warning
      console.warn("Non-admin user attempting approval, or missing role");
    }

    const { requestId, industryName, email, password, authUserId, setupData } = req.body;

    if (!email || !password || !authUserId || !setupData) {
      return res.status(400).json({ error: 'Missing required approval fields' });
    }

    // 2. Insert into users table to satisfy setups_user_id_fkey
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const { error: userError } = await supabase
      .from('users')
      .upsert({ _id: authUserId, email, password: hashedPassword, role: 'industry' }, { onConflict: '_id' });
    if (userError) throw userError;

    // 3. Create Setup Data
    const allowedColumns = [
      'industrytype', 'plantscale', 'processtype', 'plantname', 'location', 
      'dailycapacity', 'ctolimit', 'monthlyctolimit', 'reusetarget', 
      'monitoringfrequency', 'shifttimings', 'workingdays', 'units', 
      'watersource', 'benchmark', 'alertsensitivity', 'notifications', 
      'aimonitoring', 'compliancealerts', 'sustainabilityreports', 'ctovalidity'
    ];
    
    const lowerCaseSetupData = Object.fromEntries(
      Object.entries(setupData)
        .map(([k, v]) => [k.toLowerCase(), v])
        .filter(([k]) => allowedColumns.includes(k))
    );
    
    const { error: setupError } = await supabase
      .from('setups')
      .upsert({ ...lowerCaseSetupData, completed: true, user_id: authUserId }, { onConflict: 'user_id' });

    if (setupError) throw setupError;

    // 3. Update Contact Request Status if requestId exists
    if (requestId) {
      const { error: updateError } = await supabase
        .from('contact_messages')
        .update({ status: 'Approved' })
        .eq('_id', requestId);

      if (updateError) throw updateError;
    }

    // 4. Store in industry_management table
    const { error: imError } = await supabase
      .from('industry_management')
      .insert({
        industry_name: industryName,
        email_id: email,
        password: password
      });
      
    if (imError) {
      console.error('Error inserting into industry_management:', imError);
      // We don't throw here to not break the approval flow if the table doesn't exist yet
    }

    res.json({ success: true, message: 'Industry approved and account created successfully!' });
  } catch (error) {
    console.error('Error approving industry:', error);
    res.status(500).json({ error: 'Failed to approve industry.', details: error.message || error });
  }
});

// Admin Update Request Status (for Change Requests)
app.post('/api/admin/update-request-status', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    const { requestId, status } = req.body;
    if (!requestId || !status) return res.status(400).json({ error: 'Missing required fields' });
    
    const { error } = await supabase
      .from('contact_messages')
      .update({ status })
      .eq('_id', requestId);
      
    if (error) throw error;
    res.json({ success: true, message: `Request marked as ${status}` });
  } catch (error) {
    console.error('Error updating request status:', error);
    res.status(500).json({ error: 'Failed to update request status', details: error.message || error });
  }
});

// Admin Reset Industry Password
app.post('/api/admin/reset-password', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const { email, newPassword } = req.body;
    if (!email || !newPassword) return res.status(400).json({ error: 'Email and new password required' });

    // Try finding user in Auth
    const { data: usersData } = await supabase.auth.admin.listUsers();
    const existing = usersData?.users?.find(u => u.email === email);
    
    if (existing) {
      await supabase.auth.admin.updateUserById(existing.id, { password: newPassword });
    } else {
      // Fallback for legacy users
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      await supabase.from('users').update({ password: hashedPassword }).eq('email', email);
    }
    
    // Update industry_management table
    await supabase.from('industry_management').update({ password: newPassword }).eq('email_id', email);

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ error: 'Failed to reset password.' });
  }
});

// Admin Reject Industry
app.post('/api/admin/reject-industry', authenticateToken, async (req, res) => {
  try {
    const { requestId } = req.body;
    if (!requestId) return res.status(400).json({ error: 'Request ID is required' });

    const { error: updateError } = await supabase
      .from('contact_messages')
      .update({ status: 'Rejected' })
      .eq('_id', requestId);

    if (updateError) throw updateError;

    res.json({ success: true, message: 'Industry request rejected.' });
  } catch (error) {
    console.error('Error rejecting industry:', error);
    res.status(500).json({ error: 'Failed to reject industry.' });
  }
});

// Admin Get All Approved Industries
app.get('/api/admin/industries', authenticateToken, async (req, res) => {
  try {
    const { data: industries, error } = await supabase
      .from('setups')
      .select('*')
      .order('createdat', { ascending: false });

    if (error) throw error;
    
    // Fetch users from Auth (for new industries)
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    
    // Fetch users from custom users table (for legacy industries)
    const { data: legacyUsers } = await supabase.from('users').select('_id, email');
    
    // Fetch passwords from industry_management table
    const { data: imData } = await supabase
      .from('industry_management')
      .select('email_id, password');

    // Transform data
    const formatted = industries.map(ind => {
      // Try to find email in Auth users first, then legacy users
      const authUser = authUsers?.users?.find(u => u.id === ind.user_id);
      const legacyUser = legacyUsers?.find(u => u._id === ind.user_id);
      const email = authUser?.email || legacyUser?.email || 'N/A';
      
      const imRecord = imData?.find(im => im.email_id === email);
      
      return {
        ...ind,
        _id: ind._id,
        user_id: ind.user_id,
        email: email,
        password: imRecord?.password || '••••••••',
        industryName: ind.plantname || 'Unnamed Plant',
        location: ind.location || 'N/A',
        industryType: ind.industrytype || 'N/A',
        capacity: ind.dailycapacity || 0,
        status: ind.completed ? 'Active' : 'Pending',
        createdAt: ind.createdat
      };
    });

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching industries:', error);
    res.status(500).json({ error: 'Failed to fetch industries.' });
  }
});

// Admin Update Industry Settings
app.put('/api/admin/industries/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params; // setups._id
    const { password, user_id, setupData } = req.body;

    if (setupData) {
      const allowedColumns = [
        'industrytype', 'plantscale', 'processtype', 'plantname', 'location', 
        'dailycapacity', 'ctolimit', 'monthlyctolimit', 'reusetarget', 
        'monitoringfrequency', 'shifttimings', 'workingdays', 'units', 
        'watersource', 'benchmark', 'alertsensitivity', 'notifications', 
        'aimonitoring', 'compliancealerts', 'sustainabilityreports', 'ctovalidity'
      ];
      
      const lowerCaseSetupData = Object.fromEntries(
        Object.entries(setupData)
          .map(([k, v]) => [k.toLowerCase(), v])
          .filter(([k]) => allowedColumns.includes(k))
      );

      // We explicitly check industryname -> plantname if we passed it in setupData
      if (setupData.industryName) {
        lowerCaseSetupData.plantname = setupData.industryName;
      }

      if (Object.keys(lowerCaseSetupData).length > 0) {
        const { error: setupError } = await supabase
          .from('setups')
          .update(lowerCaseSetupData)
          .eq('_id', id);
        if (setupError) throw setupError;
      }
    }

    // Update password in users table if provided
    if (password && user_id) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const { error: userError } = await supabase
        .from('users')
        .update({ password: hashedPassword })
        .eq('_id', user_id);
      if (userError) throw userError;
    }

    res.json({ success: true, message: 'Industry settings updated successfully' });
  } catch (error) {
    console.error('Error updating industry:', error);
    res.status(500).json({ error: 'Failed to update industry settings' });
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
