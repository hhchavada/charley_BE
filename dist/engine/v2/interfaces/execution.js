"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GrantState = exports.EvaluationState = exports.AssessmentSessionState = void 0;
// ==========================================
// 1. STATE MACHINES & ENUMS
// ==========================================
var AssessmentSessionState;
(function (AssessmentSessionState) {
    AssessmentSessionState["NEW"] = "NEW";
    AssessmentSessionState["IN_PROGRESS"] = "IN_PROGRESS";
    AssessmentSessionState["WAITING_FOR_AI"] = "WAITING_FOR_AI";
    AssessmentSessionState["WAITING_FOR_USER"] = "WAITING_FOR_USER";
    AssessmentSessionState["RE_EVALUATING"] = "RE_EVALUATING";
    AssessmentSessionState["COMPLETED"] = "COMPLETED";
    AssessmentSessionState["ARCHIVED"] = "ARCHIVED";
})(AssessmentSessionState || (exports.AssessmentSessionState = AssessmentSessionState = {}));
var EvaluationState;
(function (EvaluationState) {
    EvaluationState["PASS"] = "PASS";
    EvaluationState["FAIL"] = "FAIL";
    EvaluationState["MISSING"] = "MISSING";
    EvaluationState["SKIPPED"] = "SKIPPED";
    EvaluationState["ERROR"] = "ERROR";
    EvaluationState["UNKNOWN"] = "UNKNOWN";
})(EvaluationState || (exports.EvaluationState = EvaluationState = {}));
var GrantState;
(function (GrantState) {
    GrantState["ELIGIBLE"] = "ELIGIBLE";
    GrantState["POTENTIALLY_ELIGIBLE"] = "POTENTIALLY_ELIGIBLE";
    GrantState["NEEDS_INFORMATION"] = "NEEDS_INFORMATION";
    GrantState["NOT_ELIGIBLE"] = "NOT_ELIGIBLE";
    GrantState["ERROR"] = "ERROR";
})(GrantState || (exports.GrantState = GrantState = {}));
