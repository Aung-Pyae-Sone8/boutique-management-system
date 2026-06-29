import { useCallback, useEffect, useMemo, useState } from 'react';
import { getJson } from '../const/json-tanfer';

const useApi = <T,>(url: string) => {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
    const stableUrl = useMemo(() => url, [url]);

    const load = useCallback(
        async (showLoading = false) => {
            showLoading ? setLoading(true) : setRefreshing(true);

            try {
                setData(await getJson<T>(stableUrl));
                setUpdatedAt(new Date());
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [stableUrl],
    );

    useEffect(() => {
        void load(true);
    }, [load]);

    return {
        data,
        loading,
        refreshing,
        updatedAt,
        refresh: load,
    };
};

export default useApi;
