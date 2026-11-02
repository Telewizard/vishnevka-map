const statusEl=document.getElementById('status'),refresh=document.getElementById('refresh');
if(!window.L){statusEl.textContent='Не удалось загрузить Leaflet. Проверьте интернет и перезагрузите страницу.';throw Error('Leaflet unavailable');}
const cfg=window.MAP_CONFIG,map=L.map('map',{maxZoom:22}).setView([60.246,29.171],17);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxNativeZoom:19,maxZoom:22,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).addTo(map);
let layer=L.featureGroup().addTo(map),first=true,busy=false;
const source=cfg.csvUrl.trim(),cacheKey='vishnevka-csv:'+source;
function draw(parsed){
 const next=L.featureGroup();
 for(const p of parsed.points){
  const candidate=cfg.colorsByName[p.Name]||cfg.defaultColor;
  const color=/^#[0-9a-f]{6}$/i.test(candidate)?candidate:'#2563a6';
  const label=document.createElement('div'),title=document.createElement('strong'),value=document.createElement('span');
  title.textContent=p.Description||'Без номера';value.textContent='Name: '+p.Name;label.append(title,value);
  L.circleMarker([p.lat,p.lng],{radius:5,color,fillColor:color,fillOpacity:.9,weight:2}).bindTooltip(label,{permanent:true,direction:'right',offset:[8,0],className:'plot-label',opacity:1}).addTo(next);
 }
 layer.remove();layer=next.addTo(map);
 if(first){map.fitBounds(layer.getBounds(),{padding:[65,65],maxZoom:18});first=false;}
}
function message(text,error=false){statusEl.textContent=text;statusEl.classList.toggle('error',error);}
async function update(){
 if(busy)return;busy=true;refresh.disabled=true;
 try{
  if(source){const url=new URL(source);if(url.protocol!=='https:')throw Error('Нужна HTTPS-ссылка CSV');}
  const response=await fetch(source||'snapshot.csv',{cache:'no-store',signal:AbortSignal.timeout(20000)});
  if(!response.ok)throw Error('HTTP '+response.status);
  const csv=await response.text(),parsed=MapData.parseCSV(csv);draw(parsed);
  const time=new Date().toLocaleString('ru-RU');
  if(source){try{localStorage.setItem(cacheKey,JSON.stringify({csv,time}));}catch{}}
  message(`${parsed.points.length} точек · ${source?'Проверено: '+time:'Снимок Excel от 03.11.2026 — CSV ещё не подключён'}${parsed.skipped?' · Пропущено строк: '+parsed.skipped:''}`);
 }catch(error){
  let cached=false;
  if(first&&source){try{const saved=JSON.parse(localStorage.getItem(cacheKey));if(saved){draw(MapData.parseCSV(saved.csv));message('Нет обновления. Сохранённые данные от '+saved.time+'. '+error.message,true);cached=true;}}catch{}}
  if(!cached)message('Не удалось обновить: '+error.message+(first?'. Проверьте публикацию CSV.':'. На карте остаются предыдущие данные.'),true);
 }finally{busy=false;refresh.disabled=false;}
}
document.getElementById('fit').onclick=()=>{if(layer.getLayers().length)map.fitBounds(layer.getBounds(),{padding:[65,65],maxZoom:18});};
refresh.onclick=update;
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&source)update();});
update();if(source)setInterval(()=>{if(!document.hidden)update();},Math.max(30,cfg.refreshSeconds)*1000);
