# **SnapFix – Home Repair Services Platform**

SnapFix is a full-stack web application for booking home repair services including Electrician, Plumbing, Painting, and Carpenter services.

The platform provides secure phone-based authentication, worker selection with ratings, scheduling, payment tracking, and a feedback system.

---

## **Overview**

SnapFix enables users to:

* Authenticate via phone number and OTP
* Create and manage profiles with pincode-based location detection
* Browse service categories
* Select verified professionals with ratings and hourly pricing
* Schedule service appointments
* Track booking status
* Complete payments based on service hours
* Submit ratings and feedback

---

## **Technology Stack**

### **Frontend**

* React 18
* Vite
* React Router DOM
* Tailwind CSS
* Axios
* Framer Motion

### **Backend**

* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT Authentication
* Multer (file uploads)
* bcryptjs

---

## **Project Structure**

```
snapfix/
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   └── server.js
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── services/
│   └── App.jsx
│
└── package.json
```

---

## **Setup**

### **1. Install Dependencies**

From the root directory:

```bash
npm install
cd backend && npm install
cd ../frontend && npm install
```

---

### **2. Environment Configuration**

#### **Backend (`backend/.env`)**

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_secret_key
OTP_EXPIRY_MINUTES=10
SHOW_OTP_IN_CONSOLE=true
```

#### **Frontend (`frontend/.env`)**

```env
VITE_API_URL=http://localhost:5000/api
```

---

### **3. Seed Database**

```bash
npm run seed
```

---

### **4. Run Application**

From the root directory:

```bash
npm run dev
```

Frontend: [http://localhost:3000](http://localhost:3000)
Backend: [http://localhost:5000](http://localhost:5000)

---

## **Core Functional Flow**

1. User logs in using phone number and OTP
2. Profile is created with location auto-fill
3. User selects service and describes issue
4. Worker is selected based on rating and pricing
5. Appointment is scheduled
6. Service is marked complete
7. Payment is calculated and recorded
8. Feedback is submitted

---

## **Database Collections**

* users
* otps
* workers
* bookings
* payments
* feedbacks

---

## **Key API Endpoints**

| Method | Endpoint                 | Description             |
| ------ | ------------------------ | ----------------------- |
| POST   | /api/auth/send-otp       | Send OTP                |
| POST   | /api/auth/verify-otp     | Verify OTP              |
| GET    | /api/workers             | Get workers by category |
| POST   | /api/bookings            | Create booking          |
| PUT    | /api/bookings/:id/status | Update booking status   |
| POST   | /api/payments            | Create payment          |
| POST   | /api/feedback            | Submit feedback         |

---

## **Production Notes**

* Use MongoDB Atlas in production
* Disable OTP console logging
* Use a strong JWT secret
* Deploy frontend to Vercel or Netlify
* Deploy backend to Render, Railway, or VPS

---

## **Future Improvements**

* SMS integration (Twilio)
* Payment gateway integration (Razorpay / Stripe)
* Real-time updates

---

## **License**

Educational project for academic and demonstration purposes.

---

Built using React, Node.js, Express, and MongoDB.
