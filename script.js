/* ----- ТОГТМОЛ ----- */
const TOTAL_Page = 64;                     // Нийт хуудас
const IMG_PATH = (i)=>`Page/${i}.png`;     // Зургийн зам
const STORE_KEY = 'oy_book_v1';             // localStorage түлхүүр

/* Хуудас төрөл (доод талын жижиг шошго) — хүсвэл зас */
const Page_TAGS = {
  1:'Нүүр', 2:'Нүүр', 3:'Нүүр',
  4:'Төгсгөл',5:'Төгсгөл',6:'Төгсгөл',7:'Төгсгөл',
  47:'Гарчиг',
  10:'Миний ертөнц',11:'Миний ертөнц',12:'Миний ертөнц',13:'Миний ертөнц',14:'Миний ертөнц',
  15:'Амьдралын дурсамж',16:'Амьдралын дурсамж',17:'Амьдралын дурсамж',18:'Амьдралын дурсамж',19:'Амьдралын дурсамж',
  20:'Талархал',21:'Талархал',22:'Талархал',23:'Талархал',24:'Талархал',
  25:'Хүнд үе',26:'Хүнд үе',27:'Хүнд үе',28:'Хүнд үе',29:'Хүнд үе',
  30:'Ухаарал',31:'Ухаарал',32:'Ухаарал',33:'Ухаарал',34:'Ухаарал',
  35:'Захидал',36:'Захидал',37:'Захидал',38:'Захидал',39:'Захидал',
  40:'Гомдол',41:'Гомдол',42:'Гомдол',43:'Гомдол',44:'Гомдол',
  45:'Тэмдэглэл',46:'Тэмдэглэл',8:'Тэмдэглэл',48:'Тэмдэглэл',49:'Тэмдэглэл',50:'Тэмдэглэл',
  56:'Баярт мөч',57:'Баярт мөч',58:'Баярт мөч',59:'Баярт мөч',60:'Баярт мөч',
  61:'Таны төрөл',62:'Таны төрөл',63:'Таны төрөл',64:'Таны төрөл'
};

/* ----- ТӨЛӨВ ----- */
let db = loadDB();
let currentPage = 1;

/* ----- ЭХЛЭЛ ----- */
initGrid();
hookTopbar();
hookEditor();

/* ===== ФУНКЦ ===== */
function loadDB(){
  try{
    const raw = localStorage.getItem(STORE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    // бүх хуудсанд хоосон массив бэлдье
    for(let i=1;i<=TOTAL_Page;i++){
      if(!parsed[i]) parsed[i] = { texts:[] };
    }
    return parsed;
  }catch(e){ console.warn(e); return {}; }
}
function saveDB(){ localStorage.setItem(STORE_KEY, JSON.stringify(db)); }

function initGrid(){
  const grid = document.getElementById('grid');
  grid.innerHTML = '';
  for(let i=1;i<=TOTAL_Page;i++){
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <img class="thumb" src="${IMG_PATH(i)}" alt="page ${i}" onerror="this.style.opacity='.2'"/>
      <div class="meta"><b>#${i}</b><span>${Page_TAGS[i]||''}</span></div>
    `;
    card.addEventListener('click', ()=>openEditor(i));
    grid.appendChild(card);
  }
}

function hookTopbar(){
  document.getElementById('btnExport').onclick = ()=>{
    const blob = new Blob([JSON.stringify(db,null,2)],{type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'oyunsanaa-book.json';
    a.click();
    URL.revokeObjectURL(a.href);
  };
  document.getElementById('btnImport').onclick = ()=> document.getElementById('fileImport').click();
  document.getElementById('fileImport').onchange = async (e)=>{
    const file = e.target.files[0]; if(!file) return;
    const text = await file.text();
    db = JSON.parse(text);
    saveDB();
    initGrid();
    alert('Импорт амжилттай.');
  };
  document.getElementById('btnPDF').onclick = exportPDF;
}

/* ---------- EDITOR ---------- */
function hookEditor(){
  const dlg = document.getElementById('editor');
  document.getElementById('btnClose').onclick = ()=> dlg.close();
  document.getElementById('btnSave').onclick = ()=>{ saveCurrent(); dlg.close(); };
  document.getElementById('btnAddText').onclick = ()=> addTextBox();
}

function openEditor(n){
  currentPAGE = n;
  document.getElementById('edPAGENo').textContent = n;
  const wrap = document.getElementById('canvasWrap');
  wrap.innerHTML = '';
  const Page = document.createElement('div');
  page.className = 'Page';
  page.style.backgroundImage = `url(${IMG_PATH(n)})`;
  wrap.appendChild(Page);

  // одоо байгаа боксууд
  (db[n]?.texts || []).forEach(t => Page.appendChild(makeBox(t)));

  document.getElementById('editor').showModal();
}

function addTextBox(){
  const Page = document.querySelector('.Page');
  const t = { x:40, y:40, w:260, h:80, fs:16, color:'#111111', txt:'Энд бичнэ…' };
  page.appendChild(makeBox(t));
}

function makeBox(t){
  const el = document.createElement('div');
  el.className = 'box';
  el.contentEditable = true;
  el.textContent = t.txt || '';
  el.style.left = (t.x||40)+'px';
  el.style.top = (t.y||40)+'px';
  el.style.width = (t.w||240)+'px';
  el.style.height = (t.h||80)+'px';
  el.style.fontSize = (t.fs||16)+'px';
  el.style.color = t.color || '#111';
  // resize handle
  const h = document.createElement('div');
  h.className = 'handle';
  el.appendChild(h);

  // drag
  let dx=0, dy=0, dragging=false;
  el.addEventListener('mousedown', (e)=>{
    if(e.target===h) return;    // resize дээр биш бол drag
    dragging=true; dx=e.offsetX; dy=e.offsetY; el.focus(); 
  });
  window.addEventListener('mousemove',(e)=>{
    if(!dragging) return;
    const r = el.parentElement.getBoundingClientRect();
    el.style.left = Math.max(0, Math.min(e.clientX - r.left - dx, r.width - el.offsetWidth)) + 'px';
    el.style.top  = Math.max(0, Math.min(e.clientY - r.top  - dy, r.height - el.offsetHeight)) + 'px';
  });
  window.addEventListener('mouseup',()=> dragging=false);

  // resize
  let resizing=false, rx=0, ry=0;
  h.addEventListener('mousedown',(e)=>{ resizing=true; rx=e.clientX; ry=e.clientY; e.stopPropagation(); });
  window.addEventListener('mousemove',(e)=>{
    if(!resizing) return;
    const dw = e.clientX - rx, dh = e.clientY - ry;
    el.style.width  = Math.max(90, el.offsetWidth  + dw) + 'px';
    el.style.height = Math.max(40, el.offsetHeight + dh) + 'px';
    rx=e.clientX; ry=e.clientY;
  });
  window.addEventListener('mouseup',()=> resizing=false);

  return el;
}

function saveCurrent(){
  const n = currentPage;
  const Page = document.querySelector('.page');
  const boxes = [.Page.querySelectorAll('.box')];
  db[n] = { texts: boxes.map(b => ({
    x: b.offsetLeft, y: b.offsetTop, w: b.offsetWidth, h: b.offsetHeight,
    fs: parseInt(getComputedStyle(b).fontSize,10),
    color: rgb2hex(getComputedStyle(b).color),
    txt: b.textContent.trim()
  }))};
  saveDB();
}

function rgb2hex(rgb){
  const m = rgb.match(/\d+/g);
  if(!m) return '#111111';
  return '#' + m.slice(0,3).map(x=>Number(x).toString(16).padStart(2,'0')).join('');
}

/* ---------- PDF ---------- */
async function exportPDF(){
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF('p','mm','a4');
  const pw = pdf.internal.pageSize.getWidth();
  const ph = pdf.internal.pageSize.getHeight();

  for(let i=1;i<=TOTAL_Page;i++){
    // түр DOM
    const stage = document.createElement('div');
    stage.className = 'Page';
    stage.style.width = '794px';            // ~A4 @96dpi
    stage.style.height = '1123px';
    stage.style.backgroundImage = `url(${IMG_PATH(i)})`;

    (db[i]?.texts||[]).forEach(t=>{
      const b = document.createElement('div');
      b.className='box'; b.style.border='none'; b.style.background='transparent';
      Object.assign(b.style,{
        left:t.x+'px', top:t.y+'px', width:t.w+'px', height:t.h+'px',
        fontSize:t.fs+'px', color:t.color
      });
      b.textContent = t.txt||'';
      stage.appendChild(b);
    });

    document.body.appendChild(stage);
    const canvas = await html2canvas(stage,{backgroundColor:null, scale:2});
    const img = canvas.toDataURL('image/png');
    pdf.addImage(img,'PNG',0,0,pw,ph);
    document.body.removeChild(stage);
    if(i<TOTAL_Page) pdf.addPAGE();
  }
  pdf.save('oyunsanaa-book.pdf');
}
