"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionState = void 0;
var SessionState;
(function (SessionState) {
    SessionState["NEW"] = "NEW";
    SessionState["IN_PROGRESS"] = "IN_PROGRESS";
    SessionState["PARTIALLY_COMPLETED"] = "PARTIALLY_COMPLETED";
    SessionState["WAITING_FOR_USER"] = "WAITING_FOR_USER";
    SessionState["READY_FOR_EVALUATION"] = "READY_FOR_EVALUATION";
    SessionState["EVALUATING"] = "EVALUATING";
    SessionState["AI_REQUIRED"] = "AI_REQUIRED";
    SessionState["COMPLETED"] = "COMPLETED";
    SessionState["ARCHIVED"] = "ARCHIVED";
})(SessionState || (exports.SessionState = SessionState = {}));
