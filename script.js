(function () {
  const data = window.PORTFOLIO_CONTENT;
  let lang = localStorage.getItem("portfolio_lang") || "zh";
  let activeFilter = "all";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  function t(path) {
    return path.split(".").reduce((value, key) => value && value[key], data[lang]);
  }

  function normalize(value) {
    return String(value).toLowerCase().replace(/\s+/g, "-");
  }

  function alphaColor(hex, alpha) {
    const safe = hex.replace("#", "");
    const bigint = parseInt(safe, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function applyContent() {
    document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
    document.title = `${data.profile.brand} - Portfolio`;
    $(".brand-mark").textContent = data.profile.brand;
    $("[data-email-link]").textContent = data.profile.email;
    $("[data-email-link]").href = `mailto:${data.profile.email}`;
    $("[data-contact-email]").textContent = data.profile.email;
    $("[data-contact-wechat]").textContent = data[lang].contact.wechatCta || data.profile.wechat;
    const wechatState = $("[data-copy-state=\"wechat\"]");
    if (wechatState) {
      wechatState.textContent = data[lang].contact.wechatHint || " ";
    }
    const qrImage = $("[data-qr-image]");
    if (qrImage && data.profile.wechatQr) {
      qrImage.src = data.profile.wechatQr;
    }
    $("[data-resume-link]").href = data.profile.resumeUrl;

    $$("[data-i18n]").forEach((node) => {
      const value = t(node.dataset.i18n);
      if (value === undefined) return;
      if (String(value).includes("<br")) {
        node.innerHTML = value;
      } else {
        node.textContent = value;
      }
    });

    $$("[data-lang-toggle], [data-lang-toggle-mobile]").forEach((button) => {
      button.textContent = lang === "zh" ? "EN" : "中文";
    });

    const aboutCopy = $("[data-about-copy]");
    aboutCopy.innerHTML = data[lang].about.bio.map((item) => `<p>${item}</p>`).join("");

    renderDirections();
    renderSkills();
    renderFilters();
    renderProjects();
    resetTypewriter();
  }

  function renderDirections() {
    const wrap = $("[data-direction-tags]");
    wrap.innerHTML = data[lang].about.directions
      .map(
        (item, index) => `
          <div class="direction-row">
            <span class="tag-chip" style="--chip-color: ${["#D4AF37", "#818CF8", "#FCD34D"][index % 3]}">${item.tag}</span>
            <span>${item.label}</span>
          </div>
        `
      )
      .join("");
  }

  function renderSkills() {
    const wrap = $("[data-skill-layout]");
    wrap.innerHTML = data[lang].skills.groups
      .map(
        (group) => `
          <div class="skill-group reveal">
            <h3>${group.title}</h3>
            <div class="chip-list">
              ${group.items.map((item) => `<span class="skill-chip">${item}</span>`).join("")}
            </div>
          </div>
        `
      )
      .join("");
    observeReveals();
  }

  function renderFilters() {
    const wrap = $("[data-filter-row]");
    const filters = data[lang].work.filters;
    const currentValues = filters.map((filter) => ({
      label: filter,
      value: filter === "全部" || filter === "All" ? "all" : normalize(filter)
    }));

    if (!currentValues.some((item) => item.value === activeFilter)) {
      activeFilter = "all";
    }

    wrap.innerHTML = currentValues
      .map(
        (filter) => `
          <button class="filter-button ${filter.value === activeFilter ? "is-active" : ""}" type="button" data-filter="${filter.value}">
            ${filter.label}
          </button>
        `
      )
      .join("");

    $$("[data-filter]").forEach((button) => {
      button.addEventListener("click", () => {
        activeFilter = button.dataset.filter;
        renderFilters();
        renderProjects();
      });
    });
  }

  function renderProjects() {
    const grid = $("[data-project-grid]");
    const projects = data.projects.filter((project) => {
      if (activeFilter === "all") return true;
      const tags = lang === "zh" ? project.tagsZh : project.tagsEn;
      return tags.map(normalize).includes(activeFilter);
    });

    grid.innerHTML = projects
      .map((project, cardIndex) => {
        const title = lang === "zh" ? project.titleZh : project.titleEn;
        const desc = lang === "zh" ? project.descZh : project.descEn;
        const tags = lang === "zh" ? project.tagsZh : project.tagsEn;
        const tagName = project.href ? "a" : "article";
        const linkAttrs = project.href ? `href="${project.href}" aria-label="${title}"` : "";
        const visualMarkup = project.visualKind === "metronome"
          ? `
              <div class="project-metronome" aria-hidden="true">
                <div class="beat-ring">
                  <strong>128</strong>
                  <span>BPM</span>
                </div>
                <div class="beat-arm"></div>
                <div class="beat-rails">
                  <i></i>
                  <i></i>
                  <i></i>
                </div>
              </div>
            `
          : "";
        return `
          <${tagName} class="project-card" ${linkAttrs} style="
            --accent-alpha: ${alphaColor(project.accent, 0.14)};
            --accent-grid: ${alphaColor(project.accent, 0.11)};
            --accent-faint: ${alphaColor(project.accent, 0.18)};
            transition-delay: ${cardIndex * 80}ms;
          ">
            <div class="project-visual">
              ${visualMarkup}
              <span class="project-index">${project.index}</span>
              <p class="project-desc">${desc}</p>
            </div>
            <div class="project-title-row">
              <h3>${title}</h3>
              <span>${project.year}</span>
            </div>
            <div class="project-tags">
              ${tags.map((tag) => `<span class="tag-chip" style="--chip-color: ${project.accent}">${tag}</span>`).join("")}
            </div>
            <p class="project-role">${project.role}</p>
          </${tagName}>
        `;
      })
      .join("");

    requestAnimationFrame(() => {
      $$(".project-card").forEach((card) => card.classList.add("is-visible"));
    });
  }

  let typeTimer = null;
  let phraseIndex = 0;
  let typed = "";
  let deleting = false;

  function resetTypewriter() {
    clearTimeout(typeTimer);
    phraseIndex = 0;
    typed = "";
    deleting = false;
    typeLoop();
  }

  function typeLoop() {
    const target = $("[data-typewriter]");
    const phrases = data[lang].hero.roles;
    const phrase = phrases[phraseIndex] || "";

    if (!deleting && typed.length < phrase.length) {
      typed = phrase.slice(0, typed.length + 1);
      typeTimer = setTimeout(typeLoop, 62);
    } else if (!deleting && typed.length === phrase.length) {
      typeTimer = setTimeout(() => {
        deleting = true;
        typeLoop();
      }, 1600);
    } else if (deleting && typed.length > 0) {
      typed = typed.slice(0, -1);
      typeTimer = setTimeout(typeLoop, 36);
    } else {
      deleting = false;
      phraseIndex = (phraseIndex + 1) % phrases.length;
      typeTimer = setTimeout(typeLoop, 240);
    }

    target.textContent = typed;
  }

  function initNavigation() {
    const header = $("[data-header]");
    const menu = $("[data-mobile-menu]");
    const toggle = $("[data-menu-toggle]");

    window.addEventListener(
      "scroll",
      () => {
        header.classList.toggle("is-scrolled", window.scrollY > 38);
      },
      { passive: true }
    );

    function closeMenu() {
      menu.classList.remove("is-open");
      toggle.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    }

    toggle.addEventListener("click", () => {
      const open = !menu.classList.contains("is-open");
      menu.classList.toggle("is-open", open);
      toggle.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
    });

    $$("[data-goto]").forEach((button) => {
      button.addEventListener("click", () => {
        closeMenu();
        $(button.dataset.goto)?.scrollIntoView({ behavior: "smooth" });
      });
    });

    $("[data-scroll]").addEventListener("click", (event) => {
      event.preventDefault();
      closeMenu();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  function initLanguage() {
    $$("[data-lang-toggle], [data-lang-toggle-mobile]").forEach((button) => {
      button.addEventListener("click", () => {
        lang = lang === "zh" ? "en" : "zh";
        localStorage.setItem("portfolio_lang", lang);
        applyContent();
      });
    });
  }

  let lastFocusedBeforeQr = null;
  let qrCloseTimer = null;

  function openQrModal() {
    const modal = $("[data-qr-modal]");
    if (!modal) return;

    clearTimeout(qrCloseTimer);
    lastFocusedBeforeQr = document.activeElement;
    modal.hidden = false;
    document.body.classList.add("modal-open");

    requestAnimationFrame(() => {
      modal.classList.add("is-open");
      $(".qr-close", modal)?.focus();
    });
  }

  function closeQrModal() {
    const modal = $("[data-qr-modal]");
    if (!modal || modal.hidden) return;

    modal.classList.remove("is-open");
    document.body.classList.remove("modal-open");
    qrCloseTimer = window.setTimeout(() => {
      modal.hidden = true;
    }, 180);

    if (lastFocusedBeforeQr && typeof lastFocusedBeforeQr.focus === "function") {
      lastFocusedBeforeQr.focus();
    }
  }

  function initQrModal() {
    $$("[data-qr-close]").forEach((button) => {
      button.addEventListener("click", closeQrModal);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeQrModal();
      }
    });
  }

  function initCopy() {
    $$("[data-copy]").forEach((button) => {
      button.addEventListener("click", async () => {
        const kind = button.dataset.copy;
        if (kind === "wechat") {
          openQrModal();
          return;
        }

        const value = kind === "email" ? data.profile.email : data.profile.wechat;
        const state = $(`[data-copy-state="${kind}"]`);
        try {
          await navigator.clipboard.writeText(value);
          state.textContent = data[lang].contact.copied;
          setTimeout(() => {
            state.textContent = " ";
          }, 1600);
        } catch {
          state.textContent = value;
        }
      });
    });
  }

  let revealObserver = null;

  function observeReveals() {
    if (!revealObserver) {
      revealObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              revealObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.16, rootMargin: "0px 0px -60px 0px" }
      );
    }

    $$(".reveal:not(.is-visible)").forEach((node) => revealObserver.observe(node));
  }

  function initCanvas() {
    const canvas = $("[data-hero-canvas]");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const pointer = { x: 0.68, y: 0.35 };
    let width = 0;
    let height = 0;
    let dpr = 1;
    let points = [];
    let frame = 0;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      points = Array.from({ length: Math.max(42, Math.floor(width / 22)) }, (_, index) => ({
        x: (index * 97) % Math.max(width, 1),
        y: (index * 57) % Math.max(height, 1),
        vx: (Math.sin(index * 3.7) * 0.28),
        vy: (Math.cos(index * 2.4) * 0.2),
        r: 0.8 + ((index * 13) % 18) / 18
      }));
    }

    function draw() {
      frame += 0.006;
      ctx.clearRect(0, 0, width, height);

      const gradient = ctx.createRadialGradient(width * pointer.x, height * pointer.y, 0, width * pointer.x, height * pointer.y, Math.max(width, height) * 0.75);
      gradient.addColorStop(0, "rgba(212, 175, 55, 0.18)");
      gradient.addColorStop(0.38, "rgba(129, 140, 248, 0.075)");
      gradient.addColorStop(1, "rgba(5, 5, 5, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      points.forEach((point, index) => {
        point.x += point.vx + Math.sin(frame + index) * 0.05;
        point.y += point.vy + Math.cos(frame + index * 0.4) * 0.04;

        if (point.x < -20) point.x = width + 20;
        if (point.x > width + 20) point.x = -20;
        if (point.y < -20) point.y = height + 20;
        if (point.y > height + 20) point.y = -20;

        ctx.beginPath();
        ctx.fillStyle = index % 3 === 0 ? "rgba(212, 175, 55, 0.54)" : "rgba(245, 245, 245, 0.16)";
        ctx.arc(point.x, point.y, point.r, 0, Math.PI * 2);
        ctx.fill();
      });

      for (let i = 0; i < points.length; i += 1) {
        for (let j = i + 1; j < points.length; j += 1) {
          const a = points[i];
          const b = points[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 132) {
            ctx.strokeStyle = `rgba(212, 175, 55, ${(1 - dist / 132) * 0.16})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(draw);
    }

    window.addEventListener("resize", resize);
    window.addEventListener(
      "pointermove",
      (event) => {
        pointer.x = event.clientX / Math.max(window.innerWidth, 1);
        pointer.y = event.clientY / Math.max(window.innerHeight, 1);
      },
      { passive: true }
    );

    resize();
    draw();
  }

  function initDigitalPortrait() {
    const canvas = $("[data-digital-canvas]");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let width = 0;
    let height = 0;
    let dpr = 1;
    let frame = 0;
    let streams = [];
    let rails = [];

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      streams = Array.from({ length: Math.max(26, Math.floor(width / 24)) }, (_, index) => ({
        x: width * (0.12 + ((index * 0.071) % 0.84)),
        y: height * ((index * 0.173) % 1),
        speed: 0.45 + ((index * 17) % 90) / 100,
        length: 6 + (index % 9),
        alpha: 0.22 + (index % 5) * 0.07,
        size: 10 + (index % 4) * 2,
        hue: index % 3
      }));

      rails = Array.from({ length: 12 }, (_, index) => {
        const y = height * (0.18 + index * 0.052);
        const start = width * (0.18 + (index % 3) * 0.08);
        return {
          points: [
            [start, y],
            [start + width * (0.16 + (index % 2) * 0.05), y + (index % 2 ? 18 : -12)],
            [start + width * 0.42, y + (index % 4) * 10],
            [start + width * 0.68, y - 18 + (index % 3) * 8]
          ],
          color: index % 3 === 0 ? "rgba(212,175,55,0.68)" : index % 3 === 1 ? "rgba(83,163,218,0.58)" : "rgba(255,255,255,0.34)",
          width: index % 4 === 0 ? 2.6 : 1.2,
          speed: 0.8 + index * 0.08
        };
      });
    }

    function drawPolyline(points, color, lineWidth, dashOffset) {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;
      ctx.setLineDash([28, 14, 8, 18]);
      ctx.lineDashOffset = -dashOffset;
      ctx.beginPath();
      points.forEach(([x, y], index) => {
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.restore();
    }

    function draw() {
      frame += 1;
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = "screen";

      const halo = ctx.createRadialGradient(width * 0.54, height * 0.32, 10, width * 0.56, height * 0.38, width * 0.54);
      halo.addColorStop(0, "rgba(212, 175, 55, 0.18)");
      halo.addColorStop(0.32, "rgba(84, 166, 224, 0.12)");
      halo.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, width, height);

      rails.forEach((rail, index) => {
        drawPolyline(rail.points, rail.color, rail.width, frame * rail.speed + index * 17);
      });

      const scanY = (height * ((frame * 0.0038) % 1));
      const scan = ctx.createLinearGradient(0, scanY - 42, 0, scanY + 42);
      scan.addColorStop(0, "rgba(0,0,0,0)");
      scan.addColorStop(0.48, "rgba(212,175,55,0.24)");
      scan.addColorStop(0.52, "rgba(98,180,230,0.18)");
      scan.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = scan;
      ctx.fillRect(0, scanY - 42, width, 84);

      streams.forEach((stream, index) => {
        const color = stream.hue === 0 ? "212, 175, 55" : stream.hue === 1 ? "90, 172, 226" : "238, 235, 214";
        const step = stream.size * 1.32;
        const head = (stream.y + frame * stream.speed) % (height + stream.length * step);
        ctx.font = `${stream.size}px IBM Plex Mono, Consolas, monospace`;
        ctx.textAlign = "center";

        for (let i = 0; i < stream.length; i += 1) {
          const y = head - i * step;
          if (y < -20 || y > height + 20) continue;
          const fade = 1 - i / stream.length;
          const value = index % 4 === 0
            ? String((frame + index * 91 + i * 17) % 10)
            : `${((index * 37 + frame + i * 11) % 99).toString().padStart(2, "0")}`;
          ctx.fillStyle = `rgba(${color}, ${stream.alpha * fade})`;
          ctx.shadowColor = `rgba(${color}, ${0.34 * fade})`;
          ctx.shadowBlur = 8;
          ctx.fillText(value, stream.x + Math.sin(frame * 0.02 + index) * 7, y);
        }
      });

      ctx.shadowBlur = 0;
      ctx.strokeStyle = "rgba(212,175,55,0.42)";
      ctx.lineWidth = 1;
      for (let i = 0; i < 8; i += 1) {
        const x = width * (0.16 + i * 0.096);
        const y = height * (0.68 + Math.sin(frame * 0.015 + i) * 0.035);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 34, y);
        ctx.lineTo(x + 46, y + 10);
        ctx.lineTo(x + 116, y + 10);
        ctx.stroke();
        ctx.fillStyle = "rgba(212,175,55,0.38)";
        ctx.fillRect(x + 116, y + 7, 4, 4);
      }

      if (frame % 90 < 8) {
        ctx.fillStyle = "rgba(96, 180, 235, 0.12)";
        const glitchY = height * (0.24 + ((frame % 90) / 90) * 0.52);
        ctx.fillRect(width * 0.14, glitchY, width * 0.72, 2);
        ctx.fillStyle = "rgba(212, 175, 55, 0.16)";
        ctx.fillRect(width * 0.22, glitchY + 16, width * 0.38, 1);
      }

      ctx.globalCompositeOperation = "source-over";
      requestAnimationFrame(draw);
    }

    window.addEventListener("resize", resize);
    resize();
    draw();
  }

  document.addEventListener("DOMContentLoaded", () => {
    initNavigation();
    initLanguage();
    initQrModal();
    initCopy();
    initCanvas();
    applyContent();
    observeReveals();
  });
})();
