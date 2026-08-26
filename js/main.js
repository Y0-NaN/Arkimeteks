/**
 * main.js — Arkimeteks
 * General UI behaviors: sticky header class, scroll-spy nav, smooth scroll, animations.
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {

  /* -----------------------------------------------
     1. STICKY HEADER — add .scrolled class
  ----------------------------------------------- */
  const header = document.querySelector('.site-header');
  if (header) {
    const onScroll = () => {
      header.classList.toggle('scrolled', window.scrollY > 20);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // run once on load
  }

  /* -----------------------------------------------
     2. MOBILE NAV TOGGLE
  ----------------------------------------------- */
  const navToggle = document.getElementById('nav-toggle');
  const nav       = document.getElementById('main-nav');

  if (navToggle && nav) {
    navToggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      navToggle.setAttribute('aria-label', isOpen ? 'Cerrar menú' : 'Abrir menú');
    });

    // Close on nav link click
    nav.querySelectorAll('.nav__link').forEach(link => {
      link.addEventListener('click', () => {
        nav.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!header.contains(e.target)) {
        nav.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* -----------------------------------------------
     3. SCROLL SPY — active nav link
  ----------------------------------------------- */
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav__link[href^="#"]');

  if (sections.length && navLinks.length) {
    const observerOpts = { rootMargin: '-35% 0px -55% 0px' };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          navLinks.forEach(link => {
            const active = link.getAttribute('href') === `#${entry.target.id}`;
            link.classList.toggle('active', active);
          });
        }
      });
    }, observerOpts);

    sections.forEach(sec => observer.observe(sec));
  }

  /* -----------------------------------------------
     4. SMOOTH SCROLL for anchor links
     (Fallback for browsers that don't support CSS scroll-behavior)
  ----------------------------------------------- */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const headerH = header ? header.offsetHeight : 0;
        const top = target.getBoundingClientRect().top + window.scrollY - headerH - 16;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  /* -----------------------------------------------
     5. INTERSECTION OBSERVER — animate-in elements
  ----------------------------------------------- */
  const animEls = document.querySelectorAll('.animate-in');
  if (animEls.length) {
    const animObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const delay = el.dataset.delay || (i * 80);
          el.style.animationDelay = `${delay}ms`;
          el.classList.add('visible');
          animObserver.unobserve(el);
        }
      });
    }, { rootMargin: '0px 0px -60px 0px' });

    animEls.forEach(el => animObserver.observe(el));
  }

  /* -----------------------------------------------
     6. CURRENT YEAR in footer
  ----------------------------------------------- */
  const yearEl = document.getElementById('current-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

});
