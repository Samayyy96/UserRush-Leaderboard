const fetch = require('node-fetch');

// We don't have a token here, so we will test the public /leaderboard endpoint.
// For admin endpoints, we'd need a Firebase Auth token.

async function testLeaderboard() {
  try {
    const res = await fetch('http://localhost:3000/leaderboard');
    const data = await res.json();
    console.log('Leaderboard (should be empty if nothing approved):', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Leaderboard fetch failed:', err.message);
  }
}

testLeaderboard();
