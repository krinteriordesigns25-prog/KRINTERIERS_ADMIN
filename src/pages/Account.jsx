import React,{useState} from 'react';
import {api} from '../api.js';
import {useAuth} from '../auth.jsx';

export default function Account(){
  const {email}=useAuth();
  const [cur,setCur]=useState('');
  const [next,setNext]=useState('');
  const [msg,setMsg]=useState(null);
  const submit=async e=>{
    e.preventDefault();setMsg(null);
    try{await api.changePassword(cur,next);setCur('');setNext('');setMsg({type:'ok',text:'Password changed'})}
    catch(err){setMsg({type:'error',text:err.message})}
  };
  return <>
    <div className="page-head"><h1>Account</h1></div>
    <form className="card narrow-card" onSubmit={submit}>
      <p className="muted">Signed in as <strong>{email}</strong></p>
      {msg&&<div className={`alert ${msg.type}`}>{msg.text}</div>}
      <label>Current password<input type="password" autoComplete="current-password" required value={cur} onChange={e=>setCur(e.target.value)}/></label>
      <label>New password (8+ characters)<input type="password" autoComplete="new-password" minLength={8} required value={next} onChange={e=>setNext(e.target.value)}/></label>
      <button className="btn-primary">Change password</button>
    </form>
  </>;
}
