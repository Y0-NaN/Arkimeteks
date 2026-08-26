/**
 * carousel.js — Arkimeteks
 * Accessible, keyboard-navigable carousel with autoplay and pause controls.
 */

'use strict';

class Carousel {
  /**
   * @param {HTMLElement} el - Root carousel element
   * @param {Object} options
   * @param {number} options.autoplayDelay - ms between slides (default 5000)
   * @param {boolean} options.autoplay - start autoplay on init (default true)
   */
  constructor(el, options = {}) {
    this.el = el;
    this.options = Object.assign({ autoplayDelay: 5500, autoplay: true }, options);

    // DOM refs
    this.track = el.querySelector('[data-carousel-track]');
    this.slides = Array.from(el.querySelectorAll('[data-carousel-slide]'));
    this.dotsWrap = el.querySelector('[data-carousel-dots]');
    this.btnPrev = el.querySelector('[data-carousel-prev]');
    this.btnNext = el.querySelector('[data-carousel-next]');
    this.btnPause = el.querySelector('[data-carousel-pause]');
    this.liveRegion = el.querySelector('[data-carousel-live]');
    this.progressBar = el.querySelector('[data-carousel-progress]');

    this.current = 0;
    this.total = this.slides.length;
    this.autoplayId = null;
    this.isPlaying = false;
    this.startTime = null;
    this.rafId = null;

    if (!this.slides.length) return;

    this._buildDots();
    this._bindEvents();
    this._goTo(0, false);

    if (this.options.autoplay) this.startAutoplay();
  }

  /** Build dot indicators dynamically */
  _buildDots() {
    if (!this.dotsWrap) return;
    this.dotsWrap.innerHTML = '';
    this.dots = this.slides.map((_, i) => {
      const btn = document.createElement('button');
      btn.className = 'carousel__dot';
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-label', `Ir al slide ${i + 1}: ${this.slides[i].dataset.slideTitle || ''}`);
      btn.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
      btn.addEventListener('click', () => this._goTo(i));
      this.dotsWrap.appendChild(btn);
      return btn;
    });
  }

  /** Bind all event listeners */
  _bindEvents() {
    // Prev / Next buttons
    this.btnPrev?.addEventListener('click', () => { this._userInteracted(); this.prev(); });
    this.btnNext?.addEventListener('click', () => { this._userInteracted(); this.next(); });

    // Pause/Play button
    this.btnPause?.addEventListener('click', () => this.toggleAutoplay());

    // Keyboard navigation (on track or carousel root)
    this.el.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { this._userInteracted(); this.prev(); }
      if (e.key === 'ArrowRight') { this._userInteracted(); this.next(); }
      if (e.key === ' ') { e.preventDefault(); this.toggleAutoplay(); }
    });

    // Pause on hover/focus
    this.el.addEventListener('mouseenter', () => this._pauseTemporary());
    this.el.addEventListener('mouseleave', () => this._resumeTemporary());
    this.el.addEventListener('focusin', () => this._pauseTemporary());
    this.el.addEventListener('focusout', (e) => {
      if (!this.el.contains(e.relatedTarget)) this._resumeTemporary();
    });

    // Touch / swipe
    let touchStartX = 0;
    this.el.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
    this.el.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > 40) { this._userInteracted(); dx < 0 ? this.next() : this.prev(); }
    }, { passive: true });
  }

  /** Activate a slide by index */
  _goTo(index, animate = true) {
    const prev = this.slides[this.current];
    const next = this.slides[index];

    if (animate) {
      prev?.classList.add('is-prev');
      setTimeout(() => prev?.classList.remove('is-active', 'is-prev'), 700);
    } else {
      prev?.classList.remove('is-active', 'is-prev');
    }

    next.classList.add('is-active');
    this.current = index;

    // Update dots
    this.dots?.forEach((dot, i) => {
      const active = i === index;
      dot.classList.toggle('is-active', active);
      dot.setAttribute('aria-selected', active ? 'true' : 'false');
    });

    // Announce to screen readers
    if (this.liveRegion) {
      this.liveRegion.textContent = `Slide ${index + 1} de ${this.total}: ${next.dataset.slideTitle || ''}`;
    }

    // Reset progress bar
    this._resetProgress();
  }

  /** Go to next slide */
  next() {
    this._goTo((this.current + 1) % this.total);
  }

  /** Go to previous slide */
  prev() {
    this._goTo((this.current - 1 + this.total) % this.total);
  }

  /** Start autoplay with progress bar */
  startAutoplay() {
    this.isPlaying = true;
    this._updatePauseBtn();
    this._startProgressRAF();
  }

  /** Stop autoplay */
  stopAutoplay() {
    this.isPlaying = false;
    clearTimeout(this.autoplayId);
    cancelAnimationFrame(this.rafId);
    this._resetProgress();
    this._updatePauseBtn();
  }

  /** Toggle autoplay on/off */
  toggleAutoplay() {
    this.isPlaying ? this.stopAutoplay() : this.startAutoplay();
  }

  _pauseTemporary() {
    if (this.isPlaying) {
      cancelAnimationFrame(this.rafId);
      clearTimeout(this.autoplayId);
      this._hovered = true;
    }
  }

  _resumeTemporary() {
    if (this.isPlaying && this._hovered) {
      this._hovered = false;
      this._resetProgress();
      this._startProgressRAF();
    }
  }

  _userInteracted() {
    // After manual navigation, restart the autoplay timer
    if (this.isPlaying) {
      cancelAnimationFrame(this.rafId);
      clearTimeout(this.autoplayId);
      this._startProgressRAF();
    }
  }

  _startProgressRAF() {
    this.startTime = performance.now();
    const delay = this.options.autoplayDelay;

    const tick = (now) => {
      const elapsed = now - this.startTime;
      const progress = Math.min(elapsed / delay, 1);

      if (this.progressBar) {
        this.progressBar.style.width = `${progress * 100}%`;
        this.progressBar.style.transitionDuration = '0ms';
      }

      if (progress >= 1) {
        this.next();
        return;
      }
      this.rafId = requestAnimationFrame(tick);
    };

    this.rafId = requestAnimationFrame(tick);
  }

  _resetProgress() {
    if (this.progressBar) {
      this.progressBar.style.width = '0%';
    }
    cancelAnimationFrame(this.rafId);
    clearTimeout(this.autoplayId);
  }

  _updatePauseBtn() {
    if (!this.btnPause) return;
    this.btnPause.textContent = this.isPlaying ? '⏸ Pausar' : '▶ Reproducir';
    this.btnPause.setAttribute('aria-label', this.isPlaying ? 'Pausar reproducción automática' : 'Iniciar reproducción automática');
    this.btnPause.setAttribute('aria-pressed', this.isPlaying ? 'false' : 'true');
  }
}

// Auto-init on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  const carouselEl = document.getElementById('main-carousel');
  if (carouselEl) {
    window._carousel = new Carousel(carouselEl, { autoplayDelay: 5500, autoplay: true });
  }
});
