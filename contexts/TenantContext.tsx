
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Tenant } from '../types';

interface TenantContextType {
    tenant: Tenant | null;
    loading: boolean;
    error: string | null;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const resolveTenant = async () => {
            try {
                if (tenant) return; // Already resolved
                setLoading(true);
                
                let slug = 'buro-panama';
                const host = window.location.hostname;
                if (!host.includes('localhost') && host.split('.').length > 2) {
                    slug = host.split('.')[0];
                }

                const { data, error: fetchError } = await supabase
                    .from('tenants')
                    .select('*')
                    .eq('slug', slug)
                    .single();

                if (fetchError) {
                    console.warn('⚠️ No se pudo resolver el Tenant:', fetchError.message);
                    setError(fetchError.message);
                    return;
                }
                
                if (data && (!tenant || tenant.id !== data.id)) {
                    setTenant(data);
                }
                
            } catch (err: any) {
                console.error('Error resolving tenant:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        resolveTenant();
    }, [tenant]);

    return (
        <TenantContext.Provider value={{ tenant, loading, error }}>
            {children}
        </TenantContext.Provider>
    );
};

export const useTenant = () => {
    const context = useContext(TenantContext);
    if (context === undefined) {
        throw new Error('useTenant must be used within a TenantProvider');
    }
    return context;
};
