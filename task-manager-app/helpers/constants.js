import { theme } from "../twrnc";

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

export const PRIORITY_COLOURS = {
    Low: theme.colors.forest,
    Moderate: theme.colors.gold,
    High: theme.colors.cinnabar,
    Critical: theme.colors.violet,
};

export const COLOURS = [
    { name: 'gold', value: theme.colors.gold },
    { name: 'greenCyan', value: theme.colors.greenCyan },
    { name: 'mint', value: theme.colors.mint },
    { name: 'sky', value: theme.colors.sky },
    { name: 'forest', value: theme.colors.forest },
    { name: 'evergreen', value: theme.colors.evergreen },
    { name: 'magenta', value: theme.colors.magenta },
    { name: 'cinnabar', value: theme.colors.cinnabar },
    { name: 'lavender', value: theme.colors.lavender },
    { name: 'orange', value: theme.colors.orange },
    { name: 'violet', value: theme.colors.violet },
    { name: 'neon', value: theme.colors.neon },
    { name: 'cerise', value: theme.colors.cerise },
    { name: 'lime', value: theme.colors.lime },
    { name: 'teal', value: theme.colors.teal },
    { name: 'pink', value: theme.colors.pink },
    { name: 'gray', value: theme.colors.gray },
    { name: 'brown', value: theme.colors.brown },
];

export const COLOUR_ORDER = COLOURS.reduce((acc, color, index) => {
    acc[color.value] = index;
    return acc;
}, {});

export const TREND_OPTIONS = [
    { label: "To-Do lists Completed", value: "To-Do lists Completed" },
    { label: "Projects Completed", value: "Projects Completed" },
    { label: "Avg Project Completion Time", value: "Avg Project Completion Time" },
    { label: "Avg To-Do List Completion Time", value: "Avg To-Do List Completion Time" },
];