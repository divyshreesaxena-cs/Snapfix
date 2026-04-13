const AuditLog = require('../models/AuditLog');
const logger = require('../utils/logger');

const createAuditLog = async ({ actorType = 'system', actorId = null, action, entityType, entityId = null, metadata = {}, req = null }) => {
  try {
    return await AuditLog.create({
      actorType,
      actorId,
      action,
      entityType,
      entityId,
      metadata,
      ip: req?.ip || null,
      userAgent: req?.get?.('user-agent') || null,
      requestId: req?.requestId || null,
    });
  } catch (error) {
    logger.error('Failed to persist audit log', { action, entityType, entityId, error, requestId: req?.requestId });
    return null;
  }
};

module.exports = { createAuditLog };
