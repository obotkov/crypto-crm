/* WildEx — поведение макетов: переключение экранов, табы и шторки.
   Данных пока нет, всё статично: логику навесим позже. */
(() => {
  'use strict';

  /* ── Экраны ───────────────────────────────────────────────────────────── */

  const views = [...document.querySelectorAll('[data-view]')];
  const navButtons = [...document.querySelectorAll('[data-goto]')];

  // Экран верхнего уровня, к которому относится вложенный (для подсветки навигации).
  const parentTab = {
    portfolio: 'portfolios',
    coin: 'portfolios',
  };

  function showView(name, { push = true } = {}) {
    const target = views.find((v) => v.dataset.view === name);
    if (!target) return;

    views.forEach((v) => v.classList.toggle('is-active', v === target));

    // Подсвечиваем раздел верхнего уровня; список портфелей в сайдбаре
    // (data-nav="sub") держит свою отметку и сюда не входит.
    const active = parentTab[name] || name;
    navButtons.forEach((b) => {
      if (b.dataset.nav !== 'primary') return;
      b.setAttribute('aria-current', b.dataset.goto === active ? 'page' : 'false');
    });

    if (push && location.hash.slice(1) !== name) {
      history.pushState({ view: name }, '', '#' + name);
    }
    window.scrollTo({ top: 0 });
  }

  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-goto]');
    if (!trigger) return;
    e.preventDefault();
    closeSheet();
    showView(trigger.dataset.goto);
  });

  window.addEventListener('popstate', () => {
    showView(location.hash.slice(1) || 'portfolios', { push: false });
  });

  /* ── Табы ─────────────────────────────────────────────────────────────── */

  // Кнопка с aria-controls показывает свою панель; без него — просто
  // отмечает выбор (фильтры и периоды на макетах ничего не пересчитывают).
  document.addEventListener('click', (e) => {
    const tab = e.target.closest('[role="tab"]');
    if (!tab) return;
    const list = tab.closest('[role="tablist"]');
    if (!list) return;

    const tabs = [...list.querySelectorAll('[role="tab"]')];
    tabs.forEach((t) => t.setAttribute('aria-selected', String(t === tab)));

    // Сначала прячем все панели группы, потом открываем нужную: две вкладки
    // могут вести на одну панель (например «Покупка» и «Продажа»).
    const shown = tab.getAttribute('aria-controls');
    tabs.forEach((t) => {
      const panel = document.getElementById(t.getAttribute('aria-controls') || '');
      if (panel) panel.hidden = true;
    });
    if (shown) {
      const panel = document.getElementById(shown);
      if (panel) panel.hidden = false;
    }
  });

  // Стрелки влево/вправо внутри группы табов — как ожидает клавиатурный пользователь.
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const tab = e.target.closest('[role="tab"]');
    if (!tab) return;
    const tabs = [...tab.closest('[role="tablist"]').querySelectorAll('[role="tab"]')];
    const next = tabs[(tabs.indexOf(tab) + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
    next.focus();
    next.click();
  });

  /* ── Шторка (снизу на мобильном, справа на десктопе) ───────────────────── */

  const scrim = document.querySelector('[data-scrim]');
  let openSheetEl = null;
  let lastFocused = null;

  function openSheet(id) {
    const sheet = document.getElementById(id);
    if (!sheet) return;
    lastFocused = document.activeElement;
    openSheetEl = sheet;
    sheet.hidden = false;
    if (scrim) scrim.hidden = false;
    // Принудительный пересчёт раскладки в закрытом положении: без него браузер
    // склеит смену hidden и класса в один кадр и анимации не будет. rAF здесь
    // не годится — в фоновой вкладке он не вызывается и шторка не открылась бы.
    void sheet.offsetHeight;
    document.body.classList.add('sheet-open');
    sheet.classList.add('is-open');
    const focusable = sheet.querySelector('button, [href], input, select, textarea');
    if (focusable) focusable.focus({ preventScroll: true });
  }

  function closeSheet() {
    if (!openSheetEl) return;
    const sheet = openSheetEl;
    openSheetEl = null;
    sheet.classList.remove('is-open');
    document.body.classList.remove('sheet-open');
    const done = () => {
      sheet.hidden = true;
      if (scrim) scrim.hidden = true;
    };
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) done();
    else setTimeout(done, 240);
    if (lastFocused) lastFocused.focus({ preventScroll: true });
  }

  document.addEventListener('click', (e) => {
    const opener = e.target.closest('[data-open-sheet]');
    if (opener) {
      e.preventDefault();
      openSheet(opener.dataset.openSheet);
      return;
    }
    if (e.target.closest('[data-close-sheet]') || e.target.closest('[data-scrim]')) {
      e.preventDefault();
      closeSheet();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSheet();
  });

  /* ── Пароль и код на странице входа ───────────────────────────────────── */

  document.querySelectorAll('[data-pw-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.dataset.pwToggle);
      if (!input) return;
      const shown = input.type === 'text';
      input.type = shown ? 'password' : 'text';
      btn.setAttribute('aria-label', shown ? 'Показать пароль' : 'Скрыть пароль');
      btn.querySelector('use').setAttribute('href', shown ? '/assets/icons.svg#eye' : '/assets/icons.svg#eye-off');
    });
  });

  const codeInputs = [...document.querySelectorAll('[data-code] input')];
  codeInputs.forEach((input, i) => {
    input.addEventListener('input', () => {
      input.value = input.value.replace(/\D/g, '').slice(-1);
      if (input.value && codeInputs[i + 1]) codeInputs[i + 1].focus();
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !input.value && codeInputs[i - 1]) codeInputs[i - 1].focus();
    });
  });

  // Шаги входа: форма -> код из письма.
  document.querySelectorAll('[data-step-to]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const target = btn.dataset.stepTo;
      document.querySelectorAll('[data-step]').forEach((s) => {
        s.hidden = s.dataset.step !== target;
      });
      const first = document.querySelector(`[data-step="${target}"] input, [data-step="${target}"] button`);
      if (first) first.focus();
    });
  });

  /* ── Старт ────────────────────────────────────────────────────────────── */

  if (views.length) {
    showView(location.hash.slice(1) || 'portfolios', { push: false });
  }
})();
