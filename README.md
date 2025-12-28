# ✈️ RemoteAIR Booking Portal

Author-Debanjan Bhattacharyaa
A complete Node.js-based airline ticket booking website with token-based authentication, multiple pages, and a complete booking flow. 
This website is primarily created for educational purposes.

## Features

✅ **User Authentication** - Login with token-based authentication  
✅ **City Selection** - Unique city dropdowns for departure and destination  
✅ **Flight Selection** - Browse 5 different flights with prices  
✅ **Payment Processing** - Secure payment with card details validation  
✅ **Boarding Pass** - Generate boarding pass with booking details  
✅ **JSON Output** - Display booking data in JSON format  
✅ **Sign Out** - Logout functionality that terminates tokens  
✅ **Home Navigation** - Quick return to home from any page  

### Prerequisites
- **Node.js** (v14 or higher)
- **npm** (comes with Node.js)

### Steps to Run Locally

1. **Clone project directory:**

2. **Start the server:**
```bash
   npm install
   npm start
```

   You should see:
```
   Server running on http://localhost:3000
   Test credentials: username="user1", password="password123"
```

5. **Open in browser:**
   - Go to `http://localhost:3000`
   - Login with credentials (see below)

## Default Test Credentials

```
Username: user1
Password: password123

Alternative:
Username: user2
Password: pass456
```

## How to Use

### 1. Login Page
- Enter username and password
- Click "Login" button
- Upon successful login, you receive a token

### 2. Home Page
- Select "From City" from dropdown
- Select "To City" from dropdown
- Cities must be different
- Click "Next" to proceed

### 3. Flight Selection Page
- View all 5 available flights
- Select one flight by clicking the radio button
- Click "Proceed to Pay"

### 4. Payment Page
- Enter 12-digit card number (any valid format)
- Enter 3-digit CVV
- Enter name on card
- Click "Pay" to process payment

### 5. Boarding Pass Page
- View your boarding pass with all details
- See booking confirmation ID
- View complete booking data in JSON format
- Can click "Home" to book another ticket
- Click "Logout" to exit

## API Endpoints

### POST /api/login
```json
Request: { "username": "user1", "password": "password123" }
Response: { "success": true, "token": "token_xxx" }
```

### GET /api/cities
```
Headers: Authorization: token_xxx
Response: { "cities": ["New York", "Los Angeles", ...] }
```

### POST /api/flights
```json
Headers: Authorization: token_xxx
Request: { "fromCity": "New York", "toCity": "Los Angeles" }
Response: { "flights": [...] }
```

### POST /api/payment
```json
Headers: Authorization: token_xxx
Request: {
  "cardNumber": "123456789012",
  "cvv": "123",
  "cardName": "John Doe",
  "flightId": 1,
  "fromCity": "New York",
  "toCity": "Los Angeles"
}
Response: { "success": true, "booking": {...} }
```

### POST /api/logout
```
Headers: Authorization: token_xxx
Response: { "success": true, "message": "Logout successful" }
```

## Troubleshooting

**Port 3000 already in use:**
```bash
# On Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# On Mac/Linux
lsof -i :3000
kill -9 <PID>
```

**Module not found error:**
```bash
npm install
npm start
```

**Cannot login:**
- Check credentials (user1 / password123 or user2 / pass456)
- Ensure server is running
- Check browser console for errors (F12)

## Development Mode

Install nodemon for auto-restart:
```bash
npm install --save-dev nodemon
npm run dev
```

---

**Created On:** 2025  for **Educational Purpose**
