const Url = require('../models/Url');
const ClickLog = require('../models/ClickLog');
const UAParser = require('ua-parser-js');

// @route   GET /:shortCode
// @desc    Redirect short code to original URL and log analytics
// @access  Public
exports.handleRedirect = async (req, res) => {
  const { shortCode } = req.params;

  try {
    // Find URL by shortCode (this handles customAlias too since shortCode matches customAlias on creation)
    const url = await Url.findOne({ shortCode });

    if (!url) {
      // Redirect to frontend with an error code, or show clean HTML
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Link Not Found</title>
          <style>
            body { background-color: #0f172a; color: #f8fafc; font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
            .card { background: rgba(30, 41, 59, 0.7); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.1); padding: 2.5rem; border-radius: 12px; text-align: center; max-width: 400px; box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5); }
            h1 { color: #f43f5e; margin-top: 0; font-size: 1.8rem; }
            p { color: #94a3b8; line-height: 1.5; margin-bottom: 1.5rem; }
            a { display: inline-block; background: linear-gradient(135deg, #06b6d4, #3b82f6); color: white; text-decoration: none; padding: 0.75rem 1.5rem; border-radius: 6px; font-weight: bold; transition: opacity 0.2s; }
            a:hover { opacity: 0.9; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>404 - Link Not Found</h1>
            <p>The shortened link you are trying to access does not exist or has been removed by its owner.</p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}">Go to Dashboard</a>
          </div>
        </body>
        </html>
      `);
    }

    // Check manual active status
    if (!url.isActive) {
      return res.status(403).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Link Inactive</title>
          <style>
            body { background-color: #0f172a; color: #f8fafc; font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
            .card { background: rgba(30, 41, 59, 0.7); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.1); padding: 2.5rem; border-radius: 12px; text-align: center; max-width: 400px; box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5); }
            h1 { color: #ef4444; margin-top: 0; font-size: 1.8rem; }
            p { color: #94a3b8; line-height: 1.5; margin-bottom: 1.5rem; }
            a { display: inline-block; background: linear-gradient(135deg, #06b6d4, #3b82f6); color: white; text-decoration: none; padding: 0.75rem 1.5rem; border-radius: 6px; font-weight: bold; transition: opacity 0.2s; }
            a:hover { opacity: 0.9; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Link Inactive</h1>
            <p>This shortened link has been temporarily deactivated or closed by its owner.</p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}">Go to Dashboard</a>
          </div>
        </body>
        </html>
      `);
    }

    // Check expiration
    if (url.expiresAt && url.expiresAt < new Date()) {
      return res.status(410).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Link Expired</title>
          <style>
            body { background-color: #0f172a; color: #f8fafc; font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
            .card { background: rgba(30, 41, 59, 0.7); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.1); padding: 2.5rem; border-radius: 12px; text-align: center; max-width: 400px; box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5); }
            h1 { color: #eab308; margin-top: 0; font-size: 1.8rem; }
            p { color: #94a3b8; line-height: 1.5; margin-bottom: 1.5rem; }
            a { display: inline-block; background: linear-gradient(135deg, #06b6d4, #3b82f6); color: white; text-decoration: none; padding: 0.75rem 1.5rem; border-radius: 6px; font-weight: bold; transition: opacity 0.2s; }
            a:hover { opacity: 0.9; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Link Expired</h1>
            <p>This shortened link reached its expiration date and is no longer active.</p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}">Go to Dashboard</a>
          </div>
        </body>
        </html>
      `);
    }

    // Increment click count
    url.clicksCount += 1;
    await url.save();

    // Log Analytics asynchronously
    const userAgentString = req.headers['user-agent'] || '';
    const parser = new UAParser(userAgentString);
    const parsedAgent = parser.getResult();

    const browser = parsedAgent.browser.name || 'Unknown';
    const os = parsedAgent.os.name || 'Unknown';
    
    let device = parsedAgent.device.type || 'Desktop';
    if (!parsedAgent.device.type) {
      if (/mobile/i.test(userAgentString)) {
        device = 'Mobile';
      } else if (/tablet|ipad/i.test(userAgentString)) {
        device = 'Tablet';
      } else {
        device = 'Desktop';
      }
    } else {
      device = device.charAt(0).toUpperCase() + device.slice(1);
    }

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown';
    const referrer = req.headers['referer'] || req.headers['referrer'] || 'Direct';

    const clickLog = new ClickLog({
      urlId: url._id,
      ip,
      userAgent: userAgentString,
      browser,
      os,
      device,
      referrer
    });

    // Save click log in background
    clickLog.save().catch(err => console.error('Failed to log click details:', err.message));

    // Redirect to original URL
    res.redirect(302, url.originalUrl);
  } catch (err) {
    console.error('Redirect Error:', err.message);
    res.status(500).send('Server error');
  }
};