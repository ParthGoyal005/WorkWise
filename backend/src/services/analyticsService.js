const User = require('../models/User');
const Document = require('../models/Document');
const Chat = require('../models/Chat');
const DocumentSummary = require('../models/DocumentSummary');
const { ACCESS_TYPES } = require('../config/constants');

async function getAnalytics() {
  const [
    userCount,
    documentCount,
    chatCount,
    summaryCount,
    restrictedCount,
    topDocuments,
    accessStats,
    recentQuestions,
  ] = await Promise.all([
    User.countDocuments(),
    Document.countDocuments(),
    Chat.countDocuments(),
    DocumentSummary.countDocuments(),
    Document.countDocuments({
      'permissions.accessType': { $ne: ACCESS_TYPES.PUBLIC },
    }),
    Document.find().sort({ viewCount: -1 }).limit(5).select('name viewCount department'),
    Document.aggregate([
      {
        $group: {
          _id: '$permissions.accessType',
          count: { $sum: 1 },
        },
      },
    ]),
    Chat.aggregate([
      { $match: { lastQuestion: { $ne: null } } },
      {
        $group: {
          _id: '$lastQuestion',
          count: { $sum: 1 },
          lastAsked: { $max: '$updatedAt' },
        },
      },
      { $sort: { count: -1, lastAsked: -1 } },
      { $limit: 8 },
    ]),
  ]);

  return {
    userCount,
    documentCount,
    chatCount,
    summaryCount,
    restrictedDocuments: restrictedCount,
    mostViewedDocuments: topDocuments,
    documentAccessStats: accessStats.map((item) => ({
      accessType: item._id || 'unknown',
      count: item.count,
    })),
    mostAskedQuestions: recentQuestions.map((item) => ({
      question: item._id,
      count: item.count,
      lastAsked: item.lastAsked,
    })),
  };
}

module.exports = { getAnalytics };
