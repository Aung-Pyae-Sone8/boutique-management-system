import { useEffect, useMemo, useState } from 'react';
import { getJson } from '../const/json-tanfer'

const useApi = <T,>(url: string) => {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const stableUrl = useMemo(() => url, [url]);

    useEffect(() => {
        setLoading(true);
        getJson<T>(stableUrl)
            .then(setData)
            .finally(() => setLoading(false));
    }, [stableUrl]);

    return { data, loading };
};

export default useApi;
