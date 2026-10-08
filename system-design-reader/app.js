'use strict';
window.ReaderChapters = {};
const chapters = window.ReaderManifest;
const $ = id => document.getElementById(id);
let state;
try { state = JSON.parse(localStorage.getItem('system-design-reader') || '{}'); } catch { state = {}; }
if (!state || typeof state !== 'object') state = {};
state.read = Array.isArray(state.read) ? state.read : [];
let current, navigation = 0;
function save() {
  try { localStorage.setItem('system-design-reader', JSON.stringify(state)); }
  catch { $('save-status').textContent = 'Progress is available for this session only.'; }
}
function theme() {
  document.documentElement.dataset.theme = state.dark ? 'dark' : 'light';
  $('theme').textContent = state.dark ? 'Light theme' : 'Dark theme';
}
function list() {
  const query = $('search').value.trim().toLowerCase();
  const matches = chapters.filter(c => (c.title + ' ' + c.text).toLowerCase().includes(query));
  $('chapters').replaceChildren();
  for (const c of matches) {
    const link = document.createElement('a');
    link.href = '#chapter-' + c.id;
    if (c.id === current) link.setAttribute('aria-current', 'page');
    const number = document.createElement('span');
    number.className = 'nav-number'; number.textContent = String(c.id).padStart(2, '0');
    const title = document.createElement('span'); title.textContent = c.title;
    const check = document.createElement('span'); check.className = 'read-check';
    check.textContent = state.read.includes(c.id) ? '✓' : '';
    if (check.textContent) check.setAttribute('aria-label', 'Read');
    link.append(number, title, check); $('chapters').append(link);
  }
  if (!matches.length) {
    const empty = document.createElement('p'); empty.className = 'empty';
    empty.textContent = 'No chapters found. Try another keyword.'; $('chapters').append(empty);
  }
  $('results').textContent = `${matches.length} chapter${matches.length === 1 ? '' : 's'}`;
  $('progress').textContent = `${state.read.length} / ${chapters.length} read`;
}
function load(id) {
  if (window.ReaderChapters[id]) return Promise.resolve(window.ReaderChapters[id]);
  return new Promise((resolve, reject) => {
    const script = document.createElement('script'); script.src = `chapters/${id}.js`;
    script.onload = () => { script.remove(); resolve(window.ReaderChapters[id]); };
    script.onerror = () => { script.remove(); reject(new Error('Chapter unavailable')); };
    document.head.append(script);
  });
}
async function route() {
  const match = location.hash.match(/^#chapter-(\d+)$/);
  if (!match && location.hash && current !== undefined) return;
  const requested = match ? Number(match[1]) : state.last;
  const chapter = chapters.find(c => c.id === requested) || chapters[0];
  const ticket = ++navigation;
  current = chapter.id;
  state.last = current; save(); list();
  $('sidebar').classList.remove('open'); $('menu').setAttribute('aria-expanded','false');
  $('chapter-number').textContent = 'CHAPTER ' + String(current).padStart(2,'0');
  $('reading-time').textContent = `${chapter.minutes} min read`;
  document.title = chapter.title + ' · System Design Library';
  $('content').textContent = 'Loading chapter…'; $('sections').replaceChildren();
  $('complete').disabled = true;
  const index = chapters.indexOf(chapter);
  $('previous').disabled = index === 0; $('next').disabled = index === chapters.length - 1;
  try {
    const data = await load(current);
    if (ticket !== navigation) return;
    $('content').innerHTML = data.html;
    for (const heading of data.headings) {
      const a = document.createElement('a'); a.href = '#' + heading.id; a.textContent = heading.title;
      $('sections').append(a);
    }
    $('complete').disabled = false; updateRead();
    window.scrollTo(0,0);
  } catch {
    if (ticket !== navigation) return;
    $('content').textContent = 'This chapter could not be loaded. Keep the chapters folder alongside index.html.';
    const retry = document.createElement('button'); retry.textContent = 'Try again'; retry.onclick = route;
    $('content').append(retry);
  }
}
function updateRead() { $('complete').textContent = state.read.includes(current) ? '✓ Read — mark unread' : 'Mark as read'; }
$('complete').onclick = () => {
  state.read = state.read.includes(current) ? state.read.filter(id => id !== current) : [...state.read,current];
  save(); updateRead(); list();
};
$('search').oninput = list;
$('theme').onclick = () => { state.dark = !state.dark; theme(); save(); };
$('menu').onclick = () => { const open = $('sidebar').classList.toggle('open'); $('menu').setAttribute('aria-expanded',String(open)); };
for (const [button,offset] of [['previous',-1],['next',1]]) {
  $(button).onclick = () => {
    const target = chapters[chapters.findIndex(c => c.id === current) + offset];
    if (target) location.hash = 'chapter-' + target.id;
  };
}
window.addEventListener('hashchange',route);
document.addEventListener('keydown',event => {
  if (event.key === 'Escape') { $('sidebar').classList.remove('open'); $('menu').setAttribute('aria-expanded','false'); }
});
theme(); route();
