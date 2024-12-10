export function formatDateTime(date) {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

export function formatDate(date) {
    return date.toLocaleDateString();
}