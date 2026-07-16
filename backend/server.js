const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();

// Enable CORS for GitHub Pages requests
app.use(cors({
  origin: ['https://azmarshallese.github.io', 'http://localhost:3000'],
  methods: ['POST', 'GET'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Analytics endpoint
app.post('/api/analytics', (req, res) => {
  try {
    const event = req.body;

    // Create filename based on event type and date
    const date = event.date || new Date().toLocaleDateString('en-US').replace(/\//g, '-');
    const filename = `${event.event}_${date}.json`;
    const filepath = path.join(dataDir, filename);

    // Read existing data or create new array
    let data = [];
    if (fs.existsSync(filepath)) {
      const existing = fs.readFileSync(filepath, 'utf-8');
      data = JSON.parse(existing);
    }

    // Add new event
    data.push({
      ...event,
      receivedAt: new Date().toISOString()
    });

    // Save to file
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));

    res.json({ success: true, message: 'Analytics recorded' });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Analytics server running on port ${PORT}`);
});
