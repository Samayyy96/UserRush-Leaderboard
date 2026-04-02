require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require("jsonwebtoken");
const jwksClient = require("jwks-rsa");
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

// 1. Initialize Firebase Admin
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.error("MISSING SUPABASE CONFIGURATION IN .env");
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

const client = jwksClient({
  jwksUri: `${process.env.SUPABASE_URL}/auth/v1/keys`,
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, function (err, key) {
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}


const verifySupabaseToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  jwt.verify(token, getKey, {}, (err, decoded) => {
    if (err) {
      console.error("JWT Error:", err);
      return res.status(401).json({ error: "Invalid token" });
    }

    req.user = decoded;
    next();
  });
};


// Healthcheck
app.get('/', (req, res) => {
  res.send('Game User Tracking API is Running');
});

// Endpoint: Track User
app.post('/track-user', verifySupabaseToken, async (req, res) => {
  try {
    const { gameId } = req.body;
    const email = req.user.email;

    if (!gameId) {
      return res.status(400).json({ error: 'Missing gameId in request body.' });
    }

    if (!email) {
      return res.status(400).json({ error: 'No email found in token.' });
    }

    // Validate institute email
    if (!emailRegex.test(email)) {
      return res.status(403).json({ 
        error: 'Unauthorized: Use your @iiitl.ac.in email.' 
      });
    }

    // Insert into DB
    const { error } = await supabase
      .from('game_users')
      .insert([{ email, game_id: gameId }]);

    if (error) {
      if (error.code === '23505') {
        return res.status(200).json({ 
          message: 'User already tracked for this game.', 
          status: 'success' 
        });
      }
      console.error("Database Insert Error:", error);
      return res.status(500).json({ error: 'Database error.' });
    }

    return res.status(200).json({ 
      message: 'User tracked successfully.', 
      status: 'success' 
    });

  } catch (error) {
    console.error("Unexpected error:", error);
    return res.status(500).json({ error: 'Internal server error' });
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
  console.log( ` Backend Server initialized on port ${PORT}`);
});