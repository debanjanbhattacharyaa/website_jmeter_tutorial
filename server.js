// server.js

const express = require('express');
const path = require('path');
const fs = require('fs'); // Added fs for file reading
const app = express();
const port = 3000;

// --- Simulated Data & State ---
const sessions = {}; 
const availableFlights = [
    { number: 'AA101', name: 'Eagle Air', price: 450, time: '08:00 AM' },
    { number: 'BA256', name: 'Global Wings', price: 620, time: '11:30 AM' },
    { number: 'DL890', name: 'Sky High', price: 510, time: '02:45 PM' },
];

function generateToken() {
    return 'token_' + Math.random().toString(36).substring(2, 15);
}

// --- Middleware Setup ---
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

// --- Authentication Middleware ---
function requireAuth(req, res, next) {
    const token = req.query.token;
    if (!token || !sessions[token]) {
        return res.redirect('/');
    }
    req.sessionToken = token;
    req.bookingState = sessions[token];
    next();
}

// --- Helper Function for Rendering HTML Templates ---
app.response.renderTemplate = function(fileName, token) {
    const filePath = path.join(__dirname, 'views', fileName);
    let html = fs.readFileSync(filePath, 'utf8');
    
    // Inject common links and token
    const homeUrl = token ? `/home?token=${token}` : '/';
    const signOutUrl = token ? `/api/signout?token=${token}` : '/';

    html = html.replace(/{{ TOKEN }}/g, token || '');
    html = html.replace(/{{ HOME_URL }}/g, homeUrl);
    html = html.replace(/{{ SIGNOUT_URL }}/g, signOutUrl);
    
    // Inject specific session data
    if (token) {
        const state = sessions[token];
        
        if (state.flights) {
             const flightJson = JSON.stringify(state.flights).replace(/'/g, "\\'");
             html = html.replace('{{ FLIGHT_DATA_JSON }}', flightJson);
             html = html.replace('{{ ROUTE_SUMMARY }}', `${state.fromCity} to ${state.toCity}`);
        }

        if (state.selectedFlight) {
            html = html.replace('{{ PRICE }}', state.selectedFlight.price);
        }

        if (state.pnr) {
            html = html.replace('{{ PNR }}', state.pnr);
            html = html.replace('{{ PASSENGER_NAME }}', state.cardName);
            html = html.replace('{{ FLIGHT_NUMBER }}', state.selectedFlight.number);
            html = html.replace('{{ ROUTE }}', `${state.fromCity} to ${state.toCity}`);
            html = html.replace('{{ DEPARTURE_TIME }}', state.selectedFlight.time);
            
            // ✅ NEW: Inject the entire booking state as a pretty-printed JSON string
            const fullBookingJson = JSON.stringify(state, null, 2);
            // Escape any special characters (like <, >) to ensure it renders correctly inside <pre> tags
            html = html.replace('{{ FULL_BOOKING_JSON }}', fullBookingJson.replace(/</g, "&lt;").replace(/>/g, "&gt;"));
        }
    }

    this.send(html);
};

// =======================================================================
//                           API ROUTING 
// =======================================================================

// All routes rely on query parameter tokens or redirects.

app.get('/', (req, res) => res.renderTemplate('login.html'));

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'user' && password === 'pass') {
        const newToken = generateToken();
        sessions[newToken] = {};
        return res.redirect(`/home?token=${newToken}`);
    }
    res.redirect('/?error=invalid');
});

app.get('/home', requireAuth, (req, res) => res.renderTemplate('home.html', req.sessionToken));

app.post('/api/search-flights', requireAuth, (req, res) => {
    const { fromCity, toCity } = req.body;
    
    req.bookingState.fromCity = fromCity;
    req.bookingState.toCity = toCity;
    req.bookingState.flights = availableFlights; 

    // FIX: Token is guaranteed to be present here by requireAuth
    res.redirect(`/select-flight?token=${req.sessionToken}`); 
});

app.get('/select-flight', requireAuth, (req, res) => {
    if (!req.bookingState.fromCity) return res.redirect(`/home?token=${req.sessionToken}`);
    res.renderTemplate('select_flight.html', req.sessionToken);
});

app.post('/api/select-flight', requireAuth, (req, res) => {
    const selectedFlightNumber = req.body.flightNumber;
    const selectedFlight = availableFlights.find(f => f.number === selectedFlightNumber);
    
    if (selectedFlight) {
        req.bookingState.selectedFlight = selectedFlight;
        return res.redirect(`/payment?token=${req.sessionToken}`);
    }
    res.redirect(`/select-flight?token=${req.sessionToken}`);
});

app.get('/payment', requireAuth, (req, res) => {
    if (!req.bookingState.selectedFlight) return res.redirect(`/select-flight?token=${req.sessionToken}`);
    res.renderTemplate('payment.html', req.sessionToken);
});

app.post('/api/pay', requireAuth, (req, res) => {
    const { cardNumber, cvv, cardName } = req.body;
    
    if (cardNumber && cardNumber.length === 12 && cvv && cvv.length === 3 && cardName) {
        req.bookingState.pnr = Math.random().toString(36).substring(2, 8).toUpperCase();
        req.bookingState.cardName = cardName;
        return res.redirect(`/boarding-pass?token=${req.sessionToken}`);
    }
    res.redirect(`/payment?token=${req.sessionToken}`);
});

app.get('/boarding-pass', requireAuth, (req, res) => {
    if (!req.bookingState.pnr) return res.redirect(`/home?token=${req.sessionToken}`);
    res.renderTemplate('boarding_pass.html', req.sessionToken);
});

app.get('/api/signout', (req, res) => {
    const token = req.query.token;
    if (token) delete sessions[token]; 
    res.redirect('/');
});


app.listen(port, () => {
    console.log(`\n✅ Server running. Access at http://localhost:${port}/`);
});