const Rule = require('../models/Rule');
const Employee = require('../models/Employee');
const { ApiError } = require('../utils/ApiError');
const { RULE_ACTIONS } = require('../config/constants');
const { generateJson, generateTextOrNull, hasGeminiConfigured } = require('./aiService');
const {ruleGenerationPrompt,ruleExplanationPrompt} = require('../prompts/templates');

/**
 * Deterministic rule engine — AI never decides APPROVE/REJECT.
 * It only helps draft rules and explain outcomes.
 */
function evaluateCondition(condition, facts) {
  const left = facts[condition.field];
  const right = condition.value;

  if (left === undefined) {
    return false;
  }

  switch (condition.operator) {
    case '==':
      return String(left) === String(right);
    case '!=':
      return String(left) !== String(right);
    case '>':
      return Number(left) > Number(right);
    case '>=':
      return Number(left) >= Number(right);
    case '<':
      return Number(left) < Number(right);
    case '<=':
      return Number(left) <= Number(right);
    default:
      return false;
  }
}

function evaluateRule(rule, facts) {
  const results = rule.conditions.map((condition) => ({
    condition,
    matched: evaluateCondition(condition, facts),
  }));

  const matched =
    rule.logic === 'OR'
      ? results.some((r) => r.matched)
      : results.every((r) => r.matched);

  return {
    matched,
    matchedConditions: results.filter((r) => r.matched).map((r) => r.condition),
  };
}

async function createRule(payload, user) {
  return Rule.create({
    ...payload,
    createdBy: user._id,
  });
}

async function updateRule(ruleId, payload) {
  const rule = await Rule.findByIdAndUpdate(ruleId, payload, {
    new: true,
    runValidators: true,
  });
  if (!rule) {
    throw new ApiError(404, 'Rule not found.');
  }
  return rule;
}

async function listRules() {
  return Rule.find().sort({ priority: 1, createdAt: -1 });
}

async function deleteRule(ruleId) {
  const rule = await Rule.findByIdAndDelete(ruleId);
  if (!rule) {
    throw new ApiError(404, 'Rule not found.');
  }
  return { deleted: true };
}

async function draftRuleFromNaturalLanguage(naturalLanguage) {
  if (!naturalLanguage?.trim()) {
    throw new ApiError(400, 'Natural language rule text is required.');
  }

  if (!hasGeminiConfigured()) {
    // Simple heuristic draft so the feature remains usable without Gemini
    return {
      name: 'Draft rule',
      description: naturalLanguage.trim(),
      logic: 'AND',
      conditions: [
        { field: 'requestedLeaves', operator: '>', value: 5 },
      ],
      action: RULE_ACTIONS.REJECT,
      naturalLanguageSource: naturalLanguage.trim(),
      draftNote:
        'Local heuristic draft. Add GEMINI_API_KEY for accurate natural-language conversion.',
    };
  }

  const drafted = await generateJson(
    ruleGenerationPrompt({ naturalLanguage: naturalLanguage.trim() })
  );

  return {
    ...drafted,
    naturalLanguageSource: naturalLanguage.trim(),
  };
}

async function evaluateScenario({ facts, explain = true }) {
  const required = [
    'casualLeavesTaken',
    'requestedLeaves',
    'employeeType',
    'department',
  ];

  for (const key of required) {
    if (facts[key] === undefined || facts[key] === null || facts[key] === '') {
      throw new ApiError(400, `Missing field: ${key}`);
    }
  }

  const normalizedFacts = {
    casualLeavesTaken: Number(facts.casualLeavesTaken),
    medicalLeavesTaken: Number(facts.medicalLeavesTaken || 0),
    wfhDaysUsed: Number(facts.wfhDaysUsed || 0),
    requestedLeaves: Number(facts.requestedLeaves),
    employeeType: facts.employeeType,
    department: facts.department,
    role: facts.role || 'employee',
    // Convenience derived field used by sample rules
    leavesTakenPlusRequested:
      Number(facts.casualLeavesTaken) + Number(facts.requestedLeaves),
  };

  // Allow rules to use either naming style
  normalizedFacts.LeavesTaken = normalizedFacts.casualLeavesTaken;
  normalizedFacts.RequestedLeaves = normalizedFacts.requestedLeaves;
  normalizedFacts['Employee Type'] = normalizedFacts.employeeType;

  const rules = await Rule.find({ isActive: true }).sort({ priority: 1 });

  const evaluations = [];
  let finalAction = RULE_ACTIONS.APPROVE;
  let appliedRule = null;
  let matchedConditions = [];

  for (const rule of rules) {
    const result = evaluateRule(rule, normalizedFacts);
    evaluations.push({
      ruleId: rule._id,
      name: rule.name,
      matched: result.matched,
      action: rule.action,
    });

    if (result.matched) {
      appliedRule = rule;
      matchedConditions = result.matchedConditions;
      finalAction = rule.action;
      // First matching rule by priority wins (simple engine)
      break;
    }
  }

  let explanation = `Decision: ${finalAction}.`;
  if (explain) {
    if (appliedRule) {
      const aiExplanation = await generateTextOrNull(
        ruleExplanationPrompt({
          ruleName: appliedRule.name,
          action: finalAction,
          facts: normalizedFacts,
          matchedConditions,
        })
      );
      explanation =
        aiExplanation ||
        `Result ${finalAction} because rule "${appliedRule.name}" matched. Review your leave balances and employee type against the configured conditions.`;
    } else {
      explanation =
        'No restrictive rule matched, so the request is approved by default.';
    }
  }

  return {
    action: finalAction,
    appliedRule: appliedRule
      ? { id: appliedRule._id, name: appliedRule.name }
      : null,
    matchedConditions,
    explanation,
    evaluations,
    facts: normalizedFacts,
  };
}

async function evaluateForEmployee(employeeId, requestedLeaves, explain = true) {
  const employee = await Employee.findById(employeeId);
  if (!employee) {
    throw new ApiError(404, 'Employee not found.');
  }

  return evaluateScenario({
    facts: {
      casualLeavesTaken: employee.casualLeavesTaken,
      medicalLeavesTaken: employee.medicalLeavesTaken,
      wfhDaysUsed: employee.wfhDaysUsed,
      requestedLeaves,
      employeeType: employee.employeeType,
      department: employee.department,
      role: employee.role,
    },
    explain,
  });
}

module.exports = {
  createRule,
  updateRule,
  listRules,
  deleteRule,
  draftRuleFromNaturalLanguage,
  evaluateScenario,
  evaluateForEmployee,
  evaluateRule,
  evaluateCondition,
};
