// Development-only fake transport. No real sessions, leads or writes.
import {createRoot} from 'react-dom/client';
import '../../src/ui/styles.css';
import '../../src/app/crm.css';
import {startViewport} from '../../src/platform/viewport';
const params=new URLSearchParams(location.search);
const uid='00000000-0000-4000-8000-000000000001';
const exp=Math.floor(Date.now()/1000)+3600;
const encode=(v:unknown)=>btoa(JSON.stringify(v)).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
const token=`${encode({alg:'HS256',typ:'JWT'})}.${encode({sub:uid,exp,role:'authenticated'})}.synthetic-qa`;
const user={id:uid,aud:'authenticated',role:'authenticated',email:'qa@example.invalid',app_metadata:{},user_metadata:{},created_at:'2026-01-01T00:00:00Z'};
localStorage.removeItem('bron.crm.remember-device');sessionStorage.removeItem('bron.crm.cache.me');
if(params.get('scene')==='login')sessionStorage.removeItem('bron.crm.auth');
else sessionStorage.setItem('bron.crm.auth',JSON.stringify({access_token:token,refresh_token:'synthetic-qa-only',token_type:'bearer',expires_at:exp,expires_in:3600,user}));
const me={user:{...user,full_name:'Вымышленный менеджер для проверки',is_demo:false},assignments:[{id:'qa',role:'franchise_manager',role_name:'Менеджер',scope_type:'company',scope_id:null,scope_name:'Сеть',permissions:['leads.read','leads.manage']}]};
const first={id:'qa-lead',name:'ВымышленнаяЗаявкаСОченьДлиннымИменемБезПробелов'.repeat(2),phone:'',city:'Вымышленный город',contact_via:'other',status:'new',tier:'cold',score:0,instagram:null,note:'Синтетическая заметка для проверки переноса и сохранения истории',budget:null,timing:null,place:null,manage:null,experience:null,comment:null,source:'manual',pipeline_column:'000',created_at:'2026-11-09T09:00:00Z',updated_at:'2026-11-09T09:00:00Z',updated_by_name:'Вымышленный менеджер',deleted_at:null as string|null};
let rows=params.get('leads')==='empty'?[]:[first];
if(params.get('scene')==='lead-restore')first.deleted_at='2026-11-09T10:00:00Z';
const realFetch=window.fetch;
window.fetch=async(input,init)=>{
 const url=new URL(typeof input==='string'?input:input instanceof URL?input.href:input.url,location.origin);
 if(!url.hostname.endsWith('.supabase.co'))return realFetch(input,init);
 const name=url.pathname.split('/').pop();const args=init?.body?JSON.parse(String(init.body)):{};
 if(url.pathname.endsWith('/health'))return Response.json({name:'GoTrue'});
 if(url.pathname.includes('/auth/'))return Response.json(user);
 if(name==='me')return Response.json(me);
 if(name==='currency')return Response.json([{code:'RUB',minor_unit:2}]);
 if(name==='ping')return Response.json('ok');
 if(params.get('scene')==='error'&&name==='lead_list')return Response.json({message:'external-unavailable',details:'Тест ошибки сети'},{status:503});
 if(name==='lead_list')return Response.json(rows.filter(r=>!r.deleted_at));
 if(name==='lead_trash_list')return Response.json(rows.filter(r=>r.deleted_at));
 const row=rows.find(r=>r.id===args.p_id);
 if(name==='lead_set_deleted'&&row){row.deleted_at=args.p_deleted?new Date().toISOString():null;row.updated_at=new Date().toISOString();return Response.json(row);}
 if(name==='lead_move'&&row){
  row.pipeline_column=/^[01]{3}$/.test(args.p_column)?args.p_column:null;
  row.status=/^[01]{3}$/.test(args.p_column)?'new':args.p_column;
  row.updated_at=new Date().toISOString();return Response.json(row);
 }
 if(name==='lead_save'){
  const input=args.p_lead;const old=rows.find(r=>r.id===input.id);
  const saved={...first,...old,...input,id:old?.id??crypto.randomUUID(),pipeline_column:/^[01]{3}$/.test(input.column)?input.column:null,status:/^[01]{3}$/.test(input.column)?'new':input.column,updated_at:new Date().toISOString(),deleted_at:null};
  rows=[saved,...rows.filter(r=>r.id!==saved.id)];return Response.json(saved);
 }
 return Response.json({message:'validation',details:'Unexpected fake API request'},{status:400});
};
startViewport();
if(params.get('text')==='200')document.documentElement.style.setProperty('--fs','32px');
const {App}=await import('../../src/app/App');createRoot(document.getElementById('root')!).render(<App/>);
const scene=params.get('scene');
if(['lead-edit','lead-delete','lead-restore'].includes(scene??'')){
 const timer=setInterval(()=>{
  const button=document.querySelector<HTMLButtonElement>(scene==='lead-restore'?'.page-header button':'.lead-open');
  if(!button)return;clearInterval(timer);
  if(scene==='lead-restore'){
   button.click();const restoreTimer=setInterval(()=>{const b=[...document.querySelectorAll<HTMLButtonElement>('main button')].find(b=>b.textContent==='Восстановить');if(b){clearInterval(restoreTimer);b.click();}},50);
  }else{
   button.click();if(scene==='lead-delete'){const deleteTimer=setInterval(()=>{const b=document.querySelector<HTMLButtonElement>('.lead-editor .btn-danger');if(b){clearInterval(deleteTimer);b.click();}},50);}
  }
 },50);
}
