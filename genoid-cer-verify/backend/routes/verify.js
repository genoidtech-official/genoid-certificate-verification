/**
 * Public Verification Routes - Genoid Tech
 * /api/verify — publicly accessible, read-only
 */

const express = require('express');
const router  = express.Router();
const Certificate = require('../models/Certificate');
const Settings    = require('../models/Settings');

// ─────────────────────────────────────────────────
// POST /api/verify
// Body: { certificateId: "GT2026AI001" }
// ─────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { certificateId } = req.body;

    // Basic input validation
    if (!certificateId || typeof certificateId !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Certificate ID is required.',
      });
    }

    const trimmedId = certificateId.trim();

    if (trimmedId.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Certificate ID cannot be empty.',
      });
    }

    if (trimmedId.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Certificate ID is too long.',
      });
    }

    // Exact match search (case-sensitive by default)
    const cert = await Certificate.findOne({
      certificateId: trimmedId,
      isActive: true,
    });

    if (!cert) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found. Please check the ID and try again.',
      });
    }

    // Fetch org settings for logo/signature filenames
    const [logoSetting, sigSetting] = await Promise.all([
      Settings.findOne({ key: 'logo' }),
      Settings.findOne({ key: 'signature' }),
    ]);

    // Return certificate data (no sensitive fields)
    return res.status(200).json({
      success: true,
      verifiedAt: new Date().toISOString(),
      certificate: {
        certificateId:  cert.certificateId,
        candidateName:  cert.candidateName,
        courseName:     cert.courseName,
        internshipName: cert.internshipName,
        workshopName:   cert.workshopName,
        eventName:      cert.eventName,
        duration:       cert.duration,
        dateOfIssue:    cert.dateOfIssue,
        issuedBy:       cert.issuedBy,
        signatoryName:  cert.signatoryName,
        signatoryDesig: cert.signatoryDesig,
      },
      org: {
        logo:      logoSetting ? `/uploads/logos/${logoSetting.value}` : null,
        signature: sigSetting  ? `/uploads/signatures/${sigSetting.value}` : null,
      },
    });

  } catch (err) {
    console.error('[Verify Error]', err);
    return res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.',
    });
  }
});

module.exports = router;
