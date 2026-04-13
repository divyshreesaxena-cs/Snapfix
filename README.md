# SnapFix - Home Repair Services Platform

A full-stack web application for booking home repair services (Electrician, Plumbing, Painting, Carpenter) with phone-based authentication, worker selection, scheduling, payments, and feedback system.

## 🚀 Features

- **Phone + OTP Authentication**: Secure login system with OTP verification
- **Profile Management**: User profile setup with automatic pincode-based location detection
- **Service Categories**: Browse and book from 4 service categories
- **Worker Selection**: View verified professionals with ratings and pricing
- **Smart Scheduling**: Date and time slot selection
- **Booking Management**: Track bookings from scheduled to completed
- **Payment System**: Simple payment calculation based on hours worked
- **Feedback System**: Rate and review workers after service completion
- **Beautiful UI**: Modern, responsive design with smooth animations

## 📁 Project Structure

```
snapfix/
├── backend/                 # Node.js + Express backend
│   ├── config/             # Database configuration
│   ├── controllers/        # Request handlers
│   ├── middleware/         # Auth & upload middleware
│   ├── models/             # MongoDB schemas
│   ├── routes/             # API routes
│   ├── scripts/            # Seed scripts
│   ├── uploads/            # Image uploads directory
│   ├── utils/              # Helper functions
│   ├── .env.example        # Environment variables template
│   ├── package.json        # Backend dependencies
│   └── server.js           # Entry point
│
├── frontend/               # React + Vite frontend
│   ├── public/            # Static files
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── context/       # React context (Auth)
│   │   ├── pages/         # Page components
│   │   ├── services/      # API service layer
│   │   ├── App.jsx        # Main app component
│   │   ├── main.jsx       # Entry point
│   │   └── index.css      # Global styles
│   ├── .env.example       # Environment variables template
│   ├── package.json       # Frontend dependencies
│   ├── vite.config.js     # Vite configuration
│   └── tailwind.config.js # Tailwind CSS configuration
│
├── package.json           # Root package.json for scripts
└── README.md             # This file
```

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **React Router DOM** - Routing
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Axios** - HTTP client
- **React Hot Toast** - Notifications
- **Lucide React** - Icons
- **date-fns** - Date utilities

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **Multer** - File uploads
- **bcryptjs** - Password hashing
- **express-validator** - Input validation

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

1. **Node.js** (LTS version - v18 or higher)
   - Download from: https://nodejs.org/
   - Verify: `node --version`

2. **MongoDB**
   - **Option A - Local Installation:**
     - Download from: https://www.mongodb.com/try/download/community
     - Install and start MongoDB service
   - **Option B - MongoDB Atlas (Cloud):**
     - Create free account at: https://www.mongodb.com/cloud/atlas
     - Create a cluster and get connection string

3. **Git** (optional, for cloning)
   - Download from: https://git-scm.com/

4. **VS Code** (recommended)
   - Download from: https://code.visualstudio.com/

## 🚀 Installation & Setup

### Step 1: Extract/Clone the Project

If you have a zip file, extract it. If using git:
```bash
git clone <repository-url>
cd snapfix
```

### Step 2: Install Dependencies

Open terminal in VS Code (Terminal → New Terminal) and run:

```bash
# Install root dependencies (concurrently for running both servers)
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Return to root
cd ..
```

### Step 3: Configure Environment Variables

#### Backend Configuration

1. Navigate to `backend` folder
2. Copy `.env.example` to `.env`:
   ```bash
   cd backend
   cp .env.example .env
   ```

3. Edit `.env` file with your settings:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
# Option A - Local MongoDB
MONGODB_URI=mongodb://localhost:27017/snapfix

# Option B - MongoDB Atlas (replace with your connection string)
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/snapfix

# JWT Secret (IMPORTANT: Change this!)
JWT_SECRET=your-super-secret-key-change-this-min-32-characters-long

# JWT Expiry
JWT_EXPIRE=7d

# OTP Configuration
OTP_EXPIRY_MINUTES=10
SHOW_OTP_IN_CONSOLE=true

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH=uploads
```

**Important Notes:**
- **JWT_SECRET**: Must be at least 32 characters. Use a random string generator.
- **MONGODB_URI**: Use local or Atlas connection string
- **SHOW_OTP_IN_CONSOLE**: Set to `true` for development to see OTPs in console

#### Frontend Configuration

1. Navigate to `frontend` folder
2. Copy `.env.example` to `.env`:
   ```bash
   cd frontend
   cp .env.example .env
   ```

3. Edit `.env` file:

```env
# API Base URL (default is fine for local development)
VITE_API_URL=http://localhost:5000/api
```

### Step 4: Seed the Database

Seed the database with sample workers:

```bash
# From root directory
npm run seed

# Or from backend directory
cd backend
npm run seed
```

You should see:
```
✅ Successfully seeded workers data
📊 Total workers added: 12
```

### Step 5: Start the Application

#### Option A - Run Both Servers with One Command (Recommended)

From the root directory:
```bash
npm run dev
```

This will start:
- Backend on http://localhost:5000
- Frontend on http://localhost:3000

#### Option B - Run Servers Separately

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Step 6: Access the Application

1. Open your browser
2. Go to: http://localhost:3000
3. You'll see the SnapFix login page!

## 📱 Testing the Application

### Test User Flow

1. **Login:**
   - Enter any 10-digit phone number (e.g., `9876543210`)
   - Click "Send OTP"
   - OTP will be shown in:
     - Browser notification (dev mode)
     - Backend console (check terminal)
   - Enter the 6-digit OTP and verify

2. **Profile Setup:**
   - Enter your full name
   - Enter a pincode (try: `110001`, `400001`, `560001`)
   - City/State will auto-fill
   - Click "Continue to SnapFix"

3. **Book a Service:**
   - Click on any service category (e.g., Electrician)
   - Select a problem type
   - Describe the issue
   - (Optional) Upload images
   - Click "Find Available Professionals"

4. **Select Worker:**
   - Browse available workers
   - View their ratings and pricing
   - Select a worker
   - Click "Schedule Service"

5. **Schedule:**
   - Pick a date (today or next 7 days)
   - Choose a time slot
   - Click "Confirm Booking"
   - You'll see confirmation page!

6. **Manage Bookings:**
   - Go to "My Bookings" from navbar
   - View all your bookings
   - Click "Mark Complete" when service is done

7. **Make Payment:**
   - Enter hours worked
   - See calculated amount
   - Click "Pay Now" (simulated)

8. **Give Feedback:**
   - Rate the worker (1-5 stars)
   - (Optional) Add comment
   - Submit feedback

## 🗄️ Database Schema

### Collections

1. **users** - User profiles
2. **otps** - OTP verification codes (auto-expires)
3. **workers** - Service professionals
4. **bookings** - Service bookings
5. **payments** - Payment records
6. **feedbacks** - User feedback/ratings

## 🔧 Development Commands

```bash
# Root directory
npm run dev              # Run both frontend & backend
npm run dev:backend      # Run backend only
npm run dev:frontend     # Run frontend only
npm run seed            # Seed database
npm run install:all     # Install all dependencies

# Backend directory
npm run dev             # Start with nodemon
npm start              # Start without nodemon
npm run seed           # Seed database

# Frontend directory
npm run dev            # Start development server
npm run build          # Build for production
npm run preview        # Preview production build
```

## 📸 Key Features Implemented

✅ Phone + OTP Authentication  
✅ Profile Setup with Pincode Lookup  
✅ Service Categories Display  
✅ Service Request Form with Image Upload  
✅ Worker Selection with Ratings  
✅ Date & Time Scheduling  
✅ Booking Management  
✅ Status Tracking (Scheduled → Completed)  
✅ Payment Calculation  
✅ Feedback & Rating System  
✅ Responsive UI Design  
✅ Smooth Animations  
✅ Toast Notifications  

## 🎨 UI/UX Highlights

- **Modern Design**: Clean, professional interface
- **Smooth Animations**: Framer Motion for transitions
- **Responsive**: Works on desktop, tablet, and mobile
- **Custom Components**: Reusable card, button, input styles
- **Loading States**: Skeleton loaders and spinners
- **Error Handling**: User-friendly error messages
- **Toast Notifications**: Real-time feedback

## 🔐 Authentication Flow

1. User enters phone number
2. Backend generates 6-digit OTP
3. OTP stored in DB with expiry (10 minutes)
4. OTP shown in console (dev mode)
5. User enters OTP
6. Backend verifies OTP
7. JWT token issued
8. Token stored in localStorage
9. Protected routes accessible

## 📦 API Endpoints

### Authentication
- `POST /api/auth/send-otp` - Send OTP
- `POST /api/auth/verify-otp` - Verify OTP & Login

### Profile
- `GET /api/profile` - Get user profile
- `POST /api/profile` - Update profile

### Services
- `GET /api/services` - Get all services
- `GET /api/services/:category/problems` - Get problems by category

### Workers
- `GET /api/workers?category=Electrician` - Get workers by category
- `GET /api/workers/:id` - Get single worker

### Bookings
- `POST /api/bookings` - Create booking (with images)
- `GET /api/bookings` - Get user bookings
- `GET /api/bookings/:id` - Get single booking
- `PUT /api/bookings/:id/status` - Update status

### Payments
- `POST /api/payments` - Create payment
- `GET /api/payments` - Get user payments
- `GET /api/payments/booking/:bookingId` - Get payment by booking

### Feedback
- `POST /api/feedback` - Submit feedback
- `GET /api/feedback/booking/:bookingId` - Get feedback by booking
- `GET /api/feedback/worker/:workerId` - Get worker feedbacks

### Location
- `GET /api/location/pincode/:pincode` - Get location by pincode

## 🐛 Troubleshooting

### MongoDB Connection Issues

**Error:** `MongoServerError: Authentication failed`
- Check MongoDB URI in `.env`
- Verify username/password for Atlas
- For local MongoDB, ensure service is running

**Error:** `connect ECONNREFUSED`
- Start MongoDB service
- Check if MongoDB is running on port 27017

### Port Already in Use

**Error:** `Port 5000 is already in use`
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:5000 | xargs kill -9
```

### OTP Not Received

- Check backend console for OTP
- Verify `SHOW_OTP_IN_CONSOLE=true` in backend `.env`
- Check browser notifications

### Image Upload Issues

- Ensure `uploads` folder exists in backend
- Check `MAX_FILE_SIZE` in `.env`
- Verify file is image format (jpg, png, webp)

## 📝 Production Deployment

### Backend Deployment

1. Set environment variables:
   - `NODE_ENV=production`
   - `SHOW_OTP_IN_CONSOLE=false`
   - Add Twilio credentials for real SMS

2. Use process manager (PM2):
   ```bash
   npm install -g pm2
   pm2 start server.js --name snapfix-api
   ```

### Frontend Deployment

1. Build production files:
   ```bash
   cd frontend
   npm run build
   ```

2. Deploy `dist` folder to:
   - Vercel
   - Netlify
   - AWS S3 + CloudFront

### Environment Variables for Production

- Use strong JWT_SECRET
- Enable MongoDB Atlas
- Configure Twilio for SMS
- Set up cloud storage (AWS S3) for images
- Add proper CORS configuration

## 🔄 Architecture Overview

### Data Flow

```
User Action (Frontend)
    ↓
API Call (axios)
    ↓
Express Route
    ↓
Controller Function
    ↓
Mongoose Model
    ↓
MongoDB Database
    ↓
Response back through layers
    ↓
Update UI (React)
```

### Component Hierarchy

```
App.jsx
├── AuthProvider (Context)
├── Router
│   ├── Navbar
│   └── Routes
│       ├── Login
│       ├── ProfileSetup
│       ├── Home
│       │   └── ServiceCards
│       ├── ServiceRequest
│       ├── WorkerSelection
│       │   └── WorkerCards
│       ├── ScheduleBooking
│       ├── BookingConfirmed
│       ├── MyBookings
│       │   └── BookingCards
│       ├── Payment
│       └── Feedback
└── Toaster (Notifications)
```

## 📄 License

This project is created for educational purposes.

## 🤝 Support

For issues or questions:
1. Check troubleshooting section
2. Review console logs (F12 in browser)
3. Check backend terminal for errors

## 🎉 Happy Coding!

You now have a fully functional home repair services platform! 

**Next Steps:**
- Add more service categories
- Implement real SMS gateway (Twilio)
- Add payment gateway (Razorpay/Stripe)
- Deploy to production
- Add admin panel
- Implement real-time notifications

---

Built with ❤️ using React, Node.js, Express, and MongoDB
