/* CSV parser: quoted commas, escaped quotes, CRLF and multiline cells. */
(function(root){
function parseCSV(text){
 const rows=[];let row=[],cell='',quoted=false;
 text=text.replace(/^\uFEFF/,'');
 for(let i=0;i<text.length;i++){
  const c=text[i];
  if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}
  else if(c===','&&!quoted){row.push(cell);cell='';}
  else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);rows.push(row);row=[];cell='';}
  else cell+=c;
 }
 if(quoted)throw Error('Незакрытая кавычка в CSV');
 if(cell!==''||row.length){row.push(cell);rows.push(row);}
 const headers=(rows.shift()||[]).map(x=>x.trim());
 for(const key of ['longitude','latitude','Name','Description'])if(!headers.includes(key))throw Error('В CSV нет столбца '+key);
 let skipped=0;const points=[];
 for(const r of rows){
  if(r.every(x=>!x.trim()))continue;
  const o=Object.fromEntries(headers.map((h,i)=>[h,(r[i]??'').trim()]));
  const lat=Number(o.latitude.replace(',','.')),lng=Number(o.longitude.replace(',','.'));
  if(!o.latitude||!o.longitude||!Number.isFinite(lat)||!Number.isFinite(lng)||Math.abs(lat)>90||Math.abs(lng)>180){skipped++;continue;}
  points.push({...o,lat,lng});
 }
 if(!points.length)throw Error('В CSV нет корректных точек');
 return {points,skipped};
}
root.MapData={parseCSV};
})(typeof window==='undefined'?globalThis:window);
