

const API_URL = 'http://localhost:4002/api/v2/assessment';

async function runScenario(scenarioName, initialData) {
  console.log(`\n======================================================`);
  console.log(`SCENARIO: ${scenarioName}`);
  console.log(`======================================================`);

  // Start Assessment
  let res = await fetch(`${API_URL}/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 'tester', initialData })
  });
  
  if (!res.ok) {
    console.error(`Failed to start: ${res.status}`);
    return;
  }
  
  let data = await res.json();
  const sessionId = data.sessionId;
  
  let questionsAsked = [];
  let currentQuestion = data.firstQuestion;

  while (currentQuestion) {
    questionsAsked.push(currentQuestion.questionId);
    
    // Provide a dummy answer based on type
    let answer = 'Yes';
    if (currentQuestion.type === 'number') answer = 100;
    else if (currentQuestion.type === 'text') answer = 'Test';
    else if (currentQuestion.options && currentQuestion.options.length > 0) {
       answer = currentQuestion.options[0];
    }
    
    // Evaluate with dummy answer to move to next question
    res = await fetch(`${API_URL}/${sessionId}/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers: { [currentQuestion.fieldName]: answer } })
    });
    
    data = await res.json();
    currentQuestion = data.nextQuestion;
    
    if (data.completed) {
      break;
    }
  }

  // Get Final Evaluation
  res = await fetch(`${API_URL}/${sessionId}/evaluate`, { method: 'POST' });
  const finalState = await res.json();

  console.log(`\nQuestions Asked (${questionsAsked.length}):`);
  console.log(questionsAsked.join(', '));
  
  const evalData = finalState.evaluation.recommendations;
  
  const activeGrants = [...evalData.readyNow, ...evalData.needsInformation];
  const rejectedGrants = [...evalData.hidden, ...evalData.windowClosed, ...evalData.prepareNext];
  
  console.log(`\nActive Grants (${activeGrants.length}):`);
  if (activeGrants.length > 0) console.log(Object.keys(activeGrants[0]), activeGrants[0].grant?.id);
  activeGrants.forEach(g => console.log(` - ${g.grant?.id || g.id || g.grantId} (${g.status || 'ACTIVE'})`));
  
  console.log(`\nRejected Grants (${rejectedGrants.length}):`);
  rejectedGrants.forEach(g => console.log(` - ${g.grant?.id || g.id || g.grantId} (${g.status || 'REJECTED'})`));
  
  console.log(`\nRecommendations:`);
  [...activeGrants, ...rejectedGrants].forEach(g => {
    console.log(`\nGRANT: ${g.grant?.id || g.id || g.grantId} [${g.status || 'UNKNOWN'}]`);
    console.log(`  Matched Rules: ${g.matchedRules?.length || 0}`);
    console.log(`  Failed Rules: ${g.failedRules?.length || 0}`);
    console.log(`  Missing Rules: ${g.missingRules?.length || 0}`);
    if (g.failedRules?.length > 0) {
      console.log(`  Failed Details:`, JSON.stringify(g.failedRules));
    }
  });
}

async function main() {
  await runScenario('Marketing', { purpose: 'Business Growth', projectType: 'Brand & Marketing' });
  await runScenario('Overseas Expansion', { purpose: 'Entering New Markets', planningOverseas: 'Yes' });
  await runScenario('Hiring Employees', { purpose: 'Hiring or Training', planningHiring: 'Yes' });
  await runScenario('Digital Transformation', { purpose: 'Productivity or IT', planningIT: 'Yes' });
}

main().catch(console.error);
