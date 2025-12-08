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

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

// Logging helper function
function log(type, message, data = '') {
  const timestamp = new Date().toLocaleTimeString();
  let prefix = '';
  
  switch(type) {
    case 'success':
      prefix = `${colors.green}✓${colors.reset}`;
      break;
    case 'error':
      prefix = `${colors.red}✗${colors.reset}`;
      break;
    case 'info':
      prefix = `${colors.blue}ℹ${colors.reset}`;
      break;
    case 'warning':
      prefix = `${colors.yellow}⚠${colors.reset}`;
      break;
    case 'api':
      prefix = `${colors.magenta}→${colors.reset}`;
      break;
    default:
      prefix = '→';
  }
  
  const logMessage = `${prefix} [${timestamp}] ${message}`;
  console.log(logMessage);
  if (data) console.log(`  ${colors.cyan}${JSON.stringify(data)}${colors.reset}`);
}

// Generate random token
function generateToken() {
  return Math.random().toString(36).substr(2, 30);
}

// Middleware to log all API requests
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    log('api', `${colors.bright}${req.method}${colors.reset} ${colors.magenta}${req.path}${colors.reset}`);
  }
  next();
});

// Middleware to verify Bearer token
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    log('error', 'Token verification failed: Missing Authorization header');
    return res.status(401).json({ error: 'Authorization header required' });
  }

  // Extract token from "Bearer <token>"
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    log('error', 'Token verification failed: Invalid Authorization format (use "Bearer <token>")', { received: authHeader.substring(0, 20) + '...' });
    return res.status(401).json({ error: 'Invalid Authorization format. Use "Bearer <token>"' });
  }

  const token = parts[1];
  log('info', `Token verification attempt`, { token: token.substring(0, 10) + '...' });
  
  if (!tokens.has(token)) {
    log('error', 'Token verification failed: Invalid or expired token', { token: token.substring(0, 10) + '...', validTokens: tokens.size });
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  
  log('success', 'Token verified successfully', { token: token.substring(0, 10) + '...' });
  req.token = token;
  next();
}

// Login API
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  log('info', 'LOGIN ATTEMPT', { username, password: password ? '***' : 'none' });
  
  if (!username || !password) {
    log('warning', 'Login failed: Missing credentials', { username: username || 'empty', password: password ? 'provided' : 'empty' });
    return res.status(400).json({ error: 'Username and password required' });
  }
  
  if (users[username] && users[username] === password) {
    const token = generateToken();
    tokens.add(token);
    
    log('success', `LOGIN SUCCESS`, { username, token: token.substring(0, 15) + '...', totalActiveTokens: tokens.size });
    
    return res.json({
      success: true,
      token: token,
      tokenType: 'Bearer',
      message: 'Login successful',
      instructions: `Use this token in Authorization header: Bearer ${token.substring(0, 15)}...`
    });
  }
  
  log('error', `LOGIN FAILED: Invalid credentials`, { username });
  res.status(401).json({ error: 'Invalid credentials' });
});

// Get cities API
app.get('/api/cities', verifyToken, (req, res) => {
  log('info', 'FETCHING CITIES', { count: cities.length });
  res.json({ cities: cities });
  log('success', 'Cities sent to client');
});

// Get flights API
app.post('/api/flights', verifyToken, (req, res) => {
  const { fromCity, toCity } = req.body;
  
  log('info', 'FLIGHT SEARCH INITIATED', { fromCity, toCity });
  
  if (!fromCity || !toCity) {
    log('warning', 'Flight search failed: Missing cities', { fromCity: fromCity || 'empty', toCity: toCity || 'empty' });
    return res.status(400).json({ error: 'From and To cities required' });
  }
  
  if (fromCity === toCity) {
    log('warning', 'Flight search failed: Same cities selected', { city: fromCity });
    return res.status(400).json({ error: 'From and To cities cannot be same' });
  }
  
  log('success', 'FLIGHTS FOUND', { count: flights.length, route: `${fromCity} → ${toCity}` });
  res.json({ flights: flights });
});

// Payment API
app.post('/api/payment', verifyToken, (req, res) => {
  const { cardNumber, cvv, cardName, flightId, fromCity, toCity } = req.body;
  
  log('info', 'PAYMENT INITIATED', { 
    cardNumber: cardNumber ? cardNumber.substring(0, 4) + '****' : 'none',
    cvv: cvv ? '***' : 'none',
    cardName,
    flightId
  });
  
  if (!cardNumber || !cvv || !cardName || !flightId) {
    log('warning', 'Payment failed: Missing payment details');
    return res.status(400).json({ error: 'All payment details required' });
  }
  
  if (cardNumber.length !== 12 || isNaN(cardNumber)) {
    log('error', 'Payment failed: Invalid card number', { cardNumberLength: cardNumber.length });
    return res.status(400).json({ error: 'Card number must be 12 digits' });
  }
  
  if (cvv.length !== 3 || isNaN(cvv)) {
    log('error', 'Payment failed: Invalid CVV', { cvvLength: cvv.length });
    return res.status(400).json({ error: 'CVV must be 3 digits' });
  }
  
  const flight = flights.find(f => f.id == flightId);
  if (!flight) {
    log('error', 'Payment failed: Invalid flight', { flightId });
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
  
  log('success', 'PAYMENT SUCCESSFUL & BOOKING CREATED', {
    bookingId,
    passenger: cardName,
    flight: flight.number,
    route: `${fromCity} → ${toCity}`,
    seat: bookingData.seatNumber
  });
  
  res.json({
    success: true,
    booking: bookingData,
    message: 'Payment successful'
  });
});

// Logout API
app.post('/api/logout', verifyToken, (req, res) => {
  const token = req.token;
  tokens.delete(token);
  
  log('success', 'LOGOUT SUCCESSFUL', { 
    tokensActive: tokens.size,
    token: token.substring(0, 10) + '...'
  });
  
  res.json({ success: true, message: 'Logout successful' });
});

// Serve login page
app.get('/', (req, res) => {
  log('info', 'Home page requested');
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log('\n');
  console.log(`${colors.green}${colors.bright}✈️  AIRLINE BOOKING SERVER STARTED${colors.reset}`);
  console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.cyan}Server: http://localhost:${PORT}${colors.reset}`);
  console.log(`${colors.cyan}Test User 1: user1 / password123${colors.reset}`);
  console.log(`${colors.cyan}Test User 2: user2 / pass456${colors.reset}`);
  console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.yellow}Token Format: Bearer <token>${colors.reset}`);
  console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
  log('success', 'Server is ready to accept requests');
});