const mongoose = require('mongoose');
const { RULE_ACTIONS } = require('../config/constants');

/**
 * A single comparison inside a rule condition.
 * Example: { field: 'casualLeavesTaken', operator: '<=', value: 12 }
 */
const conditionSchema = new mongoose.Schema(
  {
    field: {
      type: String,
      required: true,
      trim: true,
    },
    operator: {
      type: String,
      enum: ['==', '!=', '>', '>=', '<', '<='],
      required: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  { _id: false }
);

const ruleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Rule name is required'],
      trim: true,
      maxlength: 150,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },
    /**
     * How multiple conditions combine: all must match (AND) or any (OR).
     */
    logic: {
      type: String,
      enum: ['AND', 'OR'],
      default: 'AND',
    },
    conditions: {
      type: [conditionSchema],
      validate: {
        validator(arr) {
          return Array.isArray(arr) && arr.length > 0;
        },
        message: 'At least one condition is required',
      },
    },
    action: {
      type: String,
      enum: Object.values(RULE_ACTIONS),
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    /**
     * Original natural-language description if the rule was AI-generated.
     * Evaluation never uses this string — only conditions + logic.
     */
    naturalLanguageSource: {
      type: String,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    priority: {
      type: Number,
      default: 100,
    },
  },
  { timestamps: true }
);

ruleSchema.index({ isActive: 1, priority: 1 });

const Rule = mongoose.model('Rule', ruleSchema);

module.exports = Rule;
