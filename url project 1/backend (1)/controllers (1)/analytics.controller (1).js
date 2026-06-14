const Url = require('../models/Url');
const ClickLog = require('../models/ClickLog');
const mongoose = require('mongoose');

// @route   GET api/analytics/overview
// @desc    Get global analytics overview for current user
// @access  Private
exports.getOverviewStats = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    // Get all URLs owned by user
    const userUrls = await Url.find({ user: userId });
    const totalLinks = userUrls.length;

    // Sum of clicks across all URLs
    const totalClicks = userUrls.reduce((sum, url) => sum + url.clicksCount, 0);

    // Top 5 performing links
    const topLinks = await Url.find({ user: userId })
      .sort({ clicksCount: -1 })
      .limit(5);

    // Get user's URL IDs for click logs
    const urlIds = userUrls.map(url => url._id);

    // Recent activity across all user's links
    const recentActivity = await ClickLog.find({ urlId: { $in: urlIds } })
      .sort({ timestamp: -1 })
      .limit(10)
      .populate('urlId', 'shortCode title originalUrl');

    // Aggregate Click History across all user URLs for the last 14 days
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    fourteenDaysAgo.setHours(0, 0, 0, 0);

    const dailyClicks = await ClickLog.aggregate([
      {
        $match: {
          urlId: { $in: urlIds },
          timestamp: { $gte: fourteenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          clicks: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const clickHistoryMap = {};
    dailyClicks.forEach(item => {
      clickHistoryMap[item._id] = item.clicks;
    });

    const clickHistory = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      clickHistory.push({
        date: dateStr,
        clicks: clickHistoryMap[dateStr] || 0
      });
    }

    res.json({
      totalLinks,
      totalClicks,
      topLinks,
      recentActivity,
      clickHistory
    });
  } catch (err) {
    console.error('Overview Stats Error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @route   GET api/analytics/url/:urlId
// @desc    Get detailed stats for a specific URL
// @access  Private
exports.getUrlStats = async (req, res) => {
  try {
    const { urlId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(urlId)) {
      return res.status(400).json({ message: 'Invalid URL ID' });
    }

    const url = await Url.findById(urlId);

    if (!url) {
      return res.status(404).json({ message: 'URL not found' });
    }

    // Verify user owns the URL
    if (url.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Get last visited timestamp
    const lastVisit = await ClickLog.findOne({ urlId: url._id })
      .sort({ timestamp: -1 })
      .select('timestamp');

    // Get recent 20 visit logs
    const recentHistory = await ClickLog.find({ urlId: url._id })
      .sort({ timestamp: -1 })
      .limit(20);

    // Aggregate device distribution
    const deviceStats = await ClickLog.aggregate([
      { $match: { urlId: url._id } },
      { $group: { _id: '$device', count: { $sum: 1 } } },
      { $project: { name: '$_id', value: '$count', _id: 0 } }
    ]);

    // Aggregate browser distribution
    const browserStats = await ClickLog.aggregate([
      { $match: { urlId: url._id } },
      { $group: { _id: '$browser', count: { $sum: 1 } } },
      { $project: { name: '$_id', value: '$count', _id: 0 } }
    ]);

    // Aggregate OS distribution
    const osStats = await ClickLog.aggregate([
      { $match: { urlId: url._id } },
      { $group: { _id: '$os', count: { $sum: 1 } } },
      { $project: { name: '$_id', value: '$count', _id: 0 } }
    ]);

    // Aggregate Click History for the last 14 days
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    fourteenDaysAgo.setHours(0, 0, 0, 0);

    const dailyClicks = await ClickLog.aggregate([
      {
        $match: {
          urlId: url._id,
          timestamp: { $gte: fourteenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          clicks: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Fill in days with 0 clicks so the line chart is continuous
    const clickHistoryMap = {};
    dailyClicks.forEach(item => {
      clickHistoryMap[item._id] = item.clicks;
    });

    const clickHistory = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      clickHistory.push({
        date: dateStr,
        clicks: clickHistoryMap[dateStr] || 0
      });
    }

    res.json({
      url,
      clicksCount: url.clicksCount,
      lastVisited: lastVisit ? lastVisit.timestamp : null,
      deviceStats,
      browserStats,
      osStats,
      clickHistory,
      recentHistory
    });
  } catch (err) {
    console.error('URL Stats Error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @route   GET api/analytics/public/:shortCode
// @desc    Get detailed stats publicly (unauthenticated) for a specific shortCode
// @access  Public
exports.getPublicUrlStats = async (req, res) => {
  try {
    const { shortCode } = req.params;

    const url = await Url.findOne({ shortCode });

    if (!url) {
      return res.status(404).json({ message: 'URL not found' });
    }

    // Verify it is public
    if (!url.isPublicStats) {
      return res.status(403).json({ message: 'This stats dashboard is private.' });
    }

    // Get last visited timestamp
    const lastVisit = await ClickLog.findOne({ urlId: url._id })
      .sort({ timestamp: -1 })
      .select('timestamp');

    // Get recent 20 visit logs
    const recentHistory = await ClickLog.find({ urlId: url._id })
      .sort({ timestamp: -1 })
      .limit(20);

    // Aggregate device distribution
    const deviceStats = await ClickLog.aggregate([
      { $match: { urlId: url._id } },
      { $group: { _id: '$device', count: { $sum: 1 } } },
      { $project: { name: '$_id', value: '$count', _id: 0 } }
    ]);

    // Aggregate browser distribution
    const browserStats = await ClickLog.aggregate([
      { $match: { urlId: url._id } },
      { $group: { _id: '$browser', count: { $sum: 1 } } },
      { $project: { name: '$_id', value: '$count', _id: 0 } }
    ]);

    // Aggregate OS distribution
    const osStats = await ClickLog.aggregate([
      { $match: { urlId: url._id } },
      { $group: { _id: '$os', count: { $sum: 1 } } },
      { $project: { name: '$_id', value: '$count', _id: 0 } }
    ]);

    // Aggregate Click History for the last 14 days
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    fourteenDaysAgo.setHours(0, 0, 0, 0);

    const dailyClicks = await ClickLog.aggregate([
      {
        $match: {
          urlId: url._id,
          timestamp: { $gte: fourteenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          clicks: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const clickHistoryMap = {};
    dailyClicks.forEach(item => {
      clickHistoryMap[item._id] = item.clicks;
    });

    const clickHistory = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      clickHistory.push({
        date: dateStr,
        clicks: clickHistoryMap[dateStr] || 0
      });
    }

    res.json({
      url: {
        title: url.title,
        shortCode: url.shortCode,
        originalUrl: url.originalUrl,
        createdAt: url.createdAt,
        isPublicStats: url.isPublicStats
      },
      clicksCount: url.clicksCount,
      lastVisited: lastVisit ? lastVisit.timestamp : null,
      deviceStats,
      browserStats,
      osStats,
      clickHistory,
      recentHistory
    });
  } catch (err) {
    console.error('Public URL Stats Error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};
