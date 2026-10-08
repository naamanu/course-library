'use strict';
const grid = document.getElementById('course-grid');
const input = document.getElementById('course-search');
let dark = false;
try { dark = localStorage.getItem('course-library-theme') === 'dark'; } catch {}
function setTheme() {
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  document.getElementById('library-theme').textContent = dark ? 'Light theme' : 'Dark theme';
}
document.getElementById('library-theme').onclick = () => {
  dark = !dark; setTheme();
  try { localStorage.setItem('course-library-theme', dark ? 'dark' : 'light'); } catch {}
};
function render() {
  const query = input.value.trim().toLowerCase();
  const courses = window.CourseCatalog.filter(c => `${c.title} ${c.publisher}`.toLowerCase().includes(query));
  grid.replaceChildren();
  for (const course of courses) {
    const card = document.createElement('a'); card.className = 'course-card'; card.href = `${course.slug}/index.html`;
    const badge = document.createElement('span'); badge.className = 'brand-icon'; badge.textContent = course.badge;
    const title = document.createElement('h2'); title.textContent = course.title;
    const publisher = document.createElement('p'); publisher.textContent = course.publisher;
    const bottom = document.createElement('span'); bottom.className = 'card-bottom';
    const count = document.createElement('span'); count.textContent = `${course.count} lessons`;
    const open = document.createElement('span'); open.textContent = 'Open course →'; bottom.append(count,open);
    card.append(badge,title,publisher,bottom); grid.append(card);
  }
  document.getElementById('course-count').textContent = `${courses.length} courses`;
  document.getElementById('no-courses').hidden = courses.length > 0;
}
input.oninput = render;
setTheme(); render();
