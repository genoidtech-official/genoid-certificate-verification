/**
 * Admin Routes - Genoid Tech
 * All routes protected by JWT middleware
 * Prefix: /api/admin
 */

const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');
const jwt      = require('jsonwebtoken');

const Certificate  = require('../models/Certificate');
const Settings     = require('../models/Settings');
const { adminAuth, JWT_SECRET } = require('../middleware/adminAuth');

// ─── Admin credentials (env-based, change in production) ───
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'GenoidAdmin@2026';

// ─── Multer config for file uploads ────────────────────────
function buildStorage(subfolder) {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(__dirname, '..', 'uploads', subfolder);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const ext  = path.extname(file.originalname).toLowerCase();
      const name = `${subfolder}_${Date.now()}${ext}`;
      cb(null, name);
    },
  });
}

const logoUpload = multer({
  storage: buildStorage('logos'),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.png', '.jpg', '.jpeg', '.svg', '.webp'];
    if (allowed.includes(path.extname(file.originalname).toLowerCase())) cb(null, true);
    else cb(new Error('Only image files allowed for logo'));
  },
});

const sigUpload = multer({
  storage: buildStorage('signatures'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.png', '.jpg', '.jpeg', '.svg', '.webp'];
    if (allowed.includes(path.extname(file.originalname).toLowerCase())) cb(null, true);
    else cb(new Error('Only image files allowed for signature'));
  },
});


// ════════════════════════════════════════════════
// POST /api/admin/login
// Public route — returns JWT token
// ════════════════════════════════════════════════
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password required.' });
  }

  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ success: false, message: 'Invalid credentials.' });
  }

  const token = jwt.sign({ username, role: 'admin' }, JWT_SECRET, { expiresIn: '8h' });

  return res.json({
    success: true,
    token,
    message: 'Login successful.',
  });
});


// ════════════════════════════════════════════════
// All routes below require admin JWT
// ════════════════════════════════════════════════

// GET /api/admin/certificates — list all (with pagination)
router.get('/certificates', adminAuth, async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip  = (page - 1) * limit;
    const search = req.query.search || '';

    const query = search
      ? {
          $or: [
            { certificateId: { $regex: search, $options: 'i' } },
            { candidateName:  { $regex: search, $options: 'i' } },
          ],
        }
      : {};

    const [certificates, total] = await Promise.all([
      Certificate.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Certificate.countDocuments(query),
    ]);

    return res.json({
      success: true,
      certificates,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('[Admin List Error]', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});


// POST /api/admin/certificates — add new certificate
router.post('/certificates', adminAuth, async (req, res) => {
  try {
    const {
      certificateId, candidateName, courseName, internshipName,
      workshopName, eventName, duration, dateOfIssue,
      issuedBy, signatoryName, signatoryDesig,
    } = req.body;

    if (!certificateId || !candidateName || !dateOfIssue) {
      return res.status(400).json({
        success: false,
        message: 'Certificate ID, Candidate Name, and Date of Issue are required.',
      });
    }

    // Check for duplicate ID
    const existing = await Certificate.findOne({ certificateId: certificateId.trim() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Certificate ID "${certificateId.trim()}" already exists.`,
      });
    }

    const cert = new Certificate({
      certificateId: certificateId.trim(),
      candidateName, courseName, internshipName,
      workshopName, eventName, duration,
      dateOfIssue: new Date(dateOfIssue),
      issuedBy: issuedBy || 'Genoid Tech',
      signatoryName, signatoryDesig,
    });

    await cert.save();

    return res.status(201).json({
      success: true,
      message: 'Certificate added successfully.',
      certificate: cert,
    });
  } catch (err) {
    console.error('[Admin Add Error]', err);
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'Certificate ID already exists.' });
    }
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});


// PUT /api/admin/certificates/:id — edit certificate
router.put('/certificates/:id', adminAuth, async (req, res) => {
  try {
    const cert = await Certificate.findById(req.params.id);
    if (!cert) return res.status(404).json({ success: false, message: 'Certificate not found.' });

    const fields = [
      'candidateName','courseName','internshipName','workshopName',
      'eventName','duration','dateOfIssue','issuedBy','signatoryName','signatoryDesig','isActive'
    ];

    fields.forEach(f => {
      if (req.body[f] !== undefined) {
        cert[f] = f === 'dateOfIssue' ? new Date(req.body[f]) : req.body[f];
      }
    });

    // Note: certificateId intentionally not updatable to preserve integrity

    await cert.save();
    return res.json({ success: true, message: 'Certificate updated.', certificate: cert });
  } catch (err) {
    console.error('[Admin Edit Error]', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});


// DELETE /api/admin/certificates/:id — delete certificate
router.delete('/certificates/:id', adminAuth, async (req, res) => {
  try {
    const cert = await Certificate.findByIdAndDelete(req.params.id);
    if (!cert) return res.status(404).json({ success: false, message: 'Certificate not found.' });
    return res.json({ success: true, message: 'Certificate deleted.' });
  } catch (err) {
    console.error('[Admin Delete Error]', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});


// POST /api/admin/upload/logo
router.post('/upload/logo', adminAuth, logoUpload.single('logo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });

    // Remove old logo file if exists
    const oldSetting = await Settings.findOne({ key: 'logo' });
    if (oldSetting) {
      const oldPath = path.join(__dirname, '..', 'uploads', 'logos', oldSetting.value);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    await Settings.findOneAndUpdate(
      { key: 'logo' },
      { key: 'logo', value: req.file.filename },
      { upsert: true, new: true }
    );

    return res.json({
      success: true,
      message: 'Logo uploaded successfully.',
      filename: req.file.filename,
      url: `/uploads/logos/${req.file.filename}`,
    });
  } catch (err) {
    console.error('[Logo Upload Error]', err);
    return res.status(500).json({ success: false, message: 'Upload failed.' });
  }
});


// POST /api/admin/upload/signature
router.post('/upload/signature', adminAuth, sigUpload.single('signature'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });

    const oldSetting = await Settings.findOne({ key: 'signature' });
    if (oldSetting) {
      const oldPath = path.join(__dirname, '..', 'uploads', 'signatures', oldSetting.value);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    await Settings.findOneAndUpdate(
      { key: 'signature' },
      { key: 'signature', value: req.file.filename },
      { upsert: true, new: true }
    );

    return res.json({
      success: true,
      message: 'Signature uploaded successfully.',
      filename: req.file.filename,
      url: `/uploads/signatures/${req.file.filename}`,
    });
  } catch (err) {
    console.error('[Signature Upload Error]', err);
    return res.status(500).json({ success: false, message: 'Upload failed.' });
  }
});


// GET /api/admin/settings — fetch current org settings
router.get('/settings', adminAuth, async (req, res) => {
  try {
    const settings = await Settings.find();
    const result = {};
    settings.forEach(s => { result[s.key] = s.value; });
    return res.json({ success: true, settings: result });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});


module.exports = router;
