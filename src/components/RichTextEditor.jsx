import React,{useEffect,useRef} from 'react';

const tools=[
  ['B','bold',null,'Bold'],['I','italic',null,'Italic'],['H2','formatBlock','h2','Heading'],['H3','formatBlock','h3','Sub heading'],
  ['¶','formatBlock','p','Paragraph'],['• List','insertUnorderedList',null,'Bullet list'],['1. List','insertOrderedList',null,'Numbered list'],['❝','formatBlock','blockquote','Quote']
];

/* Small dependency-free rich text editor. Output is HTML (sanitised again by the server). */
export default function RichTextEditor({value,onChange}){
  const ref=useRef(null);
  useEffect(()=>{if(ref.current&&ref.current.innerHTML!==(value||''))ref.current.innerHTML=value||''},[value]);
  const run=(cmd,arg)=>{ref.current.focus();document.execCommand(cmd,false,arg?`<${arg}>`:null);onChange(ref.current.innerHTML)};
  const link=()=>{
    const url=window.prompt('Link address (https://...)');
    if(!url)return;
    if(!/^(https?:\/\/|mailto:|tel:)/i.test(url)){alert('The link must start with https://, http://, mailto: or tel:');return}
    ref.current.focus();document.execCommand('createLink',false,url);onChange(ref.current.innerHTML);
  };
  return <div className="rte">
    <div className="rte-bar">
      {tools.map(([label,cmd,arg,title])=><button type="button" key={title} title={title} onMouseDown={e=>e.preventDefault()} onClick={()=>run(cmd,arg)}>{label}</button>)}
      <button type="button" title="Add link" onMouseDown={e=>e.preventDefault()} onClick={link}>🔗</button>
      <button type="button" title="Remove formatting" onMouseDown={e=>e.preventDefault()} onClick={()=>run('removeFormat')}>Clear</button>
    </div>
    <div ref={ref} className="rte-area" contentEditable suppressContentEditableWarning spellCheck
      onInput={()=>onChange(ref.current.innerHTML)}
      onPaste={e=>{e.preventDefault();document.execCommand('insertText',false,e.clipboardData.getData('text/plain'))}}/>
  </div>;
}
