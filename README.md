# Juan Carlos Event Management System

A comprehensive full-stack event management dashboard with role-based access control for multiple departments.

## Prerequisites

Before you begin, ensure you have the following installed:

1. **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
2. **MongoDB Atlas Account** (Free) - [Sign up here](https://www.mongodb.com/cloud/atlas)

---

## 🚀 Quick Start (5 Steps)

### Step 1: Download & Extract

Extract the tar.gz file to your desired location.

### Step 2: Install Dependencies

```bash
cd juancarlos-event-management/app
npm install
```

### Step 3: Set Up MongoDB Atlas (FREE)

**This is REQUIRED for data to persist!**

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and create a free account
2. Create a new cluster (free tier is fine)
3. Click **"Database Access"** → **"Add New Database User"**
   - Create a username and password (save these!)
4. Click **"Network Access"** → **"Add IP Address"** → **"Allow Access from Anywhere"** (enter `0.0.0.0/0`)
5. Go back to **"Clusters"** → Click **"Connect"** → **"Drivers"** → **"Node.js"**
6. Copy the connection string (looks like this):
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/juancarlos?retryWrites=true&w=majority
   ```

### Step 4: Configure Environment

1. Copy the example file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your MongoDB connection:
   ```env
   # Replace with your actual MongoDB Atlas connection string
   MONGODB_URI=mongodb+srv://your_username:your_password@cluster0.xxxxx.mongodb.net/juancarlos?retryWrites=true&w=majority
   
   # Generate any random string (at least 32 characters)
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-12345
   
   # Don't change these
   PORT=5000
   VITE_API_URL=http://localhost:5000/api
   ```

### Step 5: Seed the Database

This creates the initial system users and sample data:

```bash
npm run seed
```

You should see:
```
✅ Connected to MongoDB
✅ Cleared existing data
✅ Created initial user accounts
✅ Loaded sample records
...
✅ Database seeded successfully!
```

### Step 6: Start the App

```bash
npm run dev
```

Then open: **http://localhost:5173**

---

## 🔑 Account Access

Use the work accounts assigned by your project administrator. Keep login credentials outside the repository and share them privately with the team.

---

## 📁 Project Structure

```
juancarlos-event-management/
├── server/                 # Backend (Node.js + Express)
│   ├── models/            # MongoDB schemas
│   │   ├── User.js
│   │   ├── MenuTasting.js
│   │   ├── Contract.js
│   │   ├── Incident.js
│   │   └── Notification.js
│   ├── routes/            # API routes
│   │   ├── auth.js
│   │   ├── contracts.js
│   │   ├── menuTastings.js
│   │   ├── incidents.js
│   │   └── notifications.js
│   ├── middleware/        # Auth middleware
│   │   └── auth.js
│   ├── seed.js            # Database seeding script
│   └── server.js          # Entry point
├── src/                   # Frontend (React + TypeScript)
│   ├── components/        # Reusable components
│   ├── contexts/          # React contexts
│   ├── pages/             # Page components
│   ├── services/          # API services
│   └── App.tsx           # Main app component
├── package.json
├── .env.example
└── README.md
```

---

## 🛠️ Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both frontend and backend |
| `npm run server` | Backend only |
| `npm run server:dev` | Backend with auto-restart (nodemon) |
| `npm run seed` | Seed database with initial data |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |

---

## ❓ Troubleshooting

### Issue: "Cannot connect to MongoDB"

**Solution:**
1. Double-check your MONGODB_URI in `.env`
2. Make sure you replaced `<password>` with your actual password
3. In MongoDB Atlas, go to **Network Access** and add your IP address
4. Make sure your database user has the correct permissions

### Issue: "npm run seed fails"

**Solution:**
```bash
# Make sure you're in the app folder
cd juancarlos-event-management/app

# Check if .env exists
cat .env

# If MONGODB_URI is missing or wrong, edit it:
nano .env  # or use any text editor
```

### Issue: "Data doesn't persist after restart"

**This means you're using mock API instead of real database.**

**Solution:**
1. Make sure you ran `npm run seed` successfully
2. Check that the backend is running (you should see "Connected to MongoDB" in terminal)
3. The app will automatically use mock API if it can't connect to MongoDB

### Issue: "Port 5000 already in use"

**Solution:**
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:5000 | xargs kill -9
```

Or change the port in `.env`:
```env
PORT=5001
```

---

## 🔄 How the Workflow Works

### Staff-Only System

```
Client calls/emails/DMs Juan Carlos
           ↓
    Sales staff answers inquiry
           ↓
    Staff opens dashboard
           ↓
    Menu Tastings → Book Tasting
           ↓
    Enters client details from inquiry
           ↓
    Client attends tasting
           ↓
    Staff creates contract from tasting
           ↓
    Contract flows through departments
```

---

## 📝 Features

- **Menu Tasting Booking** - Schedule and manage client tastings
- **Contract Management** - Create, edit, submit, approve contracts
- **Role-Based Access** - 9 different user roles with specific permissions
- **Payment Tracking** - Down payments, installments, full payments
- **Department Workflows** - Sales → Accounting → Operations
- **SLA Enforcement** - Deadline warnings and tracking
- **Incident Reporting** - Post-event issue tracking
- **Creative Management** - Store creative assets and requirements in database

---

## 💾 Database Models

### User
- Authentication and role management
- 9 roles: sales, accounting, logistics, banquet_supervisor, kitchen, purchasing, creative, linen, admin

### MenuTasting
- Client contact info (name, email, phone, address)
- Event details (type, expected guests, preferred date)
- Tasting booking (date, time, number of pax)
- Menu items selected during tasting
- Link to contract when created

### Contract
- Full client details with validation
- Event details and venue
- Package and menu
- Creative requirements and assets (stored in DB)
- Payment tracking
- Department progress
- Link to menu tasting

### Incident
- Post-event issue reporting
- Severity levels and status tracking

---

## 🌐 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19 + TypeScript |
| Build Tool | Vite 7 |
| Styling | Tailwind CSS 3.4 |
| UI Components | shadcn/ui |
| Backend | Node.js + Express 5 |
| Database | MongoDB Atlas + Mongoose |
| Auth | JWT + bcryptjs |
| Icons | Lucide React |

---

## 📞 Support

For issues or questions:
1. Check the Troubleshooting section above
2. Review the code comments in the source files
3. Make sure MongoDB Atlas is properly configured

---

## License

MIT License - feel free to use for your own projects!
