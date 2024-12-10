export function formatDateTime(date) {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
        return "Invalid Date";
    }
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

export function formatDate(date) {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
        return "Invalid Date";
    }
    return date.toLocaleDateString();
}