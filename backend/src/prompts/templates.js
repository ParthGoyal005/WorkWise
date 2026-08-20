function questionAnsweringPrompt({ question, context }) {
  return `You are an enterprise knowledge assistant. Answer the employee's question using ONLY the provided document context.

Rules:
- Prefer answering from any relevant detail in the context, even if wording differs from the question.
- If several sources conflict, prefer the clearest numeric/policy statement and say which source you used.
- Only say you could not find accessible information if NOTHING in the context supports an answer.
- Do not invent policies or numbers that are not in the context.
- Be clear and concise.
- Mention which source document names support your answer when possible.

Context:
${context || '(no accessible context)'}

Question:
${question}

Answer:`;
}

function documentSummaryPrompt({ documentName, text }) {
  return `You are summarizing a company policy document for employees.

Write a SHORT abstract only (3-5 sentences).
Do NOT copy or paste large sections of the document.
Do NOT repeat the full document text.
Focus on: key rules, numeric limits, approval process, and employee responsibilities.

Document name: ${documentName}

Document text (for your reference only — do not reproduce it verbatim):
${text.slice(0, 12000)}

Return only the summary paragraph(s), nothing else.`;
}

function documentComparisonPrompt({ docAName, docBName, contextA, contextB }) {
  return `Compare these two company documents for an employee audience.

Document A: ${docAName}
Context A:
${contextA}

Document B: ${docBName}
Context B:
${contextB}

Return a JSON object with exactly these keys:
{
  "similarities": ["..."],
  "differences": ["..."],
  "importantRules": ["..."],
  "summary": "..."
}

JSON only, no markdown.`;
}

function ruleGenerationPrompt({ naturalLanguage }) {
  return `Convert this business rule into structured JSON for a simple rule engine.

Natural language:
"${naturalLanguage}"

Allowed fields: casualLeavesTaken, medicalLeavesTaken, wfhDaysUsed, requestedLeaves, employeeType, department, role
Allowed operators: ==, !=, >, >=, <, <=
Allowed actions: APPROVE, REJECT, MANUAL_REVIEW
Logic: AND or OR

Return JSON only in this shape:
{
  "name": "short name",
  "description": "one sentence",
  "logic": "AND",
  "conditions": [{ "field": "casualLeavesTaken", "operator": "<=", "value": 12 }],
  "action": "APPROVE"
}`;
}

function ruleExplanationPrompt({ ruleName, action, facts, matchedConditions }) {
  return `Explain this rule-engine result in friendly language for an employee.
Do NOT change the decision. Only explain why it happened.

Rule: ${ruleName}
Decision: ${action}
Employee facts: ${JSON.stringify(facts)}
Matched conditions: ${JSON.stringify(matchedConditions)}

Explanation:`;
}

module.exports = {
  questionAnsweringPrompt,
  documentSummaryPrompt,
  documentComparisonPrompt,
  ruleGenerationPrompt,
  ruleExplanationPrompt,
};
