"use strict";
/**
 * Formats a date to dd/mm/yy - HH:MM AM/PM UTC format
 * @param date - Date object or ISO string to format
 * @returns Formatted date string
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatTimestamp = formatTimestamp;
exports.getCurrentTimestamp = getCurrentTimestamp;
function formatTimestamp(date) {
    // Convert input to Date object if it's an ISO string
    var dateObj;
    if (typeof date === 'string') {
        // Append 'Z' if not already present to indicate UTC
        if (!date.endsWith('Z')) {
            date += 'Z';
        }
        dateObj = new Date(date);
    }
    else {
        dateObj = date;
    }
    // Validate date
    if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
        throw new Error('Invalid date input');
    }
    // Extract UTC components
    var day = dateObj.getUTCDate().toString().padStart(2, '0');
    var month = (dateObj.getUTCMonth() + 1).toString().padStart(2, '0');
    var year = dateObj.getUTCFullYear().toString().slice(-2);
    // Get hours in 12-hour format
    var hours = dateObj.getUTCHours();
    var ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12; // Convert 0 to 12
    var minutes = dateObj.getUTCMinutes().toString().padStart(2, '0');
    return "".concat(day, "/").concat(month, "/").concat(year, " - ").concat(hours, ":").concat(minutes, " ").concat(ampm, " UTC");
}
/**
 * Returns the current UTC time in formatted string: [dd/mm/yy - HH:MM AM/PM UTC]
 * @returns Formatted current UTC timestamp string with brackets
 */
function getCurrentTimestamp() {
    var now = new Date();
    return "[".concat(formatTimestamp(now), "]");
}
