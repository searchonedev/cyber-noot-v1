"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemorySummaries = void 0;
var supabaseClient_1 = require("../../supabaseClient");
var logger_1 = require("../../../utils/logger");
var formatTimestamps_1 = require("../../../utils/formatTimestamps");
var MemorySummaries = /** @class */ (function () {
    function MemorySummaries() {
    }
    // Save any type of summary
    MemorySummaries.saveSummary = function (summaryType, summary, sessionId) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, data, error, error_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, supabaseClient_1.supabase
                                .from('memory_summaries')
                                .insert({
                                summary_type: summaryType,
                                summary: summary,
                                session_id: sessionId,
                                processed: false
                            })
                                .select()];
                    case 1:
                        _a = _b.sent(), data = _a.data, error = _a.error;
                        if (error) {
                            logger_1.Logger.log("Error saving ".concat(summaryType, "-term summary:"), error);
                        }
                        else {
                            logger_1.Logger.log("".concat(summaryType, "-term summary saved successfully."), data);
                        }
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _b.sent();
                        logger_1.Logger.log("Exception in saveSummary when saving ".concat(summaryType, "-term summary:"), error_1);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Mark summaries as processed after AI has processed them
    MemorySummaries.markSummariesAsProcessed = function (summaryIds) {
        return __awaiter(this, void 0, void 0, function () {
            var error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, supabaseClient_1.supabase
                                .from('memory_summaries')
                                .update({ processed: true })
                                .in('id', summaryIds)];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        error_2 = _a.sent();
                        logger_1.Logger.log('Error marking summaries as processed:', error_2);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Update or create long-term summary
    MemorySummaries.updateLongTermSummary = function (summary) {
        return __awaiter(this, void 0, void 0, function () {
            var currentLongTerm, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 6]);
                        return [4 /*yield*/, supabaseClient_1.supabase
                                .from('memory_summaries')
                                .select('*')
                                .eq('summary_type', 'long')
                                .eq('processed', false)
                                .single()];
                    case 1:
                        currentLongTerm = (_a.sent()).data;
                        if (!currentLongTerm) return [3 /*break*/, 3];
                        return [4 /*yield*/, supabaseClient_1.supabase
                                .from('memory_summaries')
                                .update({ processed: true })
                                .eq('id', currentLongTerm.id)];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3: 
                    // Create new long-term summary
                    return [4 /*yield*/, supabaseClient_1.supabase
                            .from('memory_summaries')
                            .insert({
                            summary_type: 'long',
                            summary: summary,
                            session_id: null,
                            processed: false
                        })];
                    case 4:
                        // Create new long-term summary
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 5:
                        error_3 = _a.sent();
                        logger_1.Logger.log('Error updating long-term summary:', error_3);
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    // Get active memories for the AI
    MemorySummaries.getActiveMemories = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, shortTerm, _b, midTerm, longTerm, error_4;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, supabaseClient_1.supabase
                                .from('memory_summaries')
                                .select('*')
                                .eq('summary_type', 'short')
                                .eq('processed', false)
                                .order('created_at', { ascending: false })
                                .limit(5)];
                    case 1:
                        _a = (_c.sent()).data, shortTerm = _a === void 0 ? [] : _a;
                        return [4 /*yield*/, supabaseClient_1.supabase
                                .from('memory_summaries')
                                .select('*')
                                .eq('summary_type', 'mid')
                                .eq('processed', false)
                                .order('created_at', { ascending: false })
                                .limit(3)];
                    case 2:
                        _b = (_c.sent()).data, midTerm = _b === void 0 ? [] : _b;
                        return [4 /*yield*/, supabaseClient_1.supabase
                                .from('memory_summaries')
                                .select('*')
                                .eq('summary_type', 'long')
                                .eq('processed', false)
                                .order('created_at', { ascending: false })
                                .limit(1)
                                .single()];
                    case 3:
                        longTerm = (_c.sent()).data;
                        return [2 /*return*/, {
                                short: shortTerm,
                                mid: midTerm,
                                long: longTerm
                            }];
                    case 4:
                        error_4 = _c.sent();
                        logger_1.Logger.log('Error getting active memories:', error_4);
                        return [2 /*return*/, {
                                short: [],
                                mid: [],
                                long: null
                            }];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    // New function to check if we need to process short-term summaries
    MemorySummaries.checkAndProcessShortTermSummaries = function () {
        return __awaiter(this, void 0, void 0, function () {
            var shortTerms, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.getUnprocessedSummaries('short', 6)];
                    case 1:
                        shortTerms = _a.sent();
                        // If we have 6 or more, we should process them
                        return [2 /*return*/, shortTerms.length >= 6];
                    case 2:
                        error_5 = _a.sent();
                        logger_1.Logger.log('Error checking short-term summaries:', error_5);
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // New function to check if we need to process mid-term summaries
    MemorySummaries.checkAndProcessMidTermSummaries = function () {
        return __awaiter(this, void 0, void 0, function () {
            var midTerms, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.getUnprocessedSummaries('mid', 3)];
                    case 1:
                        midTerms = _a.sent();
                        // If we have 3 or more, we should process them
                        return [2 /*return*/, midTerms.length >= 3];
                    case 2:
                        error_6 = _a.sent();
                        logger_1.Logger.log('Error checking mid-term summaries:', error_6);
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Modified to get oldest unprocessed summaries first
    MemorySummaries.getUnprocessedSummaries = function (summaryType, limit) {
        return __awaiter(this, void 0, void 0, function () {
            var data, error_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, supabaseClient_1.supabase
                                .from('memory_summaries')
                                .select('*')
                                .eq('summary_type', summaryType)
                                .eq('processed', false)
                                .order('created_at', { ascending: true }) // Get oldest first
                                .limit(limit)];
                    case 1:
                        data = (_a.sent()).data;
                        return [2 /*return*/, (data || [])];
                    case 2:
                        error_7 = _a.sent();
                        logger_1.Logger.log('Error getting unprocessed summaries:', error_7);
                        return [2 /*return*/, []];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Retrieves all active summaries (short, mid, long) and returns them as a formatted string.
     * Summaries are grouped by type and ordered chronologically with formatted UTC timestamps.
     * @returns Formatted summaries as a single string.
     */
    MemorySummaries.getFormattedActiveSummaries = function () {
        return __awaiter(this, void 0, void 0, function () {
            var activeMemories, formattedSummaries_1, formatSupabaseTimestamp_1, timestamp, result, error_8;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.getActiveMemories()];
                    case 1:
                        activeMemories = _a.sent();
                        formattedSummaries_1 = [];
                        formatSupabaseTimestamp_1 = function (timestamp) {
                            try {
                                if (!timestamp)
                                    return 'No timestamp';
                                // Remove the timezone offset from Supabase timestamp
                                var cleanTimestamp = timestamp.split('+')[0] + 'Z';
                                return (0, formatTimestamps_1.formatTimestamp)(new Date(cleanTimestamp));
                            }
                            catch (err) {
                                logger_1.Logger.log('Error formatting timestamp:', err);
                                return 'Invalid timestamp';
                            }
                        };
                        // Process long-term summary
                        if (activeMemories.long) {
                            timestamp = formatSupabaseTimestamp_1(activeMemories.long.created_at);
                            formattedSummaries_1.push("### LONG TERM SUMMARY\n[".concat(timestamp, "]\n").concat(activeMemories.long.summary, "\n"));
                        }
                        // Process mid-term summaries
                        if (activeMemories.mid.length > 0) {
                            formattedSummaries_1.push('### MID-TERM SUMMARIES');
                            activeMemories.mid
                                .sort(function (a, b) { return new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime(); })
                                .forEach(function (summary) {
                                var timestamp = formatSupabaseTimestamp_1(summary.created_at);
                                formattedSummaries_1.push("[".concat(timestamp, "]\n").concat(summary.summary, "\n"));
                            });
                        }
                        // Process short-term summaries
                        if (activeMemories.short.length > 0) {
                            formattedSummaries_1.push('### SHORT-TERM SUMMARIES');
                            activeMemories.short
                                .sort(function (a, b) { return new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime(); })
                                .forEach(function (summary) {
                                var timestamp = formatSupabaseTimestamp_1(summary.created_at);
                                formattedSummaries_1.push("[".concat(timestamp, "]\n").concat(summary.summary, "\n"));
                            });
                        }
                        result = formattedSummaries_1.join('\n');
                        return [2 /*return*/, result || 'No active summaries found.'];
                    case 2:
                        error_8 = _a.sent();
                        logger_1.Logger.log('Error getting formatted active summaries:', error_8);
                        return [2 /*return*/, 'Error retrieving summaries.'];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return MemorySummaries;
}());
exports.MemorySummaries = MemorySummaries;
