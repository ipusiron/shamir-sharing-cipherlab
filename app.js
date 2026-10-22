/* ShamirSharing CipherLab - MIT (c) 2026 ipusiron. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const stored = key => { try { return localStorage.getItem('shamir-sharing-cipherlab.' + key); } catch (_) { return null; } };
  let language = stored('language') === 'en' ? 'en' : 'ja';
  let theme = stored('theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  const t = key => ShamirMessages[language][key] || key;
  const tabs = ['hand', 'bytes', 'pitfalls'];
  let active = 'hand';
  function save() { try { localStorage.setItem('shamir-sharing-cipherlab.language', language); localStorage.setItem('shamir-sharing-cipherlab.theme', theme); } catch (_) { /* storage can be unavailable */ } }
  function render() {
    document.documentElement.lang = language;
    document.documentElement.dataset.theme = theme;
    document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll('[data-label]').forEach(el => { el.setAttribute('aria-label', t(el.dataset.label)); });
    $('language').textContent = language === 'ja' ? 'EN' : '日';
    for (const name of tabs) {
      const selected = name === active;
      $('tab-' + name).setAttribute('aria-selected', String(selected));
      $('tab-' + name).tabIndex = selected ? 0 : -1;
      $('panel-' + name).hidden = !selected;
    }
  }
  tabs.forEach((name, index) => {
    const tab = $('tab-' + name);
    tab.addEventListener('click', () => { active = name; render(); });
    tab.addEventListener('keydown', event => {
      const move = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
      if (!move && event.key !== 'Home' && event.key !== 'End') return;
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + move + tabs.length) % tabs.length;
      active = tabs[next]; render(); $('tab-' + active).focus();
    });
  });
  $('theme').addEventListener('click', () => { theme = theme === 'dark' ? 'light' : 'dark'; save(); render(); });
  $('language').addEventListener('click', () => { language = language === 'ja' ? 'en' : 'ja'; save(); render(); });
  $('help').addEventListener('click', () => $('help-dialog').showModal());
  $('close-help').addEventListener('click', () => $('help-dialog').close());
  render();
}());
