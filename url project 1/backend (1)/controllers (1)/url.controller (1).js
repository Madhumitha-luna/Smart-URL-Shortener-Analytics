const Url = require('../models/Url');
const ClickLog = require('../models/ClickLog');
const crypto = require('crypto');
const fs = require('fs');
const csv = require('csv-parser');

// Helper to generate random short code
const generateShortCode = (length = 6) => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
};

// Helper to clean and validate URL format
const isValidUrl = (urlString) => {
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
};

// Helper to extract a friendly title from URL if none provided
const getFriendlyTitle = (urlString) => {
  try {
    const url = new URL(urlString);
    let title = url.hostname.replace('www.', '');
    if (url.pathname && url.pathname !== '/') {
      title += url.pathname.substring(0, 15);
    }
    return title;
  } catch (_) {
    return urlString;
  }
};

// @route   POST api/urls
// @desc    Create a shortened URL
// @access  Private
exports.createUrl = async (req, res) => {
  const { originalUrl, customAlias, expiresAt } = req.body;

  // Validate URL presence
  if (!originalUrl) {
    return res.status(400).json({ message: 'Original URL is required' });
  }

  // Validate URL format
  if (!isValidUrl(originalUrl)) {
    return res.status(400).json({ message: 'Please provide a valid HTTP or HTTPS URL' });
  }

  try {
    let shortCode;

    // Handle Custom Alias
    if (customAlias) {
      const alias = customAlias.trim();
      
      // Validation for custom alias characters (alphanumeric and hyphens only)
      const aliasRegex = /^[a-zA-Z0-9-_]+$/;
      if (!aliasRegex.test(alias)) {
        return res.status(400).json({ message: 'Custom alias must contain only letters, numbers, hyphens, and underscores' });
      }

      if (alias.length < 3 || alias.length > 20) {
        return res.status(400).json({ message: 'Custom alias must be between 3 and 20 characters' });
      }

      // Check if alias is already in use
      const existingAlias = await Url.findOne({
        $or: [{ shortCode: alias }, { customAlias: alias }]
      });
      if (existingAlias) {
        return res.status(400).json({ message: 'Custom alias or short code is already taken' });
      }

      shortCode = alias;
    } else {
      // Generate unique short code
      let isUnique = false;
      let attempts = 0;
      while (!isUnique && attempts < 10) {
        shortCode = generateShortCode(6);
        const existingCode = await Url.findOne({ shortCode });
        if (!existingCode) {
          isUnique = true;
        }
        attempts++;
      }

      if (!isUnique) {
        return res.status(500).json({ message: 'Failed to generate unique short code. Please try again.' });
      }
    }

    // Prepare Expiry Date
    let parsedExpiry = null;
    if (expiresAt) {
      parsedExpiry = new Date(expiresAt);
      if (isNaN(parsedExpiry.getTime())) {
        return res.status(400).json({ message: 'Invalid expiry date format' });
      }
      if (parsedExpiry < new Date()) {
        return res.status(400).json({ message: 'Expiry date must be in the future' });
      }
    }

    const friendlyTitle = getFriendlyTitle(originalUrl);

    // Create and save
    const newUrl = new Url({
      user: req.user.id,
      originalUrl,
      shortCode,
      customAlias: customAlias ? customAlias.trim() : undefined,
      title: friendlyTitle,
      expiresAt: parsedExpiry
    });

    await newUrl.save();
    res.status(201).json(newUrl);
  } catch (err) {
    console.error('Create URL Error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @route   GET api/urls
// @desc    Get all URLs for authenticated user
// @access  Private
exports.getUserUrls = async (req, res) => {
  try {
    const urls = await Url.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(urls);
  } catch (err) {
    console.error('GetUserUrls Error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @route   PUT api/urls/:id
// @desc    Edit destination URL of shortened code
// @access  Private
exports.updateUrl = async (req, res) => {
  const { originalUrl, shortCode } = req.body;

  if (!originalUrl) {
    return res.status(400).json({ message: 'Destination URL is required' });
  }

  if (!isValidUrl(originalUrl)) {
    return res.status(400).json({ message: 'Please provide a valid HTTP or HTTPS URL' });
  }

  try {
    let url = await Url.findById(req.params.id);

    if (!url) {
      return res.status(404).json({ message: 'URL not found' });
    }

    // Make sure user owns the URL
    if (url.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Handle shortCode update if provided and changed
    if (shortCode && shortCode !== url.shortCode) {
      const alias = shortCode.trim();
      const aliasRegex = /^[a-zA-Z0-9-_]+$/;
      if (!aliasRegex.test(alias)) {
        return res.status(400).json({ message: 'Shortened code/alias must contain only letters, numbers, hyphens, and underscores' });
      }

      if (alias.length < 3 || alias.length > 20) {
        return res.status(400).json({ message: 'Shortened code/alias must be between 3 and 20 characters' });
      }

      // Check if code is already in use by another link
      const existing = await Url.findOne({
        _id: { $ne: url._id },
        $or: [{ shortCode: alias }, { customAlias: alias }]
      });
      if (existing) {
        return res.status(400).json({ message: 'This shortened code or custom alias is already taken' });
      }

      url.shortCode = alias;
      url.customAlias = alias; // Sync customAlias field
    }

    url.originalUrl = originalUrl;
    url.title = getFriendlyTitle(originalUrl);
    await url.save();

    res.json(url);
  } catch (err) {
    console.error('Update URL Error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @route   DELETE api/urls/:id
// @desc    Delete a shortened URL and its analytics
// @access  Private
exports.deleteUrl = async (req, res) => {
  try {
    const url = await Url.findById(req.params.id);

    if (!url) {
      return res.status(404).json({ message: 'URL not found' });
    }

    // Make sure user owns the URL
    if (url.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Delete associated logs
    await ClickLog.deleteMany({ urlId: url._id });

    // Delete the URL itself
    await Url.findByIdAndDelete(req.params.id);

    res.json({ message: 'URL and analytics deleted successfully' });
  } catch (err) {
    console.error('Delete URL Error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @route   POST api/urls/bulk
// @desc    Bulk shorten URLs via CSV upload
// @access  Private
exports.bulkShorten = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Please upload a CSV file' });
  }

  const filePath = req.file.path;
  const results = [];
  const errors = [];
  const successList = [];

  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      // Delete temporary uploaded file
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error('Failed to clean up temp file:', err.message);
      }

      for (let i = 0; i < results.length; i++) {
        const row = results[i];
        // headers can be: originalUrl, customAlias, expiresAt (case insensitive check)
        const originalUrlKey = Object.keys(row).find(k => k.toLowerCase() === 'originalurl');
        const customAliasKey = Object.keys(row).find(k => k.toLowerCase() === 'customalias');
        const expiresAtKey = Object.keys(row).find(k => k.toLowerCase() === 'expiresat');

        const originalUrl = originalUrlKey ? row[originalUrlKey] : null;
        const customAlias = customAliasKey ? row[customAliasKey] : null;
        const expiresAt = expiresAtKey ? row[expiresAtKey] : null;

        if (!originalUrl) {
          errors.push({ row: i + 1, message: 'Missing originalUrl column value' });
          continue;
        }

        if (!isValidUrl(originalUrl)) {
          errors.push({ row: i + 1, url: originalUrl, message: 'Invalid URL format' });
          continue;
        }

        try {
          let shortCode;
          if (customAlias && customAlias.trim()) {
            const alias = customAlias.trim();
            const aliasRegex = /^[a-zA-Z0-9-_]+$/;
            if (!aliasRegex.test(alias)) {
              errors.push({ row: i + 1, url: originalUrl, message: `Invalid alias character: ${alias}` });
              continue;
            }

            const existingAlias = await Url.findOne({
              $or: [{ shortCode: alias }, { customAlias: alias }]
            });
            if (existingAlias) {
              errors.push({ row: i + 1, url: originalUrl, message: `Alias already in use: ${alias}` });
              continue;
            }
            shortCode = alias;
          } else {
            let isUnique = false;
            let attempts = 0;
            while (!isUnique && attempts < 10) {
              shortCode = generateShortCode(6);
              const existingCode = await Url.findOne({ shortCode });
              if (!existingCode) {
                isUnique = true;
              }
              attempts++;
            }
            if (!isUnique) {
              errors.push({ row: i + 1, url: originalUrl, message: 'Failed to generate unique short code' });
              continue;
            }
          }

          let parsedExpiry = null;
          if (expiresAt && expiresAt.trim()) {
            parsedExpiry = new Date(expiresAt);
            if (isNaN(parsedExpiry.getTime())) {
              errors.push({ row: i + 1, url: originalUrl, message: 'Invalid expiry date format' });
              continue;
            }
            if (parsedExpiry < new Date()) {
              errors.push({ row: i + 1, url: originalUrl, message: 'Expiry date must be in the future' });
              continue;
            }
          }

          const friendlyTitle = getFriendlyTitle(originalUrl);
          const newUrl = new Url({
            user: req.user.id,
            originalUrl,
            shortCode,
            customAlias: (customAlias && customAlias.trim()) ? customAlias.trim() : undefined,
            title: friendlyTitle,
            expiresAt: parsedExpiry
          });

          await newUrl.save();
          successList.push(newUrl);
        } catch (err) {
          errors.push({ row: i + 1, url: originalUrl, message: err.message });
        }
      }

      res.status(200).json({
        message: `Processed ${results.length} rows. Successful: ${successList.length}, Failed: ${errors.length}`,
        successCount: successList.length,
        failCount: errors.length,
        errors,
        urls: successList
      });
    });
};

// @route   PATCH api/urls/:id/toggle-public
// @desc    Toggle public/private stats setting for a URL
// @access  Private
exports.togglePublicStats = async (req, res) => {
  try {
    const url = await Url.findById(req.params.id);

    if (!url) {
      return res.status(404).json({ message: 'URL not found' });
    }

    // Ensure owner
    if (url.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    url.isPublicStats = !url.isPublicStats;
    await url.save();

    res.json({
      message: `Stats page is now ${url.isPublicStats ? 'public' : 'private'}`,
      url
    });
  } catch (err) {
    console.error('Toggle Public Stats Error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @route   PATCH api/urls/:id/toggle-active
// @desc    Toggle active/inactive redirect status for a URL
// @access  Private
exports.toggleActiveStatus = async (req, res) => {
  try {
    const url = await Url.findById(req.params.id);

    if (!url) {
      return res.status(404).json({ message: 'URL not found' });
    }

    // Ensure owner
    if (url.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    url.isActive = !url.isActive;
    await url.save();

    res.json({
      message: `Link is now ${url.isActive ? 'active' : 'inactive'}`,
      url
    });
  } catch (err) {
    console.error('Toggle Active Status Error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};
