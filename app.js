// app.js

const app = {}; 
app.bookingState = {}; 

// --- 1. ROUTER SERVICE (Handles URL and View Changes) ---
app.router = {
    // Defines the mapping of URL paths to view IDs
    routes: {
        '/': 'login-page',
        '/home': 'home-page',
        '/select-flight': 'select-flight-page',
        '/payment': 'payment-page',
        '/boarding-pass': 'boarding-pass-page',
    },

    // Changes the URL in the browser and calls render()
    navigate: (path, replace = false) => {
        if (replace) {
            history.replaceState(null, '', path);
        } else {
            history.pushState(null, '', path);
        }
        app.router.render();
    },

    // Renders the correct view based on the current URL
    render: () => {
        // Use path.pathname to get the route without the domain (e.g., /home)
        const path = window.location.pathname;
        const pageId = app.router.routes[path];
        
        // Ensure user is authenticated for non-login pages
        if (pageId !== 'login-page' && !localStorage.getItem('authToken')) {
            app.router.navigate('/', true); // Redirect to login
            return;
        }

        if (pageId) {
            // Show the page
            document.querySelectorAll('section').forEach(sec => sec.style.display = 'none');
            document.getElementById(pageId).style.display = 'block';

            // Update header controls visibility
            const controls = document.getElementById('header-controls');
            controls.style.display = (pageId !== 'login-page') ? 'flex' : 'none';

            // Execute post-render logic
            if (pageId === 'select-flight-page') app.UIService.renderFlights();
            if (pageId === 'payment-page') app.UIService.renderPaymentSummary();
            if (pageId === 'boarding-pass-page') app.UIService.renderBoardingPass();

        } else {
            // 404/Invalid path: Redirect to home or login
            app.router.navigate('/', true);
        }
    }
};

// --- 2. DATA SERVICE (Simulates Backend) ---
const USERS = { 'user': 'pass' };
const availableFlights = [
    { number: 'AA101', name: 'Eagle Air', price: 450, time: '08:00 AM' },
    { number: 'BA256', name: 'Global Wings', price: 620, time: '11:30 AM' },
    { number: 'DL890', name: 'Sky High', price: 510, time: '02:45 PM' },
];

app.DataService = {
    authenticate: (username, password) => {
        if (USERS[username] && USERS[username] === password) {
            const token = 'token_' + Math.random().toString(36).substring(2, 15);
            return { status: 200, data: { login_token: token } };
        }
        return { status: 401, error: { message: "Bad username or password" } };
    },
    getFlights: () => ({ status: 200, data: availableFlights }),
    finalizeBooking: (data) => {
        if (data.cardNumber.length !== 12 || data.cvv.length !== 3) {
            return { status: 400, error: { message: 'Validation failed.' } };
        }
        app.bookingState.pnr = Math.random().toString(36).substring(2, 8).toUpperCase();
        app.bookingState.seat = `A${Math.floor(Math.random() * 30) + 1}`;
        app.bookingState.cardName = data.cardName;
        return { status: 200, data: { pnr: app.bookingState.pnr } };
    }
};

// --- 3. UI SERVICE (Renders dynamic content) ---
app.UIService = {
    renderFlights: () => {
        // ... (Rendering logic from previous steps)
        const response = app.DataService.getFlights();
        const flights = response.data;
        const flightList = document.getElementById('flights-list');
        const routeSummary = document.getElementById('flight-route-summary');

        routeSummary.innerHTML = `**From:** ${app.bookingState.fromCity} **To:** ${app.bookingState.toCity}`;
        flightList.innerHTML = '';
        
        flights.forEach(flight => {
            const item = document.createElement('div');
            item.className = 'flight-item';
            item.innerHTML = `
                <div class="flight-details">
                    <div>
                        <strong>Flight ${flight.number} (${flight.name})</strong><br>
                        Departure: ${flight.time}
                    </div>
                    <div>
                        **Price: $${flight.price}**
                    </div>
                </div>
            `;
            item.onclick = () => app.API.selectFlight(flight, item);
            flightList.appendChild(item);
        });
        document.getElementById('proceedBtn').disabled = true;
    },

    renderPaymentSummary: () => {
        const flight = app.bookingState.selectedFlight;
        if (!flight) return app.router.navigate('/home'); 

        document.getElementById('payment-summary').innerHTML = `
            <p>Flight: **${flight.number}** | Route: **${app.bookingState.fromCity}** to **${app.bookingState.toCity}**</p>
            <h3>Amount Due: $${flight.price}</h3>
        `;
    },

    renderBoardingPass: () => {
        const state = app.bookingState;
        if (!state.pnr) return app.router.navigate('/home'); 

        const now = new Date();
        const dateTimeString = now.toLocaleDateString() + ' ' + now.toLocaleTimeString();

        // Display Boarding Pass
        const boardingPassHtml = `
            <div class="boarding-pass">
                <h3>**BOARDING PASS**</h3>
                <p><strong>Passenger Name:</strong> ${state.cardName}</p>
                <p><strong>From:</strong> ${state.fromCity} | <strong>To:</strong> ${state.toCity}</p>
                <p><strong>Flight:</strong> ${state.selectedFlight.number} (${state.selectedFlight.name})</p>
                <p><strong>Departure Time:</strong> ${state.selectedFlight.time}</p>
                <p><strong>Confirmation (PNR):</strong> ${state.pnr}</p>
                <p><strong>Seat:</strong> ${state.seat}</p>
                <p><small>Generated: ${dateTimeString}</small></p>
            </div>
        `;
        document.getElementById('boarding-pass-details').innerHTML = boardingPassHtml;

        // Display JSON text
        const finalJson = { /* ... data ... */ };
        document.getElementById('json-output').textContent = JSON.stringify(finalJson, null, 2);
    }
};


// --- 4. APPLICATION API (The exposed functions for HTML) ---
app.API = {
    login: () => {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorMessage = document.getElementById('login-error');
        const response = app.DataService.authenticate(username, password);

        if (response.status === 200) {
            localStorage.setItem('authToken', response.data.login_token);
            errorMessage.style.display = 'none';
            app.router.navigate('/home'); // Change URL and view
        } else {
            errorMessage.textContent = response.error.message;
            errorMessage.style.display = 'block';
        }
    },
    
    signOut: () => {
        localStorage.removeItem('authToken');
        app.bookingState = {}; 
        app.router.navigate('/', true); // Change URL to root/login
    },

    searchFlights: () => {
        const fromCity = document.getElementById('fromCity').value;
        const toCity = document.getElementById('toCity').value;

        if (!fromCity || !toCity) {
            alert('Please select both From and To cities.');
            return;
        }

        app.bookingState.fromCity = fromCity;
        app.bookingState.toCity = toCity;
        app.router.navigate('/select-flight'); // Change URL and view
    },

    selectFlight: (flight, itemElement) => {
        document.querySelectorAll('.flight-item').forEach(el => el.classList.remove('selected'));
        itemElement.classList.add('selected');
        app.bookingState.selectedFlight = flight;
        document.getElementById('proceedBtn').disabled = false;
    },

    proceedToPay: () => {
        if (!app.bookingState.selectedFlight) return;
        app.router.navigate('/payment'); // Change URL and view
    },

    processPayment: () => {
        const cardNumber = document.getElementById('cardNumber').value;
        const cvv = document.getElementById('cvv').value;
        const cardName = document.getElementById('cardName').value;
        const errorMessage = document.getElementById('payment-error');
        
        const payload = { cardNumber, cvv, cardName };
        const response = app.DataService.finalizeBooking(payload);

        if (response.status === 200) {
            // Clear inputs
            document.getElementById('cardNumber').value = '';
            document.getElementById('cvv').value = '';
            app.router.navigate('/boarding-pass'); // Change URL and view
        } else {
            errorMessage.textContent = response.error.message;
            errorMessage.style.display = 'block';
        }
    }
};

// --- INITIALIZATION ---
// Handle the browser's back/forward buttons
window.addEventListener('popstate', app.router.render);

// Initial check when the script loads
document.addEventListener('DOMContentLoaded', () => {
    // If the user navigates directly to a path (e.g., /home), the router loads the view.
    // If they land on the root '/', the authentication check handles redirection.
    app.router.render();
});