# 🏢 Genoid Tech — Certificate Verification System

A production-ready, full-stack certificate verification portal built with **Node.js**, **Express**, **MongoDB**, and vanilla **HTML/CSS/JS**.

---

## 📁 Project Structure

```
genoid-cert-verify/
├── frontend/
│   ├── index.html          ← Public verification portal
│   ├── admin.html          ← Admin dashboard
│   ├── css/
│   │   ├── style.css       ← Main styles (blue theme)
│   │   └── admin.css       ← Admin panel styles
│   └── js/
│       ├── verify.js       ← Verification logic
│       └── admin.js        ← Admin CRUD + upload logic
│
├── backend/
│   ├── server.js           ← Express app entry point
│   ├── models/
│   │   ├── Certificate.js  ← MongoDB Certificate schema
│   │   └── Settings.js     ← Logo/Signature settings
│   ├── routes/
│   │   ├── verify.js       ← Public /api/verify endpoint
│   │   └── admin.js        ← Protected /api/admin endpoints
│   ├── middleware/
│   │   └── adminAuth.js    ← JWT authentication middleware
│   └── uploads/
│       ├── logos/          ← Uploaded org logos stored here
│       └── signatures/     ← Uploaded signatures stored here
│
├── package.json
├── .env.example            ← Copy to .env and fill values
└── .gitignore
```

---

## ⚙️ Setup Instructions

### Step 1 — Prerequisites

Make sure you have installed:
- **Node.js** v16 or higher → https://nodejs.org
- **MongoDB** (local) → https://www.mongodb.com/try/download/community
  - OR use **MongoDB Atlas** (free cloud) → https://cloud.mongodb.com

### Step 2 — Install Dependencies

```bash
cd genoid-cert-verify
npm install
```

This installs: express, mongoose, multer, jsonwebtoken, bcryptjs, helmet, cors, express-rate-limit, dotenv

### Step 3 — Configure Environment Variables

```bash
cp .env.example .env
```

Open `.env` and set:

```env
# Your MongoDB connection string
MONGO_URI=mongodb://localhost:27017/genoid_cert_db

# Change to a long random string!
JWT_SECRET=your_super_secret_key_here

# Admin login credentials — CHANGE THESE!
ADMIN_USERNAME=admin
ADMIN_PASSWORD=YourStrongPassword@2026

PORT=3000
```

### Step 4 — Start the Server

```bash
npm start
```

Or for development with auto-restart:
```bash
npm run dev
```

### Step 5 — Open in Browser

| Page | URL |
|------|-----|
| 🌐 Verification Portal | http://localhost:3000 |
| 🔐 Admin Panel | http://localhost:3000/admin.html |

---

## 🔐 Admin Panel Usage

### Login
- Go to `http://localhost:3000/admin.html`
- Username: `admin` (or whatever you set in `.env`)
- Password: `GenoidAdmin@2026` (or whatever you set in `.env`)

### Adding Certificates
1. Go to **Add Certificate** in the sidebar
2. Enter a **Certificate ID** in any format you choose:
   - `GENOID001`
   - `GT2026AI001`
   - `AI-WORKSHOP-001`
   - `INTERNSHIP_JUNE_2026_001`
   - `RITHIKA001`
3. Fill in candidate and program details
4. Click **Save Certificate**

### Certificate ID Rules
- You choose the format — any letters, numbers, hyphens, underscores
- Must be **unique** (system will warn you if duplicate)
- **Case-sensitive**: `GT001` and `gt001` are different IDs
- Cannot be changed after creation (to preserve integrity)

### Uploading Logo & Signature
1. Go to **Settings** in the sidebar
2. Upload your Genoid Tech logo (PNG, JPG, SVG, WebP — max 5MB)
3. Upload authorized signatory's digital signature
4. Both will appear on verified certificate pages automatically

---

## 🔗 QR Code Integration

Each certificate you print should have a QR code that links to:
```
https://yourwebsite.com/?id=CERTIFICATE_ID_HERE
```

Or simply point to your verification URL and let the visitor manually type the ID.

**To generate QR codes for certificates**, you can use any QR code tool:
- https://www.qrcode-monkey.com/
- Or generate programmatically using the `qrcode` npm package

---

## 🌐 API Reference

### Public — Verify Certificate
```
POST /api/verify
Content-Type: application/json

{
  "certificateId": "GT2026AI001"
}
```

Response (success):
```json
{
  "success": true,
  "verifiedAt": "2026-06-19T10:30:00.000Z",
  "certificate": {
    "certificateId": "GT2026AI001",
    "candidateName": "Rithika",
    "internshipName": "Machine Learning Internship",
    "dateOfIssue": "2026-06-01T00:00:00.000Z",
    "issuedBy": "Genoid Tech",
    ...
  },
  "org": {
    "logo": "/uploads/logos/logo_123456.png",
    "signature": "/uploads/signatures/signature_123456.png"
  }
}
```

### Admin — Login
```
POST /api/admin/login
{ "username": "admin", "password": "your_password" }
→ Returns: { "token": "JWT_TOKEN_HERE" }
```

### Admin — Add Certificate
```
POST /api/admin/certificates
Authorization: Bearer <token>
{ "certificateId": "GT001", "candidateName": "John", ... }
```

### Admin — Edit Certificate
```
PUT /api/admin/certificates/:mongoId
Authorization: Bearer <token>
```

### Admin — Delete Certificate
```
DELETE /api/admin/certificates/:mongoId
Authorization: Bearer <token>
```

### Admin — Upload Logo
```
POST /api/admin/upload/logo
Authorization: Bearer <token>
Form-data: logo (file)
```

### Admin — Upload Signature
```
POST /api/admin/upload/signature
Authorization: Bearer <token>
Form-data: signature (file)
```

---

## 🚀 Deployment to Production

### Option 1 — Render.com (Free/Easy)
1. Push code to GitHub
2. Go to render.com → New Web Service
3. Connect your GitHub repo
4. Set build command: `npm install`
5. Set start command: `npm start`
6. Add environment variables (MONGO_URI, JWT_SECRET, etc.)
7. Use MongoDB Atlas for the database

### Option 2 — Railway.app
1. Push to GitHub
2. railway.app → New Project → Deploy from GitHub
3. Add MongoDB plugin or use Atlas
4. Set environment variables

### Option 3 — VPS (DigitalOcean/AWS/etc.)
```bash
# On your server:
git clone https://github.com/yourusername/genoid-cert-verify
cd genoid-cert-verify
npm install
cp .env.example .env
nano .env  # Set your values

# Use PM2 to keep server running:
npm install -g pm2
pm2 start backend/server.js --name genoid-cert
pm2 save
pm2 startup
```

---

## 🔒 Security Notes

- **Change the default admin password** before deploying!
- **Change the JWT_SECRET** to a random 32+ character string
- Rate limiting is built-in (30 verify attempts per 15 min per IP)
- No certificate data is exposed without entering the exact ID
- Admin routes are protected by JWT — tokens expire in 8 hours
- File uploads are validated for type and size

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JS |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose ODM |
| Auth | JWT (jsonwebtoken) |
| Security | Helmet, CORS, Rate Limiting |
| File Uploads | Multer |
| Fonts | Google Fonts (Inter + Poppins) |

---

Built with ❤️ for **Genoid Tech** — 2026
"# genoid-certificate-verification" 
