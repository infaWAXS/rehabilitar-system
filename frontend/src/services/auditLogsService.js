import { apiRequest } from './apiClient';

export function getAuditLogs(search = '',type = '', action = '', date_from = '', date_to = '', result = '') {
    console.log("TYPE:", type);
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (type) params.append('type', type);
    if (action) params.append('action', action);
    if (date_from) params.append('date_from', date_from);
    if (date_to) params.append('date_to', date_to);
    if (result) params.append('result', result);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return apiRequest(`/audit${queryString}`);
}