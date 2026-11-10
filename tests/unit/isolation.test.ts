import { afterEach, describe, expect, it, vi } from 'vitest';

function memory() {
  const values = new Map<string,string>();
  return {
    getItem: (k:string) => values.get(k) ?? null,
    setItem: (k:string,v:string) => values.set(k,v),
    removeItem: (k:string) => values.delete(k),
    key: (i:number) => [...values.keys()][i] ?? null,
    get length() {return values.size;}, clear: () => values.clear(),
  };
}

let clientOptions: {auth:{storageKey:string;storage:{getItem:(k:string)=>string|null;setItem:(k:string,v:string)=>void;removeItem:(k:string)=>void}}};
vi.mock('@supabase/supabase-js', () => ({ createClient: (_url:string,_key:string,options:typeof clientOptions) => {clientOptions=options;return {};} }));
afterEach(() => {vi.unstubAllGlobals();vi.unstubAllEnvs();vi.resetModules();});
describe('independent CRM sessions on the same GitHub Pages origin', () => {
  it('signs in and clears its own session without overwriting the main app session', async () => {
    vi.stubEnv('VITE_SUPABASE_URL','https://qa.example.invalid');
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY','sb_publishable_synthetic_only_for_test');
    const local=memory(),session=memory();
    vi.stubGlobal('localStorage',local);vi.stubGlobal('sessionStorage',session);
    vi.stubGlobal('location',{search:''});
    session.setItem('bron.auth','main-session');local.setItem('bron.remember-device','1');
    const {setRememberDevice}=await import('../../src/platform/supabase');
    expect(clientOptions.auth.storageKey).toBe('bron.crm.auth');
    expect(clientOptions.auth.storage.getItem('bron.crm.auth')).toBeNull();
    clientOptions.auth.storage.setItem('bron.crm.auth','crm-session');
    expect(session.getItem('bron.crm.auth')).toBe('crm-session');
    setRememberDevice(true);
    clientOptions.auth.storage.setItem('bron.crm.auth','crm-remembered');
    clientOptions.auth.storage.removeItem('bron.crm.auth');setRememberDevice(false);
    expect(local.getItem('bron.crm.auth')).toBeNull();expect(session.getItem('bron.crm.auth')).toBeNull();
    expect(session.getItem('bron.auth')).toBe('main-session');expect(local.getItem('bron.remember-device')).toBe('1');
  });
});
