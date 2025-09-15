
// state
const LS = { get:(k,d=null)=>{ try{return JSON.parse(localStorage.getItem(k))??d}catch{return d} }, set:(k,v)=>localStorage.setItem(k,JSON.stringify(v)) };
const state = { patients: LS.get('patients',[]), meds: LS.get('meds',[]), templates: LS.get('templates',{}) };

// dom
const $ = id=>document.getElementById(id);
const doctorName=$('doctorName'), doctorCrm=$('doctorCrm'), clinicInfo=$('clinicInfo');
const patientSelect=$('patientSelect'), patientsList=$('patientsList'), patientNew=$('patientNew');
const addPatient=$('addPatient'), removePatient=$('removePatient');
const datePresc=$('datePresc'), typePresc=$('typePresc');
const items=$('items'), addItem=$('addItem'), clearItems=$('clearItems');
const templateSelect=$('templateSelect'), applyTemplate=$('applyTemplate'), saveTemplate=$('saveTemplate'), deleteTemplate=$('deleteTemplate');
const observations=$('observations'), alerts=$('alerts'), previewText=$('previewText');
const generatePdf=$('generatePdf'), signVidaas=$('signVidaas'), clearAll=$('clearAll');
const medsList=document.getElementById('medsList'), downloadLinks=$('downloadLinks');

function addAlert(msg,type='warn'){ const d=document.createElement('div'); d.className='alert '+type; d.textContent=msg; alerts.appendChild(d); setTimeout(()=>d.remove(),6000); }

function refreshLists(){
  patientsList.innerHTML = state.patients.map(p=>`<option value="${p}">`).join('');
  templateSelect.innerHTML = Object.keys(state.templates).length ? Object.keys(state.templates).map(k=>`<option value="${k}">${k}</option>`).join('') : `<option value="">— sem modelos —</option>`;
}
function itemTemplate(){
  const div=document.createElement('div'); div.className='item';
  div.innerHTML=`
  <div class="row-inline">
    <div><label>Medicamento</label><input class="med" list="medsList" placeholder="Nome do fármaco"></div>
    <div><label>Apresentação</label><input class="apresentacao" placeholder="ex.: 500 mg comp."></div>
  </div>
  <div class="row-inline">
    <div><label>Posologia</label><input class="posologia" placeholder="ex.: 1 comp. 8/8h"></div>
    <div><label>Via</label><input class="via" placeholder="VO, IV, IM, SC"></div>
  </div>
  <div class="row-inline">
    <div><label>Duração</label><input class="duracao" placeholder="ex.: 7 dias"></div>
    <div><label>Obs.</label><input class="obs" placeholder="Orientações adicionais"></div>
  </div>
  <div class="row">
    <button class="light remove">Remover</button>
  </div>`;
  div.querySelector('.remove').onclick=()=>div.remove();
  return div;
}
function collectPayload(strict=true){
  const itensData = Array.from(items.querySelectorAll('.item')).map(div=>({
    nome: div.querySelector('.med').value.trim(),
    apresentacao: div.querySelector('.apresentacao').value.trim(),
    posologia: div.querySelector('.posologia').value.trim(),
    via: div.querySelector('.via').value.trim(),
    duracao: div.querySelector('.duracao').value.trim(),
    obs: div.querySelector('.obs').value.trim()
  })).filter(it=>it.nome);
  const payload={
    medico: doctorName.value.trim(),
    crm: doctorCrm.value.trim(),
    clinica: clinicInfo.value.trim(),
    paciente: patientSelect.value.trim(),
    data: datePresc.value,
    tipo: typePresc.value,
    itens: itensData,
    observacoes: observations.value.trim()
  };
  if(strict){
    const missing=[];
    if(!payload.medico) missing.push('Nome do médico');
    if(!payload.crm) missing.push('CRM');
    if(!payload.paciente) missing.push('Paciente');
    if(!payload.data) missing.push('Data');
    if(payload.itens.length===0) missing.push('Pelo menos 1 item');
    if(missing.length){ addAlert('Preencha: '+missing.join(', '),'err'); throw new Error('Invalid'); }
  }
  return payload;
}
function refreshPreview(){
  const p = collectPayload(false);
  const lines=[
    `Emitente: ${p.medico} — CRM: ${p.crm}`,
    `Clínica: ${p.clinica || '[não informado]'}`,
    `Paciente: ${p.paciente} | Data: ${p.data} | Tipo: ${p.tipo}`,
    '', 'Prescrições:'
  ];
  p.itens.forEach((it,i)=>{
    lines.push(`${i+1}. ${it.nome} — ${it.apresentacao || ''}`);
    lines.push(`   Posologia: ${it.posologia || '[não informado]'} | Via: ${it.via || '[não informado]'} | Duração: ${it.duracao || '[não informado]'}${it.obs? ' | Obs.: '+it.obs:''}`);
  });
  if(p.observacoes) lines.push('', 'Observações:', p.observacoes);
  previewText.textContent = lines.join('\n');
}
async function generatePdfBytes(payload){
  const { PDFDocument, StandardFonts } = PDFLib;
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  page.drawText('RECEITUÁRIO MÉDICO', {x:50,y:800,size:16,font:bold});
  page.drawText(`Emitente: ${payload.medico} — CRM: ${payload.crm}`, {x:50,y:780,size:12,font});
  if(payload.clinica) page.drawText(`Clínica: ${payload.clinica}`, {x:50,y:764,size:12,font});
  page.drawText(`Paciente: ${payload.paciente}`, {x:50,y:740,size:12,font});
  page.drawText(`Data: ${payload.data} — Tipo: ${payload.tipo==='special'?'Controle Especial':'Simples'}`, {x:50,y:724,size:12,font});

  let y=700;
  page.drawText('Prescrições:', {x:50,y,size:12,font:bold});
  y-=18;
  payload.itens.forEach((it,idx)=>{
    const block = `${idx+1}. ${it.nome} — ${it.apresentacao||''}`;
    page.drawText(block,{x:60,y,size:12,font}); y-=16;
    const line = `Posologia: ${it.posologia||'[não informado]'} | Via: ${it.via||'[não informado]'} | Duração: ${it.duracao||'[não informado]'}${it.obs? ' | Obs.: '+it.obs:''}`;
    page.drawText(line,{x:60,y,size:12,font}); y-=22;
  });
  if(payload.observacoes){
    page.drawText('Orientações/Observações:', {x:50,y,size:12,font:bold}); y-=18;
    payload.observacoes.split(/\n+/).forEach(l=>{ page.drawText(l,{x:60,y,size:12,font}); y-=16; });
  }
  page.drawText('_______________________________', {x:50,y:140,size:12,font});
  page.drawText(`${payload.medico} — CRM ${payload.crm}`, {x:50,y:122,size:12,font});

  // QR com hash local
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify({m:payload.medico,c:payload.crm,p:payload.paciente,d:payload.data,t:payload.tipo,i:payload.itens})));
  const hashHex = Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,'0')).join('');
  const qrCanvas = document.createElement('canvas');
  await QRCode.toCanvas(qrCanvas, `Prescricao hash:${hashHex}`, {width:148});
  const pngUrl = qrCanvas.toDataURL('image/png');
  const pngBytes = await (await fetch(pngUrl)).arrayBuffer();
  const qrImage = await pdfDoc.embedPng(pngBytes);
  page.drawText('Verificação local (hash):', {x:400,y:160,size:10,font:bold});
  page.drawText(hashHex.slice(0,16)+'…', {x:400,y:146,size:10,font});
  page.drawImage(qrImage,{x:400,y:170,width:148,height:148});

  const bytes = await pdfDoc.save();
  return bytes;
}
function saveBlob(bytes, name){
  const blob = new Blob([bytes], {type:'application/pdf'});
  const url = URL.createObjectURL(blob);
  const a=document.createElement('a'); a.href=url; a.download=name; a.textContent='Baixar '+name;
  downloadLinks.innerHTML=''; downloadLinks.appendChild(a);
  a.click();
}
addItem.onclick = ()=>{ items.appendChild(itemTemplate()); refreshPreview(); };
clearItems.onclick = ()=>{ items.innerHTML=''; refreshPreview(); };
addPatient.onclick = ()=>{ const p=patientNew.value.trim(); if(!p) return; if(!state.patients.includes(p)) state.patients.push(p); LS.set('patients',state.patients); patientNew.value=''; refreshLists(); };
removePatient.onclick = ()=>{ const p=patientSelect.value.trim(); state.patients=state.patients.filter(x=>x!==p); LS.set('patients',state.patients); refreshLists(); };

saveTemplate.onclick = ()=>{
  const name=prompt('Nome do modelo:');
  if(!name) return;
  const payload=collectPayload(false);
  state.templates[name]=payload; LS.set('templates',state.templates); refreshLists();
};
applyTemplate.onclick = ()=>{
  const key=templateSelect.value; const tpl=state.templates[key]; if(!tpl) return;
  items.innerHTML=''; (tpl.itens||[]).forEach(it=>{ const div=itemTemplate(); div.querySelector('.med').value=it.nome||''; div.querySelector('.apresentacao').value=it.apresentacao||''; div.querySelector('.posologia').value=it.posologia||''; div.querySelector('.via').value=it.via||''; div.querySelector('.duracao').value=it.duracao||''; div.querySelector('.obs').value=it.obs||''; items.appendChild(div); });
  observations.value = tpl.observacoes||''; refreshPreview();
};

[patientSelect,doctorName,doctorCrm,clinicInfo,datePresc,typePresc,observations].forEach(el=> el.addEventListener('input', refreshPreview));

generatePdf.onclick = async ()=>{
  try{
    const payload=collectPayload(true);
    const bytes=await generatePdfBytes(payload);
    saveBlob(bytes,'prescricao.pdf');
  }catch(e){/*handled*/}
};

// Handoff para VIDaaS
let lastPdfBytes=null;
signVidaas.onclick = async ()=>{
  try{
    const payload=collectPayload(true);
    lastPdfBytes = await generatePdfBytes(payload);
    // Salvar temporariamente em disco via download; usuário sobe no portal oficial
    saveBlob(lastPdfBytes, 'prescricao-para-assinar.pdf');
    alert('PDF gerado. Faça login e assine em: https://assinar-com.vidaas.com.br/');
    window.open('https://assinar-com.vidaas.com.br/','_blank');
  }catch(e){/*handled*/}
};

// init
(function init(){
  refreshLists();
  addItem.click();
  const today=new Date().toISOString().slice(0,10);
  datePresc.value=today;
  refreshPreview();
})();
