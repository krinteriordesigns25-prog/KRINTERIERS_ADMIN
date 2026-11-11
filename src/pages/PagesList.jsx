import React,{useEffect,useMemo,useState} from 'react';
import {Link} from 'react-router-dom';
import {api,SITE_URL} from '../api.js';

export default function PagesList(){
  const [pages,setPages]=useState(null);
  const [menus,setMenus]=useState([]);
  const [menuFilter,setMenuFilter]=useState('');
  const [q,setQ]=useState('');
  const [msg,setMsg]=useState(null);
  const load=()=>Promise.all([api.pages(),api.menus()]).then(([p,m])=>{setPages(p);setMenus(m)}).catch(e=>setMsg({type:'error',text:e.message}));
  useEffect(()=>{load()},[]);

  const shown=useMemo(()=>(pages||[]).filter(p=>(!menuFilter||String(p.menuId)===menuFilter)&&(!q||p.title.toLowerCase().includes(q.toLowerCase()))),[pages,menuFilter,q]);

  const toggle=async p=>{
    try{await api.setPublished(p.id,!p.published);setPages(list=>list.map(x=>x.id===p.id?{...x,published:!p.published}:x))}
    catch(e){setMsg({type:'error',text:e.message})}
  };
  const remove=async p=>{
    if(!window.confirm(`Delete "${p.title}"? This cannot be undone.`))return;
    try{await api.deletePage(p.id);setPages(list=>list.filter(x=>x.id!==p.id));setMsg({type:'ok',text:'Page deleted'})}
    catch(e){setMsg({type:'error',text:e.message})}
  };

  return <>
    <div className="page-head"><h1>Pages</h1><Link className="btn-primary" to="/pages/new">+ New page</Link></div>
    {msg&&<div className={`alert ${msg.type}`} onClick={()=>setMsg(null)}>{msg.text}</div>}
    <div className="card">
      <div className="filters">
        <input placeholder="Search pages…" value={q} onChange={e=>setQ(e.target.value)}/>
        <select value={menuFilter} onChange={e=>setMenuFilter(e.target.value)}><option value="">All menus</option>{menus.map(m=><option key={m.id} value={m.id}>{m.title}</option>)}</select>
      </div>
      {!pages?<p className="muted">Loading…</p>:!shown.length?<p className="muted">No pages found.</p>:
      <div className="table-wrap"><table className="table">
        <thead><tr><th>Title</th><th>Menu</th><th>Status</th><th>Updated</th><th className="right">Actions</th></tr></thead>
        <tbody>{shown.map(p=><tr key={p.id}>
          <td><Link to={`/pages/${p.id}`}><strong>{p.title}</strong></Link><div className="muted small">/page/{p.slug}</div></td>
          <td>{p.menu?.title}</td>
          <td><span className={`badge ${p.published?'ok':'draft'}`}>{p.published?'Published':'Draft'}</span></td>
          <td className="muted">{new Date(p.updatedAt).toLocaleDateString()}</td>
          <td className="right actions">
            <Link className="btn-light sm" to={`/pages/${p.id}`}>Edit</Link>
            <button className="btn-light sm" onClick={()=>toggle(p)}>{p.published?'Unpublish':'Publish'}</button>
            {p.published&&<a className="btn-light sm" href={`${SITE_URL}/page/${p.slug}`} target="_blank" rel="noreferrer">View</a>}
            <button className="btn-danger sm" onClick={()=>remove(p)}>Delete</button>
          </td></tr>)}</tbody>
      </table></div>}
    </div>
  </>;
}
