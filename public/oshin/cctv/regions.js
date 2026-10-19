const els={
 kind:document.querySelector('#kind'),province:document.querySelector('#province'),
 status:document.querySelector('#status'),search:document.querySelector('#search'),
 results:document.querySelector('#results'),info:document.querySelector('#info'),
 stats:document.querySelector('#stats'),more:document.querySelector('#more')
};
let coverage=null,sourceMap=new Map(),shown=30,matched=[];

function node(tag,cls,text){
 const item=document.createElement(tag);
 if(cls)item.className=cls;
 if(text!==undefined)item.textContent=String(text);
 return item;
}
function metric(value,label){
 const item=node('div','metric');
 item.append(node('span','value',value),node('span','label',label));
 return item;
}
function sourceLink(id,kind){
 const s=sourceMap.get(id);
 if(!s||typeof s.portal_url!=='string'||!s.portal_url.startsWith('https://'))return null;
 const a=node('a','',s.operator+' ↗');
 a.href=s.portal_url;
 a.target='_blank';
 a.rel='noopener noreferrer';
 a.title=kind==='province'?'Kandidat sumber tingkat provinsi, bukan kamera terkonfirmasi di kota ini':'Portal publik operator — status stream belum terverifikasi';
 return a;
}
const labels={
 SOURCE_CANDIDATE:'Kandidat sumber langsung',
 PROVINCE_PORTAL_CANDIDATE:'Portal tingkat provinsi',
 HISTORICAL_SOURCE_ONLY:'Portal lama / offline',
 NO_SOURCE_MAPPED:'Belum terpetakan'
};
function regionCard(row){
 const card=node('article','region'+(row.priority_tag?' priority':''));
 const head=node('div','region-header'),title=node('div');
 title.append(node('h2','',row.name),node('p','muted',row.province+' · Kode '+row.region_code));
 head.append(title,node('span','status'+(row.research_status==='NO_SOURCE_MAPPED'?' empty':''),labels[row.research_status]||'Belum diverifikasi'));
 card.append(head);
 const total=row.direct_source_ids.length+row.province_portal_source_ids.length;
 if(total>0){
  const links=node('div','sources');
  for(const id of row.direct_source_ids){
   const a=sourceLink(id,'direct');if(a)links.append(a);
  }
  for(const id of row.province_portal_source_ids){
   const a=sourceLink(id,'province');if(a)links.append(a);
  }
  card.append(links);
  if(row.province_portal_source_ids.length)card.append(node('p','muted','Portal DKI berlaku di tingkat provinsi; kamera per kota administrasi belum dikonfirmasi.'));
 }else{
  card.append(node('p','muted','Wajib riset: portal Pemda/Dishub/ATCS, titik dan hak publikasi. Belum ada sumber yang terpetakan pada registri OSHIN.'));
 }
 card.append(node('p','muted','Live teruji: 0 · Lokasi kamera terverifikasi: 0 · Izin restream: belum dinilai'));
 return card;
}
function renderPage(reset=false){
 if(reset){
  shown=30;
  const q=els.search.value.trim().toLocaleLowerCase('id');
  matched=coverage.regions.filter(row=>{
   if(els.kind.value==='CITY'&&!row.kind.startsWith('CITY'))return false;
   if(els.kind.value==='REGENCY'&&row.kind!=='REGENCY')return false;
   if(els.province.value&&els.province.value!==row.province_code)return false;
   if(els.status.value&&els.status.value!==row.research_status)return false;
   if(q&&!((row.name+' '+row.province+' '+row.region_code).toLocaleLowerCase('id').includes(q)))return false;
   return true;
  });
  matched.sort((a,b)=>{
   const sa=a.priority_tag?0:1,sb=b.priority_tag?0:1;
   return sa-sb||a.province.localeCompare(b.province,'id')||a.name.localeCompare(b.name,'id');
  });
 }
 els.results.replaceChildren(...matched.slice(0,shown).map(regionCard));
 els.more.hidden=shown>=matched.length;
 els.info.textContent=matched.length+' wilayah ditemukan · '+Math.min(shown,matched.length)+' ditampilkan · semua tetap wajib dicari sumber CCTV-nya.';
}
async function init(){
 try{
  const [a,b]=await Promise.all([fetch('./regions.json',{cache:'no-store'}),fetch('./registry.json',{cache:'no-store'})]);
  if(!a.ok||!b.ok)throw Error('HTTP sumber gagal');
  const regionData=await a.json(),sourceData=await b.json();
  if(!Array.isArray(regionData.regions)||!Array.isArray(sourceData.sources))throw Error('Format registry tidak valid');
  coverage=regionData;
  sourceMap=new Map(sourceData.sources.map(s=>[s.id,s]));
  const st=regionData.stats;
  els.stats.replaceChildren(
   metric(st.cities,'Kota wajib dicakup'),
   metric(st.regencies,'Kabupaten wajib dicakup'),
   metric(st.provinces,'Provinsi'),
   metric(st.cities_without_mapped_source,'Kota perlu penemuan sumber')
  );
  for(const prov of regionData.regions.reduce((map,row)=>(map.set(row.province_code,row.province),map),new Map())){
   const opt=node('option','',prov[1]);opt.value=prov[0];els.province.append(opt);
  }
  for(const element of [els.kind,els.province,els.status,els.search])
   element.addEventListener('input',()=>renderPage(true));
  els.more.addEventListener('click',()=>{shown+=30;renderPage(false);});
  renderPage(true);
 }catch(error){
  els.info.textContent='Gagal memuat cakupan nasional: '+error.message;
 }
}
init();
