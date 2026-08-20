const ruleEngineService = require('../services/ruleEngineService');
const { asyncHandler } = require('../utils/asyncHandler');

const listRules = asyncHandler(async (_req, res) => {
  const rules = await ruleEngineService.listRules();
  res.json({ success: true, data: { rules, count: rules.length } });
});

const createRule = asyncHandler(async (req, res) => {
  const rule = await ruleEngineService.createRule(req.body, req.user);
  res.status(201).json({
    success: true,
    message: 'Rule created.',
    data: { rule },
  });
});

const updateRule = asyncHandler(async (req, res) => {
  const rule = await ruleEngineService.updateRule(req.params.id, req.body);
  res.json({
    success: true,
    message: 'Rule updated.',
    data: { rule },
  });
});

const deleteRule = asyncHandler(async (req, res) => {
  await ruleEngineService.deleteRule(req.params.id);
  res.json({ success: true, message: 'Rule deleted.' });
});

const draftRule = asyncHandler(async (req, res) => {
  const draft = await ruleEngineService.draftRuleFromNaturalLanguage(
    req.body.naturalLanguage
  );
  res.json({ success: true, data: { draft } });
});

const evaluate = asyncHandler(async (req, res) => {
  const result = await ruleEngineService.evaluateScenario({
    facts: req.body,
    explain: req.body.explain !== false,
  });
  res.json({ success: true, data: result });
});

const evaluateEmployee = asyncHandler(async (req, res) => {
  const result = await ruleEngineService.evaluateForEmployee(
    req.params.employeeId,
    req.body.requestedLeaves,
    req.body.explain !== false
  );
  res.json({ success: true, data: result });
});

module.exports = {
  listRules,
  createRule,
  updateRule,
  deleteRule,
  draftRule,
  evaluate,
  evaluateEmployee,
};
