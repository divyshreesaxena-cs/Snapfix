# SnapFix – Project Documentation

## Project Overview

SnapFix is a full-stack home repair services platform that connects users with verified professionals across four service categories:

- Electrician  
- Plumbing  
- Painting  
- Carpenter  

The platform supports phone-based OTP authentication, structured booking workflows, worker selection, payment tracking, and a feedback system.

This project demonstrates production-ready architecture using React, Node.js, Express, and MongoDB.

---

## Core Features

### Authentication
- Phone number + OTP login  
- JWT-based session management (7-day expiry)  
- OTP expiry (10 minutes)  
- Protected API routes  
- SMS integration-ready structure  

### Profile Management
- Mandatory profile completion  
- Pincode-based city/state auto-fill  
- Preloaded Indian pincode dataset  
- Persistent profile storage  

### Service Booking Workflow
- Four service categories  
- Category-specific problem selection  
- Description with image upload (up to 3 images)  
- Worker selection with ratings and pricing  
- Date picker and time slots (next 7 days)  

### Worker Management
- 12 seeded workers (3 per category)  
- Rating and review tracking  
- Experience and skill display  
- Transparent hourly pricing  
- Availability tracking  

### Booking Lifecycle
Status transitions:
- Scheduled  
- In Progress  
- Completed  
- Cancelled  

Additional features:
- Booking filtering (All / Active / Completed)  
- Booking history tracking  

### Payment System
- Rate × Hours calculation  
- 0.5-hour increments supported  
- Payment breakdown summary  
- Unique transaction IDs  
- Payment history tracking  
- Payment gateway-ready structure  

### Feedback System
- 1–5 star ratings  
- Optional review comments  
- One feedback per booking  
- Automatic worker rating recalculation  

---

## System Architecture

### Frontend Architecture

```
React UI
   → React Router
      → Auth Context
         → API Service Layer (Axios)
            → Backend API
```

### Backend Architecture

```
Express Server
   → Routes
      → Middleware (Auth, Upload, Validation)
         → Controllers
            → Models (Mongoose)
               → MongoDB
```

### Example Request Flow – Create Booking

1. User submits booking form  
2. Frontend prepares FormData with images  
3. Axios sends authenticated POST request  
4. JWT verified via middleware  
5. Multer processes image upload  
6. Controller validates and saves booking  
7. Database updated  
8. Response returned and UI updated  

---

## Database Design

### Users
```js
{
  phone: String,
  fullName: String,
  pincode: String,
  city: String,
  state: String,
  country: String,
  isProfileComplete: Boolean,
  timestamps
}
```

### OTPs
```js
{
  phone: String,
  otp: String,
  expiresAt: Date,
  verified: Boolean,
  timestamps
}
```

### Workers
```js
{
  name: String,
  serviceCategory: String,
  pricePerHour: Number,
  rating: Number,
  totalReviews: Number,
  experience: Number,
  availability: Boolean,
  location: Object,
  skills: [String],
  completedJobs: Number,
  timestamps
}
```

### Bookings
```js
{
  user: ObjectId,
  worker: ObjectId,
  serviceCategory: String,
  problemType: String,
  description: String,
  images: [String],
  scheduledDate: Date,
  scheduledTime: String,
  status: String,
  address: Object,
  timestamps
}
```

### Payments
```js
{
  booking: ObjectId,
  user: ObjectId,
  worker: ObjectId,
  hoursWorked: Number,
  totalAmount: Number,
  paymentStatus: String,
  transactionId: String,
  paidAt: Date,
  timestamps
}
```

### Feedbacks
```js
{
  booking: ObjectId,
  user: ObjectId,
  worker: ObjectId,
  rating: Number,
  comment: String,
  timestamps
}
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | /api/auth/send-otp | Generate OTP |
| POST   | /api/auth/verify-otp | Verify OTP |
| GET    | /api/profile | Get profile |
| POST   | /api/profile | Update profile |
| GET    | /api/workers | List workers |
| POST   | /api/bookings | Create booking |
| PUT    | /api/bookings/:id/status | Update booking status |
| POST   | /api/payments | Create payment |
| POST   | /api/feedback | Submit feedback |

---

## Security Implementation

### Implemented
- JWT authentication  
- OTP-based login  
- Protected API routes  
- Input validation  
- File upload restrictions  
- Token expiration handling  

### Recommended for Production
- Rate limiting  
- Security headers (Helmet)  
- Input sanitization  
- HTTPS enforcement  
- API request logging  
- Error monitoring  

---

## Deployment Strategy

### Backend
- MongoDB Atlas  
- Secure environment variables  
- Production-grade JWT secret  
- Proper CORS configuration  

### Frontend
- Production build using:
  ```bash
  npm run build
  ```
- Deploy to Vercel or Netlify  
- Configure API base URL  

---

## Project Status

The system is fully functional.

All core modules including authentication, booking workflow, payment simulation, and feedback management have been implemented.

---

Built using React, Node.js, Express, and MongoDB.
