import { csrfToken } from './data'

export const getJson = async <T,>(url: string): Promise<T> => {
    const response = await fetch(url, {
        headers: {
            Accept: 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
    }

    return response.json() as Promise<T>;
};

export const sendJson = async <T>(url: string, method: 'POST' | 'PUT' | 'DELETE', data?: unknown): Promise<T> => {
    const response = await fetch(url, {
        method,
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': csrfToken(),
        },
        body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
    }

    if (response.status === 204) {
        return undefined as T;
    }

    return response.json() as Promise<T>;
}