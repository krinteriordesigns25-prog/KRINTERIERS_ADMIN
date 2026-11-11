import React,{useRef,useState} from 'react';
import {api} from '../api.js';

function useUpload(onError){
  const [busy,setBusy]=useState(false);
  const upload=async file=>{
    setBusy(true);
    try{return (await api.upload(file)).url}
    catch(e){onError(e.message);return null}
    finally{setBusy(false)}
  };
  return {busy,upload};
}

/* Header image: upload a file, or paste an image / blob URL */
export function ImageField({value,onChange,onError}){
  const input=useRef(null);
  const {busy,upload}=useUpload(onError);
  const pick=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;const url=await upload(f);if(url)onChange(url)};
  return <div className="image-field">
    {value?<div className="thumb-wrap"><img className="thumb-lg" src={value} alt="Header preview"/><button type="button" className="btn-danger sm" onClick={()=>onChange('')}>Remove</button></div>
          :<div className="drop">No image selected</div>}
    <div className="row-gap">
      <input ref={input} type="file" accept="image/jpeg,image/png,image/gif,image/webp" hidden onChange={pick}/>
      <button type="button" className="btn-light" disabled={busy} onClick={()=>input.current.click()}>{busy?'Uploading…':'Upload image'}</button>
      <input className="grow" placeholder="…or paste an image / blob URL (https://…)" value={value||''} onChange={e=>onChange(e.target.value)}/>
    </div>
  </div>;
}

/* Gallery: many images, reorder and remove */
export function GalleryField({value,onChange,onError}){
  const input=useRef(null);
  const [url,setUrl]=useState('');
  const {busy,upload}=useUpload(onError);
  const pick=async e=>{
    const files=[...e.target.files];e.target.value='';
    const added=[];
    for(const f of files){const u=await upload(f);if(u)added.push(u)}
    if(added.length)onChange([...value,...added]);
  };
  const move=(i,d)=>{const a=[...value];const j=i+d;if(j<0||j>=a.length)return;[a[i],a[j]]=[a[j],a[i]];onChange(a)};
  const addUrl=()=>{const u=url.trim();if(!u)return;if(!/^https?:\/\//i.test(u)){onError('Image links must start with http:// or https://');return}onChange([...value,u]);setUrl('')};
  return <div>
    <div className="gallery-grid">
      {value.map((src,i)=><div className="g-item" key={src+i}>
        <img src={src} alt={`Gallery ${i+1}`}/>
        <div className="g-actions">
          <button type="button" title="Move earlier" onClick={()=>move(i,-1)} disabled={i===0}>←</button>
          <button type="button" title="Move later" onClick={()=>move(i,1)} disabled={i===value.length-1}>→</button>
          <button type="button" title="Remove" onClick={()=>onChange(value.filter((_,k)=>k!==i))}>✕</button>
        </div>
      </div>)}
      {!value.length&&<div className="drop">No gallery images yet</div>}
    </div>
    <div className="row-gap">
      <input ref={input} type="file" multiple accept="image/jpeg,image/png,image/gif,image/webp" hidden onChange={pick}/>
      <button type="button" className="btn-light" disabled={busy} onClick={()=>input.current.click()}>{busy?'Uploading…':'Upload images'}</button>
      <input className="grow" placeholder="…or paste an image / blob URL" value={url} onChange={e=>setUrl(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();addUrl()}}}/>
      <button type="button" className="btn-light" onClick={addUrl}>Add</button>
    </div>
  </div>;
}
