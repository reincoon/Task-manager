export const NOTIFICATION_OPTIONS = [
    'None',
    'At Due Time',
    '5 Minutes Before',
    '10 Minutes Before',
    '15 Minutes Before',
    '30 Minutes Before',
    '1 Hour Before',
    '1 Day Before',
    '1 Week Before',
];

export const NOTIFICATION_TIME_OFFSETS = {
    'At Due Time': 0,
    '5 Minutes Before': -5 * 60 * 1000,
    '10 Minutes Before': -10 * 60 * 1000,
    '15 Minutes Before': -15 * 60 * 1000,
    '30 Minutes Before': -30 * 60 * 1000,
    '1 Hour Before': -60 * 60 * 1000,
    '1 Day Before': -24 * 60 * 60 * 1000,
    '1 Week Before': -7 * 24 * 60 * 60 * 1000,
};

export const PRIORITY_ORDER = {
    Critical: 1,
    High: 2,
    Moderate: 3,
    Low: 4,
};