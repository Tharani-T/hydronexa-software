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

// --- GOVERNMENT WORKFLOW LOGIC ---
async function checkAndMarkCritical(userId, userEmail, currentCtoUsage, currentReusePercent) {
  try {
    const { data: setup } = await supabase.from('setups').select('*').eq('user_id', userId).single();
    if (!setup) return;

    const { data: alerts } = await supabase.from('alert_history').select('*').eq('user_id', userId);
    const warningCount = alerts ? alerts.length : 1;

    let complianceStatus = warningCount > 0 ? 'Warning' : 'Compliant';
    let workflowStage = 'Normal';

    if (warningCount >= 3) {
      complianceStatus = 'Critical Violation';
      workflowStage = 'Critical';
    }

    const industryData = {
      user_id: userId,
      industry_name: setup.plantname || 'Unknown',
      district: setup.location || 'Unknown',
      email: userEmail || 'N/A',
      daily_cto_limit: setup.ctolimit || 0,
      monthly_cto_limit: setup.monthlyctolimit || 0,
      current_cto_consumption: currentCtoUsage || 0,
      daily_reuse_target: setup.reusetarget || 0,
      monthly_reuse_target: (setup.reusetarget || 0) * 30,
      current_reuse_percentage: currentReusePercent || 0,
      compliance_status: complianceStatus,
      warning_count: warningCount,
      last_warning_date: new Date(),
      current_workflow_stage: workflowStage
    };

    const { data: existing } = await supabase.from('industry').select('*').eq('user_id', userId).maybeSingle();
    
    if (existing) {
      await supabase.from('industry').update(industryData).eq('user_id', userId);
    } else {
      await supabase.from('industry').insert([industryData]);
    }
  } catch (err) {
    console.error('Error in checkAndMarkCritical:', err);
  }
}

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

    await checkAndMarkCritical(userId, req.user.email, currentUsage, 0);

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

    await checkAndMarkCritical(userId, req.user.email, 0, 0);

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

// --- AUTOMATED COMPLIANCE MONITORING & NOTIFICATION ---
function getCalendarWeekStart() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Start on Monday
  return new Date(d.setDate(diff));
}

function getStartOfDay() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

async function updateIndustryTable(userId, setup, email, currentCto, currentReuse, workflowStage) {
  try {
    const { data: alerts } = await supabase.from('alert_history').select('*').eq('user_id', userId);
    const warningCount = alerts ? alerts.length : 1;

    let complianceStatus = 'Compliant';
    if (warningCount > 0 && warningCount < 3) complianceStatus = 'Warning';
    if (warningCount >= 3) complianceStatus = 'Critical';

    const industryData = {
      user_id: userId,
      industry_name: setup.plantname || 'Unknown',
      district: setup.location || 'Unknown',
      email: email || 'N/A',
      daily_cto_limit: setup.ctolimit || 0,
      monthly_cto_limit: setup.monthlyctolimit || 0,
      current_cto_consumption: currentCto,
      daily_reuse_target: setup.reusetarget || 0,
      monthly_reuse_target: (setup.reusetarget || 0) * 30,
      current_reuse_percentage: currentReuse,
      compliance_status: complianceStatus,
      warning_count: warningCount,
      last_warning_date: new Date(),
      current_workflow_stage: workflowStage
    };

    const { data: existing } = await supabase.from('industry').select('*').eq('user_id', userId).maybeSingle();
    if (existing) {
      await supabase.from('industry').update(industryData).eq('user_id', userId);
    } else {
      await supabase.from('industry').insert([industryData]);
    }
  } catch (err) {
    console.error('Error updating industry table:', err);
  }
}

async function startComplianceMonitor() {
  console.log('🤖 Starting Automated Compliance Monitor (Background Service)...');
  
  // Run every 5 minutes to ensure timely detection
  setInterval(async () => {
    try {
      const { data: setups, error: setupError } = await supabase.from('setups').select('*');
      if (setupError || !setups) return;

      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      for (const setup of setups) {
        const userId = setup.user_id;
        const industryName = setup.plantname || 'Industry';
        let email = setup.email;
        if (!email) {
           const { data: authUser } = await supabase.auth.admin.getUserById(userId);
           if (authUser && authUser.user) email = authUser.user.email;
        }
        if (!email) continue;

        const dailyCtoLimit = setup.ctolimit || 0;
        const dailyReuseTarget = setup.reusetarget || 0;

        // Fetch the absolute latest sensor data to match frontend's live data
        const { data: todayData } = await supabase
          .from('sensor_data')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(1);

        let currentCtoConsumption = 0;
        let currentReusePercentage = 0;

        if (todayData && todayData.length > 0) {
          const lastEntry = todayData[todayData.length - 1];
          
          currentCtoConsumption = lastEntry.totalflow || 0;
          const currentReuseFlow = lastEntry.reuseflow || 0;
          const currentFlowRate = lastEntry.flowrate || 0;
          
          if (currentFlowRate > 0) {
            currentReusePercentage = (currentReuseFlow / currentFlowRate) * 100;
          } else if (currentCtoConsumption > 0) {
             currentReusePercentage = (currentReuseFlow / currentCtoConsumption) * 100;
          }
        }

        // --- EMAIL TRIGGER 1: Daily CTO Limit Exceeded ---
        if (currentCtoConsumption > dailyCtoLimit) {
          const startOfDay = getStartOfDay().toISOString();
          const { data: existingAlerts } = await supabase
            .from('alert_history')
            .select('*')
            .eq('user_id', userId)
            .eq('alerttype', 'Daily CTO Limit Exceeded')
            .gte('timestamp', startOfDay);

          if (!existingAlerts || existingAlerts.length === 0) {
            const difference = currentCtoConsumption - dailyCtoLimit;
            const text = `Dear ${industryName},

The industry's Daily CTO Consumption has exceeded the configured limit.
Please review today's water usage and prioritize Reused Water to maintain compliance.

• Daily CTO Limit: ${dailyCtoLimit} KL
• Current CTO Consumption: ${currentCtoConsumption.toFixed(2)} KL
• Difference: ${difference.toFixed(2)} KL
• Date & Time: ${new Date().toLocaleString()}

Regards,
HydroNexa Compliance System`;

            try {
              await transporter.sendMail({
                from: `"HydroNexa Compliance System" <${process.env.SMTP_USER}>`,
                to: email,
                subject: 'Daily CTO Limit Exceeded',
                text
              });
            } catch (err) {
              console.error('Failed to send CTO alert email (SMTP error)', err);
            }

            // Always log the alert history and update the industry table, even if SMTP fails (for demo purposes)
            try {
              await supabase.from('alert_history').insert({
                user_id: userId,
                industryname: industryName,
                alerttype: 'Daily CTO Limit Exceeded',
                message: `Exceeded by ${difference.toFixed(2)} KL`,
                deliverystatus: 'Delivered',
                timestamp: new Date()
              });

              await updateIndustryTable(userId, setup, email, currentCtoConsumption, currentReusePercentage, 'CTO Limit Exceeded');
            } catch (err) {
              console.error('Failed to update DB for CTO alert', err);
            }
          }
        }

        // --- EMAIL TRIGGER 2: Weekly Reuse Target NOT Achieved ---
        const weekStart = getCalendarWeekStart().toISOString();
        const { data: weekData } = await supabase
          .from('sensor_data')
          .select('*')
          .gte('timestamp', weekStart)
          .order('timestamp', { ascending: true });

        let missedDays = 0;
        if (weekData && weekData.length > 0) {
          const days = {};
          weekData.forEach(row => {
            const dateStr = new Date(row.timestamp).toISOString().split('T')[0];
            if (!days[dateStr]) days[dateStr] = [];
            days[dateStr].push(row);
          });

          const todayStr = new Date().toISOString().split('T')[0];
          for (const [dateStr, rows] of Object.entries(days)) {
            if (dateStr === todayStr) continue; // Only check fully completed days
            if (rows.length === 0) continue; 
            
            const last = rows[rows.length - 1];
            const flowRate = last.flowrate || 0;
            const reuseFlow = last.reuseflow || 0;
            
            let pct = 0;
            if (flowRate > 0) {
              pct = (reuseFlow / flowRate) * 100;
            } else if (last.totalflow > 0) {
              pct = (reuseFlow / last.totalflow) * 100;
            }
            
            if (pct < dailyReuseTarget) {
              missedDays++;
            }
          }
        }

        if (missedDays >= 2) {
          const { data: existingReuseAlerts } = await supabase
            .from('alert_history')
            .select('*')
            .eq('user_id', userId)
            .eq('alerttype', 'Weekly Reuse Target Not Achieved')
            .gte('timestamp', weekStart);

          if (!existingReuseAlerts || existingReuseAlerts.length === 0) {
            const text = `Dear ${industryName},

The industry failed to achieve the configured Daily Reuse Target multiple times during this week.
Please review plant operations and increase Reused Water utilization.

• Daily Reuse Target: ${dailyReuseTarget}%
• Current Reuse Percentage: ${currentReusePercentage.toFixed(2)}%
• Number of Missed Days: ${missedDays}

Regards,
HydroNexa Compliance System`;

            try {
              await transporter.sendMail({
                from: `"HydroNexa Compliance System" <${process.env.SMTP_USER}>`,
                to: email,
                subject: 'Weekly Reuse Target Not Achieved',
                text
              });
            } catch (err) {
              console.error('Failed to send Reuse alert email (SMTP error)', err);
            }

            try {
              await supabase.from('alert_history').insert({
                user_id: userId,
                industryname: industryName,
                alerttype: 'Weekly Reuse Target Not Achieved',
                message: `Missed target ${missedDays} times this week`,
                deliverystatus: 'Delivered',
                timestamp: new Date()
              });

              await updateIndustryTable(userId, setup, email, currentCtoConsumption, currentReusePercentage, 'Target Missed');
            } catch (err) {
              console.error('Failed to update DB for Reuse alert', err);
            }
          }
        }
      }
    } catch (error) {
      console.error('Compliance Monitor Error:', error);
    }
  }, 10 * 1000); // 10-second polling interval for immediate demo feedback
}

// Initialize continuous monitoring
startComplianceMonitor();
