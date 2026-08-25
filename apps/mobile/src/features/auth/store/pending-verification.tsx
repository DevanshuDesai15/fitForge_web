import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
export type VerificationKind = 'sign-in-code' | 'sign-up' | 'device-trust';
export type PendingVerification = { kind: VerificationKind; email: string };
type Value = { pending: PendingVerification | null; setPending: (value: PendingVerification | null) => void };
const Context = createContext<Value | null>(null);
export function PendingVerificationProvider({ children }: { children: ReactNode }) { const [pending, setPending] = useState<PendingVerification | null>(null); const value = useMemo(() => ({ pending, setPending }), [pending]); return <Context.Provider value={value}>{children}</Context.Provider>; }
export function usePendingVerification() { const value = useContext(Context); if (!value) throw new Error('Verification context is unavailable'); return value; }
