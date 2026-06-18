const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 8080;
const LEADS_FILE = path.join(__dirname, 'leads.json');

// Middleware to parse JSON and form submissions
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS for all requests (including local file origins)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Serve static landing page files with caching disabled
app.use(express.static(__dirname, {
  etag: false,
  maxAge: 0,
  setHeaders: (res, filepath) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
}));

// Signup API Endpoint to save lead data to leads.json
app.post('/api/signup', (req, res) => {
  const { name, email, relation, phone, parentCity } = req.body;

  if (!name || !email || !relation || !phone || !parentCity) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const newLead = {
    name,
    email,
    relation,
    phone,
    parentCity,
    submittedAt: new Date().toISOString()
  };

  // Read existing leads
  fs.readFile(LEADS_FILE, 'utf8', (err, data) => {
    let leadsList = [];

    if (!err && data) {
      try {
        leadsList = JSON.parse(data);
      } catch (parseErr) {
        console.error('Error parsing leads file, resetting list:', parseErr);
      }
    }

    // Append new lead
    leadsList.push(newLead);

    // Save back to leads.json
    fs.writeFile(LEADS_FILE, JSON.stringify(leadsList, null, 2), 'utf8', (writeErr) => {
      if (writeErr) {
        console.error('Failed to write leads file:', writeErr);
        return res.status(500).json({ error: 'Failed to save information' });
      }

      console.log(`[Success] Saved new lead: ${email} (${phone})`);
      return res.json({ success: true });
    });
  });
});

// Get all leads from leads.json
app.get('/api/leads', (req, res) => {
  fs.readFile(LEADS_FILE, 'utf8', (err, data) => {
    if (err || !data) {
      return res.json([]);
    }
    try {
      const leadsList = JSON.parse(data);
      return res.json(leadsList);
    } catch (parseErr) {
      console.error('Error parsing leads file:', parseErr);
      return res.json([]);
    }
  });
});

// Start express server
app.listen(PORT, () => {
  console.log(`HealthBridges server is running at http://localhost:${PORT}`);
  console.log(`Leads will be saved locally to: ${LEADS_FILE}`);
});
