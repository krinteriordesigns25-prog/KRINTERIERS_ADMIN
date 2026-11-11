import React,{useEffect,useState} from 'react';
import {Link,useNavigate,useParams} from 'react-router-dom';
import {api} from '../api.js';
import RichTextEditor from '../components/RichTextEditor.jsx';
import {GalleryField,ImageField} from '../components/ImageFields.jsx';

const empty={menuId:'',title:'',slug:'',subtitle:'',content:'',headerImage:'',images:[],published:true,sortOrder:0};
const slugify=s=>String(s).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');

export default function PageForm(){
  const {id}=useParams();
  const editing=Boolean(id);
  const navigate=useNavigate();
  const [form,setForm]=useState(empty);
  const [menus,setMenus]=useState([]);
  const [slugTouched,setSlugTouched]=useState(editing);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState('');

  useEffect(()=>{
    setLoading(true);
    Promise.all([api.menus(),editing?api.page(id):null]).then(([m,p])=>{
      setMenus(m);
      if(p)setForm({...empty,...p,menuId:String(p.menuId),subtitle:p.subtitle||'',content:p.content||'',headerImage:p.headerImage||'',images:p.images||[]});
      else setForm({...empty,menuId:m[0]?String(m[0].id):''});
    }).catch(e=>setError(e.message)).finally(()=>setLoading(false));
  },[id,editing]);

  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const onTitle=v=>setForm(f=>({...f,title:v,slug:slugTouched?f.slug:slugify(v)}));

  const save=async e=>{
    e.preventDefault();setError('');
    if(!form.menuId)return setError('Please choose a menu. Create one in the Menus section first.');
    if(!form.title.trim())return setError('Title is required');
    setSaving(true);
    try{
      const body={...form,menuId:Number(form.menuId),sortOrder:Number(form.sortOrder)||0};
      if(editing)await api.updatePage(id,body);else await api.createPage(body);
      navigate('/pages');
    }catch(err){setError(err.message);window.scrollTo({top:0,behavior:'smooth'})}
    finally{setSaving(false)}
  };

  if(loading)return <p className="muted">Loading…</p>;
  return <form onSubmit={save}>
    <div className="page-head"><h1>{editing?'Edit page':'New page'}</h1>
      <div className="row-gap"><Link className="btn-light" to="/pages">Cancel</Link><button className="btn-primary" disabled={saving}>{saving?'Saving…':'Save page'}</button></div></div>
    {error&&<div className="alert error">{error}</div>}
    {!menus.length&&<div className="alert warn">You have no menus yet. <Link to="/menus">Create a menu</Link> first.</div>}

    <div className="grid-2">
      <div className="card">
        <h2>Header</h2>
        <label>Menu (where this page appears in the navbar)<select required value={form.menuId} onChange={e=>set('menuId',e.target.value)}><option value="">Choose a menu…</option>{menus.map(m=><option key={m.id} value={m.id}>{m.title}</option>)}</select></label>
        <label>Title<input required maxLength={200} value={form.title} onChange={e=>onTitle(e.target.value)}/></label>
        <label>Subtitle<input maxLength={400} value={form.subtitle} onChange={e=>set('subtitle',e.target.value)} placeholder="One line shown under the title"/></label>
        <label>Page address (slug)<input value={form.slug} onChange={e=>{setSlugTouched(true);set('slug',slugify(e.target.value))}} placeholder="auto-generated from the title"/></label>
        <span className="muted small">Website address: /page/{form.slug||'…'}</span>
      </div>
      <div className="card">
        <h2>Settings</h2>
        <label>Menu order (smaller shows first)<input type="number" value={form.sortOrder} onChange={e=>set('sortOrder',e.target.value)}/></label>
        <label className="check"><input type="checkbox" checked={form.published} onChange={e=>set('published',e.target.checked)}/> Published (visible on the website)</label>
        <h2 className="mt">Header image</h2>
        <ImageField value={form.headerImage} onChange={v=>set('headerImage',v)} onError={setError}/>
      </div>
    </div>

    <div className="card"><h2>Content</h2><RichTextEditor value={form.content} onChange={v=>set('content',v)}/></div>
    <div className="card"><h2>Gallery images</h2><GalleryField value={form.images} onChange={v=>set('images',v)} onError={setError}/></div>
    <div className="sticky-save"><button className="btn-primary" disabled={saving}>{saving?'Saving…':'Save page'}</button></div>
  </form>;
}
