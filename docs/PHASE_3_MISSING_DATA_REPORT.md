# Phase 3: Missing Data Stress Testing Report

### Scenario 1. Missing Local Shareholding
- **Expected:** Potentially Eligible
- **Actual:** Potentially Eligible
- **Result:** PASS

---

### Scenario 2. Missing Current Ratio
- **Expected:** Potentially Eligible
- **Actual:** Potentially Eligible
- **Result:** PASS

---

### Scenario 3. Missing Retained Earnings
- **Expected:** Potentially Eligible
- **Actual:** Potentially Eligible
- **Result:** PASS

---

### Scenario 4. Missing Financial Viability
- **Expected:** Potentially Eligible
- **Actual:** Potentially Eligible
- **Result:** PASS

---

### Scenario 5. Missing Project Started
- **Expected:** Potentially Eligible
- **Actual:** Potentially Eligible
- **Result:** PASS

---

### Scenario 6. Missing Related Party Vendor
- **Expected:** Potentially Eligible
- **Actual:** Potentially Eligible
- **Result:** PASS

---

### Scenario 7. Missing Marketing Type
- **Expected:** Potentially Eligible
- **Actual:** Potentially Eligible
- **Result:** PASS

---

### Scenario 8. Automation selected BUT Software / Hardware NOT answered
- **Expected:** Potentially Eligible
- **Actual:** Potentially Eligible
- **Result:** PASS

---

### Scenario 9. Automation Type answered BUT Spend Band missing
- **Expected:** Potentially Eligible
- **Actual:** Potentially Eligible
- **Result:** PASS

---

### Scenario 10. Target Market missing
- **Expected:** Potentially Eligible
- **Actual:** Potentially Eligible
- **Result:** PASS

---

### Scenario 11. New Market missing
- **Expected:** Potentially Eligible
- **Actual:** Potentially Eligible
- **Result:** PASS

---

### Scenario 12. Overseas Sales missing
- **Expected:** Potentially Eligible
- **Actual:** Potentially Eligible
- **Result:** PASS

---

### Scenario 13. Activity Type missing
- **Expected:** Potentially Eligible
- **Actual:** Potentially Eligible
- **Result:** PASS

---

### Scenario 14. Already Purchased missing (PSG)
- **Expected:** Potentially Eligible
- **Actual:** Potentially Eligible
- **Result:** PASS

---

### Scenario 15. Pre-approved Solution missing
- **Expected:** Potentially Eligible
- **Actual:** Potentially Eligible
- **Result:** PASS

---

### Scenario 16. Candidate Age missing
- **Expected:** Potentially Eligible
- **Actual:** Potentially Eligible
- **Result:** PASS

---

### Scenario 17. Citizen / PR missing
- **Expected:** Potentially Eligible
- **Actual:** Potentially Eligible
- **Result:** PASS

---

### Scenario 18. Shareholder status missing
- **Expected:** Potentially Eligible
- **Actual:** Potentially Eligible
- **Result:** PASS

---

### Scenario 19. Ex-Employee status missing
- **Expected:** Potentially Eligible
- **Actual:** Potentially Eligible
- **Result:** PASS

---

### Scenario 20. Local Employee Count missing
- **Expected:** Potentially Eligible
- **Actual:** Potentially Eligible
- **Result:** PASS

---

### Scenario 21. Consultant missing
- **Expected:** Potentially Eligible
- **Actual:** Potentially Eligible
- **Result:** PASS

---

### Scenario 22. Company Age missing
- **Expected:** Potentially Eligible
- **Actual:** Potentially Eligible
- **Result:** PASS

---

### Scenario 23. First Registered Business missing
- **Expected:** Potentially Eligible
- **Actual:** Potentially Eligible
- **Result:** PASS

---

### Scenario 24. Already Purchased missing (EEG)
- **Expected:** Potentially Eligible
- **Actual:** Potentially Eligible
- **Result:** PASS

---

### Scenario 25. Eligible Sector missing
- **Expected:** Potentially Eligible
- **Actual:** INCORRECT REJECTION (Found in Not Eligible)
- **Result:** FAIL
- **Reason:** Missing data improperly triggered rejection for EEG.

---

### Scenario 26. Training Committee missing
- **Expected:** Prepare Next
- **Actual:** Prepare Next
- **Result:** PASS

---

### Scenario 27. Innovation Project missing
- **Expected:** Potentially Eligible
- **Actual:** Potentially Eligible
- **Result:** PASS

---

### Scenario 28. Blank Application Test
- **Expected:** No grant should become Not Eligible
- **Actual:** No grant should become Not Eligible
- **Result:** PASS

---

## Summary

- **Total Tests:** 28
- **Passed:** 27
- **Failed:** 1
- **Business Bugs:** 1
- **Incorrect Rejection Count:** 1
- **Incorrect Potentially Eligible Count:** 0

### Incorrect Rejections Found:
- Scenario 25: Eligible Sector missing incorrectly rejected or failed to label EEG as Potentially Eligible.

**Overall Result:** FAIL
