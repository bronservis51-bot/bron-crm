import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router';
import { KeyRound, LogOut, User, WifiOff } from 'lucide-react';
import { useSession } from '../platform/session';
import { onAvailableUpdate } from '../platform/update';
import { commandsInFlight } from '../platform/backend';
import { LogoFull, LogoMark } from '../ui/brand';
import { Button, ConfirmDialog, Field, Input } from '../ui';
import { useToast } from '../ui/toast';
import { InstallButton } from './InstallApp';

export function Shell() {
  const { me, signOut } = useSession();
  const [online, setOnline] = useState(navigator.onLine);
  const [profile, setProfile] = useState(false);
  const [password, setPassword] = useState(false);
  const [update, setUpdate] = useState<(() => Promise<void>) | null>(null);
  const menu = useRef<HTMLDivElement>(null);
  const main = useRef<HTMLElement>(null);
  const loc = useLocation();
  const toast = useToast();
  useEffect(() => onAvailableUpdate(fn => setUpdate(() => fn)), []);
  useEffect(() => {
    const change = () => setOnline(navigator.onLine);
    const close = (e: MouseEvent) => { if (!menu.current?.contains(e.target as Node)) setProfile(false); };
    window.addEventListener('online', change); window.addEventListener('offline', change); document.addEventListener('click', close);
    return () => { window.removeEventListener('online', change); window.removeEventListener('offline', change); document.removeEventListener('click', close); };
  }, []);
  useEffect(() => main.current?.focus({preventScroll:true}), [loc.pathname]);
  const busy = () => commandsInFlight() > 0 || !!document.querySelector('dialog[open], [role="dialog"], [data-unsaved="true"]');
  return <div className="crm-app">
    <a href="#main" className="skip-link" onClick={e => { e.preventDefault(); main.current?.focus(); }}>К содержимому</a>
    <header className="topbar crm-topbar">
      <span className="crm-full-logo"><LogoFull height={36} /></span><span className="crm-mark"><LogoMark height={32} /></span>
      <span className="crm-title">CRM заявок</span>
      <div className="grow" />
      <div className="crm-install"><InstallButton /></div>
      <div ref={menu} className="crm-profile">
        <button type="button" className="user-btn" aria-label="Профиль" aria-haspopup="menu" aria-expanded={profile} onClick={() => setProfile(v => !v)}><span className="user-name hide-mobile">{me?.user.full_name}</span><User size={20} aria-hidden /></button>
        {profile && <div className="menu" role="menu"><div className="crm-user-name">{me?.user.full_name}</div><div className="sep" />
          <button role="menuitem" onClick={() => { setProfile(false); setPassword(true); }}><KeyRound size={16} aria-hidden />Сменить пароль</button>
          <a role="menuitem" href={`${import.meta.env.BASE_URL}help.html`} target="_blank" rel="noopener noreferrer">Помощь при сбое</a>
          <button role="menuitem" onClick={() => {
            if (busy()) { toast('Завершите работу с открытой карточкой перед выходом.'); return; }
            void signOut().catch(e => toast(e instanceof Error ? e.message : 'Не удалось выйти'));
          }}><LogOut size={16} aria-hidden />Выйти</button>
        </div>}
      </div>
    </header>
    {update && <div className="alert tone-info crm-alert" role="status"><div className="alert-body">Доступно обновление CRM.</div><Button size="sm" onClick={() => void update().catch(e => toast(e.message))}>Обновить</Button></div>}
    {!online && <div className="alert tone-warning crm-alert" role="status"><WifiOff size={18} aria-hidden /><div className="alert-body">Нет связи. Изменения заявок сохраняются только после ответа сервера. Оставьте открытую карточку до восстановления связи.</div></div>}
    <main id="main" className="content crm-content" tabIndex={-1} ref={main} style={{outline:'none'}}><Outlet /></main>
    {password && <PasswordDialog onClose={() => setPassword(false)} />}
  </div>;
}

function PasswordDialog({onClose}:{onClose:()=>void}) {
  const {changePassword} = useSession(); const toast = useToast();
  const [pw,setPw]=useState(''); const [repeat,setRepeat]=useState(''); const [busy,setBusy]=useState(false); const [error,setError]=useState<unknown>(null);
  return <ConfirmDialog open title="Сменить пароль" confirmLabel="Сохранить" busy={busy} error={error} disabled={pw.length < 6 || pw !== repeat} onClose={onClose} onConfirm={async () => {
    setBusy(true); setError(null);
    try { await changePassword(pw); toast('Пароль изменён для CRM и основного приложения'); onClose(); } catch(e) {setError(e);} finally {setBusy(false);}
  }}><p>Пароль изменится и в основном приложении.</p>
    <Field label="Новый пароль" hint="Минимум 6 символов">{id => <Input id={id} type="password" autoComplete="new-password" value={pw} onChange={e => setPw(e.target.value)} />}</Field>
    <Field label="Повторите пароль">{id => <Input id={id} type="password" autoComplete="new-password" value={repeat} onChange={e => setRepeat(e.target.value)} />}</Field>
  </ConfirmDialog>;
}
