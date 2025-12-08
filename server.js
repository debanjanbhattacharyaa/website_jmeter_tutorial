const express = require('express');
const path = require('path');
const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory storage (for demo purposes)
const users = {
  'user1': 'password123',
  'user2': 'pass456'
};

const tokens = new Set();

const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Miami', 'Seattle', 'Boston'];

const flights = [
  { id: 1, number: 'AI101', name: 'Indigo Express', time: '10:30 AM', price: 5000 },
  { id: 2, number: 'AI202', name: 'Air India Premier', time: '02:00 PM', price: 7500 },
  { id: 3, number: 'SP303', name: 'SpiceJet Direct', time: '04:15 PM', price: 4500 },
  { id: 4, number: 'GO404', name: 'GoAir Classic', time: '06:45 PM', price: 3500 },
  { id: 5, number: 'AK505', name: 'AirAsia Value', time: '08:30 PM', price: 3000 }
];

const bookings = {};

// Generate random token
function generateToken() {
  return 'token_' + Math.random().toString(36).substr(2, 20);
}

// Middleware to verify token
function verifyToken(req, res, next) {
  const token = req.headers['authorization'];
  
  if (!token || !tokens.has(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  next();
}

// Login API
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  
  if (users[username] && users[username] === password) {
    const token = generateToken();
    tokens.add(token);
    
    return res.json({
      success: true,
      token: token,
      message: 'Login successful'
    });
  }
  
  res.status(401).json({ error: 'Invalid credentials' });
});

// Get cities API
app.get('/api/cities', verifyToken, (req, res) => {
  res.json({ cities: cities });
});

// Get flights API
app.post('/api/flights', verifyToken, (req, res) => {
  const { fromCity, toCity } = req.body;
  
  if (!fromCity || !toCity) {
    return res.status(400).json({ error: 'From and To cities required' });
  }
  
  if (fromCity === toCity) {
    return res.status(400).json({ error: 'From and To cities cannot be same' });
  }
  
  res.json({ flights: flights });
});

// Payment API
app.post('/api/payment', verifyToken, (req, res) => {
  const { cardNumber, cvv, cardName, flightId, fromCity, toCity } = req.body;
  
  if (!cardNumber || !cvv || !cardName || !flightId) {
    return res.status(400).json({ error: 'All payment details required' });
  }
  
  if (cardNumber.length !== 12 || isNaN(cardNumber)) {
    return res.status(400).json({ error: 'Card number must be 12 digits' });
  }
  
  if (cvv.length !== 3 || isNaN(cvv)) {
    return res.status(400).json({ error: 'CVV must be 3 digits' });
  }
  
  const flight = flights.find(f => f.id == flightId);
  if (!flight) {
    return res.status(400).json({ error: 'Invalid flight' });
  }
  
  // Generate booking ID
  const bookingId = 'BK' + Math.random().toString(36).substr(2, 9).toUpperCase();
  const bookingData = {
    bookingId,
    passenger: cardName,
    flight: flight,
    fromCity,
    toCity,
    bookingDate: new Date().toISOString(),
    seatNumber: 'A' + Math.floor(Math.random() * 30 + 1)
  };
  
  bookings[bookingId] = bookingData;
  
  res.json({
    success: true,
    booking: bookingData,
    message: 'Payment successful'
  });
});

// Logout API
app.post('/api/logout', verifyToken, (req, res) => {
  const token = req.headers['authorization'];
  tokens.delete(token);
  
  res.json({ success: true, message: 'Logout successful' });
});

// Serve login page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Test credentials: username="user1", password="password123"');
});