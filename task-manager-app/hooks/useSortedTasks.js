import { useState, useEffect } from 'react';
import { PRIORITY_ORDER } from '../helpers/constants';

export default function useSortedTasks(rawTasks, sortOption) {
    const [sortedTasks, setSortedTasks] = useState([]);

    useEffect(() => {
        if (!sortOption) {
            setSortedTasks([...rawTasks]);
        } else {
            const sorted = [...rawTasks].sort((a, b) => {
                if (sortOption === 'date') {
                    const dateA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
                    const dateB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
                    return dateA - dateB;
                } else if (sortOption === 'alphabetical') {
                    return (a.title || '').localeCompare(b.title || '');
                } else if (sortOption === 'colour') {
                    return (a.colour || '').localeCompare(b.colour || '');
                } else if (sortOption === 'priority') {
                    return (PRIORITY_ORDER[a.priority] || 999) - (PRIORITY_ORDER[b.priority] || 999);
                }
                return 0;
            });
            setSortedTasks(sorted);
        }
    }, [sortOption, rawTasks]);

    return sortedTasks;
};