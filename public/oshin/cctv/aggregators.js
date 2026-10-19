const themeButton = document.querySelector('#theme-toggle');
const THEME_KEY = 'oshin-cctv-theme';
function applyTheme(theme) {
 const actual=theme==='light'?'light':'dark';
 document.documentElement.dataset.theme=actual;
 themeButton.setAttribute('aria-pressed',String(actual==='dark'));
 themeButton.setAttribute('aria-label',actual==='dark'?'Ubah ke mode terang':'Ubah ke mode gelap');
 themeButton.textContent=actual==='dark'?'☀ Mode terang':'☾ Mode gelap';
 const color=document.querySelector('meta[name="theme-color"]');
 if(color)color.setAttribute('content',actual==='dark'?'#0a1421':'#f2f6f9');
}
applyTheme(document.documentElement.dataset.theme);
themeButton.addEventListener('click',()=>{
 const next=document.documentElement.dataset.theme==='dark'?'light':'dark';
 applyTheme(next);
 try { localStorage.setItem(THEME_KEY,next); } catch { /* optional preference */ }
});

const dom={
 status:document.querySelector('#status'),
 summary:document.querySelector('#summary'),
 snapshots:document.querySelector('#snapshots'),
 regions:document.querySelector('#regions'),
 directory:document.querySelector('#directory-link'),
 disclaimer:document.querySelector('#source-disclaimer')
};
function el(tag,cls,content){
 const x=document.createElement(tag);if(cls)x.className=cls;
 if(content!==undefined)x.textContent=String(content);return x;
}
function checkedLink(url,label){
 if(typeof url!=='string'||!url.startsWith('https://'))return null;
 const x=el('a','',label);x.href=url;x.target='_blank';x.rel='noopener noreferrer';return x;
}
function card(n,label){
 const x=el('div','stat');
 x.append(el('b','',new Intl.NumberFormat('id-ID').format(n)),el('span','',label));
 return x;
}
async function load(){
 try{
  const response=await fetch('./aggregator-observations.json',{cache:'no-store'});
  if(!response.ok)throw Error('HTTP '+response.status);
  const dataset=await response.json();
  if(dataset._schema.representation!=='AGGREGATOR_PORTAL_NAVIGATION_ONLY'||!Array.isArray(dataset.counts))throw Error('Schema tidak sesuai');
  dom.directory.href=dataset.directory.url;
  dom.disclaimer.href=dataset.directory.disclaimer_url;
  const claim=dataset.counts.find(x=>x.id==='gemini');
  const index=dataset.counts.find(x=>x.id==='main-current');
  dom.summary.replaceChildren(
    card(claim.reported_count,'Klaim Gemini · tidak membuktikan semua stream aktif'),
    card(index.reported_count,'Klaim pada indeks portal yang diperiksa 19 Okt 2026'),
    card(dataset.directory.individual_camera_records_imported,'Kamera individual dari agregator yang sudah diimpor OSHIN')
  );
  dom.snapshots.replaceChildren();
  for(const item of dataset.counts){
    const node=el('article','snapshot'),left=el('div'),right=el('div');
    left.append(el('b','',new Intl.NumberFormat('id-ID').format(item.reported_count)));
    left.append(el('p','',item.count_type));
    right.append(el('p','',item.observation_date||'Tanggal pasti tidak tersedia'));
    const source=checkedLink(item.source_url,'Lihat sumber ↗');
    if(source)right.append(source);
    node.append(left,right);dom.snapshots.append(node);
  }
  dom.regions.replaceChildren();
  for(const region of dataset.regions_sample.sample_items){
    const c=el('article','region');
    c.append(el('b','',region.name),el('span','num',new Intl.NumberFormat('id-ID').format(region.claimed_entries)));
    const a=checkedLink(region.source_url,'Buka direktori wilayah ↗');
    if(a)c.append(a);dom.regions.append(c);
  }
  dom.status.textContent='Terakhir didokumentasikan 19 Oktober 2026 · angka dari sumber, bukan hasil uji playback OSHIN.';
 }catch(error){dom.status.textContent='Gagal memuat pengamatan agregator: '+error.message;}
}
load();
