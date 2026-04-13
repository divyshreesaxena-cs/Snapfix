const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  actorType: {
    type: String,
    enum: ['customer', 'worker', 'admin', 'system'],
    required: true,
  },
  actorId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },
  action: {
    type: String,
    required: true,
    trim: true,
  },
  entityType: {
    type: String,
    required: true,
    trim: true,
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  ip: {
    type: String,
    default: null,
  },
  userAgent: {
    type: String,
    default: null,
  },
  requestId: {
    type: String,
    default: null,
  },
}, { timestamps: true });

auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ actorType: 1, actorId: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
