// using native fetch

async function test() {
  const startRes = await fetch("http://localhost:4002/api/v2/assessment/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: "audit-test-user",
      payload: {
        purpose: ["Expansion", "Business Growth"],
        companyAgeMonths: 60
      }
    })
  });
  const startData = await startRes.json();
  console.log("startData:", startData);
  const sessionId = startData.sessionId;


  // 2. Submit Answers (to trigger rejection in some grants)
  await fetch(`http://localhost:4002/api/v2/assessment/${sessionId}/answer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      answers: {
        "dynamicAnswers.localShareholding": "10"
      }
    })
  });

  // 3. Get Result
  const res = await fetch(`http://localhost:4002/api/v2/assessment/${sessionId}/evaluate`, {
    method: "POST"
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

test();
