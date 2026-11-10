import { useEffect, useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { Eye, EyeOff } from 'lucide-react';
import { BrandPattern, LogoFull, LogoMark } from '../ui/brand';
import { useSession } from '../platform/session';
import { Button, Checkbox, Field, Input } from '../ui';
import { loginErrorText, useServerCheck } from './loginDiagnostics';
import { onAvailableUpdate } from '../platform/update';
import { loginEmail } from '../platform/login';
import { InstallButton } from './InstallApp';

export function LoginPage() {
  const { status, signIn } = useSession();
  const navigate = useNavigate();
  const [updateApp, setUpdateApp] = useState<(() => Promise<void>) | null>(null);
  useEffect(() => onAvailableUpdate(fn => setUpdateApp(() => fn)), []);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ text: string; detail: string } | null>(null);
  const [server, recheck] = useServerCheck();
  const fail = (e: unknown) => { setError(loginErrorText(e)); recheck(); };

  if (status === 'signed-in') return <Navigate to="/" replace />;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signIn(loginEmail(email), password, remember);
      navigate('/', { replace: true });
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-split">
      <aside className="login-brand">
        <BrandPattern className="p1" rows={5} cols={6} />
        <BrandPattern className="p2" rows={2} cols={6} />
        <span className="big-mark"><LogoMark height={340} /></span>
        <div style={{ position: 'relative' }}>
          <LogoFull height={52} />
          <h1>CRM заявок</h1>
          <p>Заявки с сайта, канбан, контакты и заметки.</p>
        </div>
        <div className="faint" style={{ position: 'relative', color: '#6f7076' }}>© Бронь Сервис</div>
      </aside>
      <main className="login-panel">
        <div className="inner">
          {updateApp && <Button size="sm" onClick={() => void updateApp().catch(e => setError({ text: e.message, detail: '' }))}>Обновить приложение</Button>}
          <ServerStatus s={server} onRetry={recheck} />
          <div className="card"><div className="card-body">{form()}</div></div>
          <div style={{ marginTop: 12 }}><InstallButton /></div>
          <p className="faint" style={{ marginTop: 16 }}>Вход по действующей учётной записи основного приложения.</p>
          <p className="faint">Версия от {new Date(import.meta.env.VITE_BUILD_TIME ?? Date.now()).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>
          <a href={`${import.meta.env.BASE_URL}help.html`} target="_blank" rel="noopener noreferrer">Помощь при сбое</a>
        </div>
      </main>
    </div>
  );

  function form() {
    return (
          <form onSubmit={submit} noValidate>
            <Field label="Логин" required hint="Тот же логин, что в основном приложении">
              {(id) => <Input id={id} type="text" autoCapitalize="none" spellCheck={false} autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />}
            </Field>
            <Field label="Пароль" required>
              {(id) => <div className="password-field">
                <Input id={id} type={showPassword ? 'text' : 'password'} autoComplete="current-password" autoCapitalize="none" autoCorrect="off" spellCheck={false} value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="button" className="icon-btn password-toggle" aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'} aria-controls={id} aria-pressed={showPassword}
                  onPointerDown={(e) => e.preventDefault()} onClick={() => setShowPassword((visible) => !visible)}>
                  {showPassword ? <EyeOff size={20} aria-hidden /> : <Eye size={20} aria-hidden />}
                </button>
              </div>}
            </Field>
            <Checkbox label="Запомнить это устройство" hint="Только на личном устройстве: на общем компьютере сессия закончится при закрытии вкладки."
              checked={remember} onChange={setRemember} />
            {error && <ErrorBox e={error} />}
            <div style={{ marginTop: 16 }}>
              <Button type="submit" variant="primary" block loading={busy} disabled={!email || !password}>Войти</Button>
            </div>
            <details className="forgot"><summary>Забыли пароль?</summary>
              <p className="faint">Сотрудник — попросите франчайзи: он задаст новый пароль в разделе «Сотрудники». Франчайзи — напишите менеджеру по франшизе: он задаст новый пароль в вашей карточке. Сменить пароль на свой можно в профиле после входа.</p>
            </details>
          </form>
    );
  }
}

function ErrorBox({ e }: { e: { text: string; detail: string } }) {
  return (
    <div className="alert tone-danger" role="alert" style={{ margin: '12px 0' }}>
      <div className="alert-body">{e.text}{e.detail && <div className="faint" style={{ marginTop: 4, wordBreak: 'break-word' }}>Техническая причина: {e.detail}</div>}</div>
    </div>
  );
}

function ServerStatus({ s, onRetry }: { s: ReturnType<typeof useServerCheck>[0]; onRetry: () => void }) {
  if (s.state === 'ok') return s.ms > 4000 ? <p className="faint" style={{ marginBottom: 12 }}>Сервер отвечает медленно ({(s.ms / 1000).toFixed(1)} с) — вход может занять время.</p> : null;
  if (s.state === 'checking') return null;
  return (
    <div className="alert tone-warning" role="status" style={{ marginBottom: 16 }}>
      <div className="alert-body">
        <strong>{s.reason}</strong>
        <div>Вход можно попробовать. Если не получается — откройте «Помощь при сбое» ниже формы.</div>
        <div className="faint" style={{ marginTop: 4 }}>Код: {s.connection.auth.code} / {s.connection.data.code}</div>
      </div>
      <button type="button" className="btn btn-sm" onClick={onRetry}>Проверить снова</button>
    </div>
  );
}

export function SetupPage() {
  return (
    <div className="login-wrap">
      <div className="login-card card" style={{ width: 'min(640px, 100%)' }}>
        <div className="card-body">
          <h1 style={{ marginBottom: 12 }}>Сборка не подключена к базе</h1>
          <p className="muted">CRM не подключена к рабочему серверу. Передайте эту страницу ответственному за приложение: нужно проверить настройки публикации.</p>
          <p>Заявки продолжают храниться на сервере. Не создавайте их повторно.</p>
        </div>
      </div>
    </div>
  );
}
