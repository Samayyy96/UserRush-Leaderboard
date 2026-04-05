require('dotenv').config();
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const { createClient } = require('@supabase/supabase-js');
const { GoogleAuth } = require('google-auth-library');

const app = express();
app.use(cors());
app.use(express.json());

// 1. Initialize Firebase Admin
if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
  console.error("MISSING FIREBASE CONFIGURATION IN .env");
} else {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Handle newline escaping from env variables
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    })
  });
}

// 2. Initialize Supabase Admin Client
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.error("MISSING SUPABASE CONFIGURATION IN .env");
}

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || 'placeholder'
);

// Allowed email validation Regex
const emailRegex = /@iiitl\.ac\.in$/;

// Admin emails allowed to whitelist
const ADMIN_EMAILS = [
  'admin@iiitl.ac.in',
  'lcs2024016@iiitl.ac.in',
  'lcs2024013@iiitl.ac.in',
  'lcs2024005@iiitl.ac.in',
];

// Admin Middleware
const verifyAdmin = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header.' });
  }

  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const email = decodedToken.email;

    if (!email || !ADMIN_EMAILS.includes(email.toLowerCase())) {
      return res.status(403).json({ error: 'Forbidden: Admin access required.' });
    }
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error("Admin verification failed:", error);
    return res.status(401).json({ error: 'Invalid authentication token.' });
  }
};

// Helper: Get OAuth2 access token from service account
async function getAccessToken() {
  const auth = new GoogleAuth({
    credentials: {
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });
  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  return tokenResponse.token;
}

// Endpoint: Get Whitelisted Domains
app.get('/admin/domains', verifyAdmin, async (req, res) => {
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const token = await getAccessToken();
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/admin/v2/projects/${projectId}/config`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await response.json();
    if (!response.ok) throw new Error(JSON.stringify(data));
    return res.status(200).json({ domains: data.authorizedDomains || [] });
  } catch (error) {
    console.error('Failed to fetch project config:', error);
    return res.status(500).json({ error: 'Failed to fetch authorized domains.' });
  }
});

// Endpoint: Add Whitelisted Domain
app.post('/admin/whitelist', verifyAdmin, async (req, res) => {
  try {
    let { domain } = req.body;
    if (!domain || typeof domain !== 'string') {
      return res.status(400).json({ error: 'A valid domain string is required.' });
    }

    // Clean the domain (remove http/https and trailing slashes)
    domain = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const token = await getAccessToken();

    // Fetch current config
    const getRes = await fetch(
      `https://identitytoolkit.googleapis.com/admin/v2/projects/${projectId}/config`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const currentConfig = await getRes.json();
    if (!getRes.ok) throw new Error(JSON.stringify(currentConfig));

    const currentDomains = currentConfig.authorizedDomains || [];
    if (currentDomains.includes(domain)) {
      return res.status(400).json({ error: 'Domain is already whitelisted.' });
    }

    const updatedDomains = [...currentDomains, domain];

    // Patch with updated domains
    const patchRes = await fetch(
      `https://identitytoolkit.googleapis.com/admin/v2/projects/${projectId}/config?updateMask=authorizedDomains`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ authorizedDomains: updatedDomains }),
      }
    );
    const patchData = await patchRes.json();
    if (!patchRes.ok) throw new Error(JSON.stringify(patchData));

    return res.status(200).json({
      message: `Successfully whitelisted ${domain}`,
      domains: updatedDomains,
    });
  } catch (error) {
    console.error('Failed to update project config:', error);
    return res.status(500).json({ error: 'Failed to whitelist domain.' });
  }
});

// Healthcheck
app.get('/', (req, res) => {
  res.send('Game User Tracking API is Running');
});

// Endpoint: Track User
app.post('/track-user', async (req, res) => {
  try {
    const { idToken, gameId } = req.body;

    if (!idToken || !gameId) {
      return res.status(400).json({ error: 'Missing idToken or gameId in request body.' });
    }

    // Step 1: Verify the Firebase token unconditionally via Admin SDK
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const email = decodedToken.email;

    if (!email) {
      return res.status(400).json({ error: 'No email address associated with this token.' });
    }

    // Step 2: Validate the email regex format
    if (!emailRegex.test(email)) {
      return res.status(403).json({
        error: 'Unauthorized: Invalid email domain. Please login using your @iiitl.ac.in email.'
      });
    }

    // Step 3: Insert valid user to database
    // "game_users" needs a composite UNIQUE index on (email, game_id)
    const { data, error } = await supabase
      .from('game_users')
      .insert([{ email, game_id: gameId }]);

    // Step 4: Handle database response
    if (error) {
      // Postgres unique constraint violation code is '23505'
      if (error.code === '23505') {
        return res.status(200).json({
          message: 'User already tracked for this game.',
          status: 'success'
        });
      }
      console.error("Database Insert Error:", error);
      return res.status(500).json({ error: 'Failed to insert user due to database error.' });
    }

    return res.status(200).json({ message: 'User tracked successfully.', status: 'success' });

  } catch (error) {
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ error: 'The provided authentication token has expired. Please log in again.' });
    }
    console.error("Token verification failed:", error);
    return res.status(401).json({ error: 'Invalid authentication token.' });
  }
});

// Endpoint: Get Leaderboard
app.get('/leaderboard', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('game_users')
      .select('game_id');

    if (error) {
      console.error("Leaderboard fetch error:", error);
      return res.status(500).json({ error: 'Failed to access database.' });
    }

    // Map-reduce count
    const counts = {};
    for (const row of data) {
      const gid = row.game_id;
      counts[gid] = (counts[gid] || 0) + 1;
    }

    // Convert into sorted array for UI
    const leaderboard = Object.keys(counts).map(gameId => ({
      gameId,
      users: counts[gameId]
    })).sort((a, b) => b.users - a.users); // descending by users

    return res.status(200).json({ leaderboard });
  } catch (err) {
    console.error("Unexpected error:", err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.post('/submit-project', async (req, res) => {
  try {
    const { rollNo, gameLink } = req.body;

    if (!rollNo || !gameLink) {
      return res.status(400).json({
        error: 'Missing fields'
      });
    }

    const { error } = await supabase
      .from('projects')
      .insert([
        {
          roll_no: rollNo,
          game_link: gameLink
        }
      ]);

    if (error) {
      return res.status(500).json(error);
    }

    res.json({
      message: 'Project submitted successfully'
    });

  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});


app.get('/projects', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('roll_no', { ascending: true });

    if (error) {
      console.error("Projects fetch error:", error);

      return res.status(500).json({
        error: error.message
      });
    }

    res.json(data);

  } catch (err) {
    console.error("Projects route crash:", err);

    res.status(500).json({
      error: err.message
    });
  }
});



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(` Backend Server initialized on port ${PORT}`);
});