# 🚀 SnapFix Quick Start Guide

Get SnapFix up and running in 5 minutes!

## Prerequisites Check

✅ Node.js installed? Run: `node --version` (need v18+)  
✅ MongoDB installed/access? (Local or Atlas account)

## 🏃‍♂️ Fast Setup (Copy-Paste Commands)

### 1. Install Everything

Open terminal in project root and run:

```bash
# Install root dependencies
npm install

# Install backend dependencies  
cd backend && npm install && cd ..

# Install frontend dependencies
cd frontend && npm install && cd ..
```

### 2. Configure Backend

```bash
# Create .env file in backend folder
cd backend
cp .env.example .env
```

**Edit `backend/.env` file:**
- Change `JWT_SECRET` to any random 32+ character string
- If using MongoDB Atlas, update `MONGODB_URI` with your connection string
- Keep `SHOW_OTP_IN_CONSOLE=true` for development

**Minimum required:**
```env
MONGODB_URI=mongodb://localhost:27017/snapfix
JWT_SECRET=change-this-to-a-very-long-random-secure-string-at-least-32-chars
SHOW_OTP_IN_CONSOLE=true
```

### 3. Configure Frontend

```bash
# Create .env file in frontend folder
cd ../frontend
cp .env.example .env
cd ..
```

**Default settings in `frontend/.env` are fine:**
```env
VITE_API_URL=http://localhost:5000/api
```

### 4. Seed Database

```bash
# From root directory
npm run seed
```

Wait for: ✅ Successfully seeded workers data

### 5. Start Application

```bash
# From root directory - runs both frontend and backend
npm run dev
```

Wait for:
- 🚀 Server running on port 5000
- Frontend running on port 3000

### 6. Open Browser

Go to: **http://localhost:3000**

## 🎯 Test It Out!

1. **Login:**
   - Phone: `9876543210` (any 10 digits)
   - Click "Send OTP"
   - Check terminal for OTP (or browser notification)
   - Enter OTP and verify

2. **Setup Profile:**
   - Name: Your Name
   - Pincode: `110001` (or any from README)
   - Submit

3. **Book a Service:**
   - Click "Electrician"
   - Fill form
   - Select worker
   - Schedule time
   - Done! 🎉

## 🐛 Quick Fixes

### Can't connect to MongoDB?

**Local MongoDB:**
```bash
# Start MongoDB service
# Windows: MongoDB should start automatically
# Mac: brew services start mongodb-community
# Linux: sudo systemctl start mongod
```

**Using MongoDB Atlas:**
1. Go to mongodb.com/cloud/atlas
2. Create free cluster
3. Get connection string
4. Update `MONGODB_URI` in backend/.env

### Port already in use?

```bash
# Kill process on port 5000
# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux:
lsof -ti:5000 | xargs kill -9
```

### OTP not showing?

- Check backend terminal (should see: 📱 OTP for ...)
- Check browser notification
- Verify `SHOW_OTP_IN_CONSOLE=true` in backend/.env

## 📁 Project Structure (Simplified)

```
snapfix/
├── backend/              # API server
│   ├── models/          # Database schemas
│   ├── routes/          # API endpoints
│   ├── controllers/     # Business logic
│   └── .env            # ⚠️ Configure this!
│
├── frontend/            # React app
│   ├── src/pages/      # All pages
│   ├── src/components/ # Reusable components
│   └── .env           # ⚠️ Configure this!
│
└── package.json        # Run scripts from here
```

## 🎨 What You'll See

- Beautiful orange gradient theme
- Smooth animations
- Service categories (4 types)
- Worker profiles with ratings
- Booking management
- Payment simulation
- Feedback system

## 📝 Need More Help?

Check **README.md** for:
- Detailed setup instructions
- Full feature list
- API documentation
- Troubleshooting guide
- Production deployment

## ✨ Features Included

✅ Phone Authentication with OTP  
✅ 12 Pre-seeded Workers  
✅ 4 Service Categories  
✅ Image Upload Support  
✅ Real-time Booking Tracking  
✅ Payment Calculation  
✅ Rating & Reviews  
✅ Responsive Design  

## 🔑 Default Test Data

**Test Phone Numbers:** Any 10-digit number works  
**Pincodes:** 110001, 400001, 560001, 600001, etc.  
**Workers:** 12 workers across all categories (auto-seeded)

## 🎉 That's It!

You're ready to use SnapFix! 

**Have fun exploring! 🚀**

---

For detailed documentation, see README.md
