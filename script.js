/* Stefan Paronikyan — Portfolio
   - top bar shadow on scroll
   - left rail show/hide + active state via IntersectionObserver
   - reveal-on-scroll
   - mobile menu toggle
*/

(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  // ---------- year ----------
  const yr = $("#yr");
  if (yr) yr.textContent = new Date().getFullYear();

  // ---------- topbar shadow ----------
  const topbar = $(".topbar");
  const onScroll = () => {
    if (window.scrollY > 8) topbar.classList.add("scrolled");
    else topbar.classList.remove("scrolled");
  };
  document.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // ---------- mobile menu ----------
  const menuBtn = $(".menu-btn");
  const topnav = $(".topnav");
  if (menuBtn && topnav) {
    menuBtn.addEventListener("click", () => {
      const open = topnav.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", String(open));
    });
    topnav.addEventListener("click", (e) => {
      if (e.target.tagName === "A") {
        topnav.classList.remove("open");
        menuBtn.setAttribute("aria-expanded", "false");
      }
    });
  }

  // ---------- left rail visibility ----------
  const rail = $(".rail");
  const work = $("#work");
  const contact = $("#contact");
  const updateRail = () => {
    if (!rail || !work || !contact) return;
    const wTop = work.getBoundingClientRect().top;
    const cTop = contact.getBoundingClientRect().top;
    const vh = window.innerHeight;
    // visible when #work has scrolled at least halfway up, hidden once #contact reaches mid-viewport
    const show = wTop < vh * 0.5 && cTop > vh * 0.4;
    rail.classList.toggle("visible", show);
  };
  document.addEventListener("scroll", updateRail, { passive: true });
  window.addEventListener("resize", updateRail);
  updateRail();

  // ---------- active project in rail ----------
  const railLinks = $$(".rail a");
  const railById = new Map(railLinks.map((a) => [a.getAttribute("href").slice(1), a.parentElement]));
  const projects = $$(".project");

  const setActive = (id) => {
    railById.forEach((li) => li.classList.remove("active"));
    const li = railById.get(id);
    if (li) li.classList.add("active");
  };

  if (projects.length) {
    const projObs = new IntersectionObserver(
      (entries) => {
        // pick the entry closest to the top that's currently intersecting
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length) setActive(visible[0].target.id);
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: 0 }
    );
    projects.forEach((p) => projObs.observe(p));
  }

  // ---------- mark elements for reveal ----------
  // automatic: every project body section + gallery + section-head
  $$(
    ".section-head, .proj-head, .proj-body, .gallery, .image-wide, .about-body, .contact-list, .index-list li"
  ).forEach((el) => el.setAttribute("data-reveal", ""));

  const revealObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          revealObs.unobserve(e.target);
        }
      });
    },
    { threshold: 0.08, rootMargin: "0px 0px -8% 0px" }
  );

  const revealAllInViewport = () => {
    const vh = window.innerHeight;
    $$("[data-reveal]").forEach((el) => {
      if (el.classList.contains("in")) return;
      const r = el.getBoundingClientRect();
      // mark anything that has any pixel above the bottom of the viewport
      // (covers both already-visible AND already-passed elements when deep-linking)
      if (r.top < vh) {
        el.classList.add("in");
        revealObs.unobserve(el);
      } else {
        revealObs.observe(el);
      }
    });
  };

  revealAllInViewport();
  // re-run on hash navigation in case anchor jumps past unrevealed sections
  window.addEventListener("hashchange", () => requestAnimationFrame(revealAllInViewport));
  // safety net: any element scrolled past should be considered revealed
  document.addEventListener("scroll", () => {
    if (revealAllInViewport.raf) return;
    revealAllInViewport.raf = requestAnimationFrame(() => {
      revealAllInViewport();
      revealAllInViewport.raf = 0;
    });
  }, { passive: true });

  // ---------- subtle parallax on hero ----------
  const heroImg = $(".hero-img img");
  if (heroImg && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    let raf = 0;
    document.addEventListener("scroll", () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const y = Math.min(window.scrollY, 800);
        heroImg.style.transform = `scale(1.04) translate3d(0, ${y * 0.05}px, 0)`;
        raf = 0;
      });
    }, { passive: true });
  }

  // ---------- scroll progress ----------
  const progressBar = $(".progress > span");
  if (progressBar) {
    const updateProgress = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
      progressBar.style.width = pct + "%";
    };
    document.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
    updateProgress();
  }

  // ---------- back to top ----------
  const toTop = $(".to-top");
  if (toTop) {
    toTop.hidden = false;
    const updateTop = () => {
      toTop.classList.toggle("visible", window.scrollY > window.innerHeight * 0.6);
    };
    document.addEventListener("scroll", updateTop, { passive: true });
    updateTop();
    toTop.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // ---------- email copy ----------
  const emailLink = document.querySelector('a[href^="mailto:"]');
  if (emailLink && navigator.clipboard) {
    const showToast = (msg) => {
      let t = $(".toast");
      if (!t) {
        t = document.createElement("div");
        t.className = "toast";
        t.setAttribute("role", "status");
        document.body.appendChild(t);
      }
      t.textContent = msg;
      requestAnimationFrame(() => t.classList.add("visible"));
      clearTimeout(showToast._t);
      showToast._t = setTimeout(() => t.classList.remove("visible"), 1800);
    };
    emailLink.addEventListener("click", (e) => {
      const addr = emailLink.getAttribute("href").replace("mailto:", "");
      // Don't block the mailto, but copy in parallel for convenience
      navigator.clipboard.writeText(addr).then(
        () => showToast("Email copied · " + addr),
        () => {}
      );
    });
  }

  // ---------- lightbox ----------
  const lightbox = $(".lightbox");
  if (lightbox) {
    const lbImg = lightbox.querySelector(".lb-stage img");
    const lbCap = lightbox.querySelector(".lb-stage figcaption");
    const lbClose = lightbox.querySelector(".lb-close");
    const lbPrev = lightbox.querySelector(".lb-prev");
    const lbNext = lightbox.querySelector(".lb-next");
    const lbCount = lightbox.querySelector(".lb-counter");

    // Collect every gallery / project / hero figure image (skip rail/icons)
    const figures = $$(
      ".hero-img, .col-image figure, .col-image, .gallery figure, .image-wide figure"
    ).filter((el) => el.querySelector && el.querySelector("img"));

    // Normalize: store {img, caption}
    const items = figures.map((wrapper) => {
      const img = wrapper.tagName === "FIGURE" ? wrapper.querySelector("img") : (wrapper.querySelector("figure img") || wrapper.querySelector("img"));
      const cap = wrapper.querySelector("figcaption");
      return {
        wrapper,
        img,
        src: img.getAttribute("src"),
        alt: img.getAttribute("alt") || "",
        caption: cap ? cap.textContent.trim() : (img.getAttribute("alt") || ""),
      };
    });

    // Mark zoomable
    items.forEach((it, i) => {
      it.wrapper.classList.add("figure-zoom");
      it.img.style.cursor = "zoom-in";
      it.img.setAttribute("tabindex", "0");
      it.img.setAttribute("role", "button");
      it.img.setAttribute("aria-label", "Open image · " + (it.caption || it.alt));
      const open = (e) => {
        e.preventDefault();
        openLightbox(i);
      };
      it.img.addEventListener("click", open);
      it.img.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") open(e);
      });
    });

    let current = 0;
    let lastFocus = null;

    const render = () => {
      const it = items[current];
      lbImg.src = it.src;
      lbImg.alt = it.alt;
      lbCap.textContent = it.caption;
      lbCount.textContent = (current + 1) + " / " + items.length;
    };

    const openLightbox = (i) => {
      current = i;
      lastFocus = document.activeElement;
      lightbox.hidden = false;
      // Force reflow so the opacity transition runs from 0
      void lightbox.offsetHeight;
      lightbox.classList.add("open");
      render();
      document.body.style.overflow = "hidden";
      lbClose.focus();
    };

    const closeLightbox = () => {
      lightbox.classList.remove("open");
      document.body.style.overflow = "";
      setTimeout(() => { lightbox.hidden = true; }, 240);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    };

    const step = (d) => {
      current = (current + d + items.length) % items.length;
      render();
    };

    lbClose.addEventListener("click", closeLightbox);
    lbPrev.addEventListener("click", () => step(-1));
    lbNext.addEventListener("click", () => step(1));
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) closeLightbox();
    });

    document.addEventListener("keydown", (e) => {
      if (lightbox.hidden) return;
      if (e.key === "Escape") closeLightbox();
      else if (e.key === "ArrowLeft") step(-1);
      else if (e.key === "ArrowRight") step(1);
    });

    // Hide nav buttons when there's only one image (defensive)
    if (items.length <= 1) {
      lbPrev.style.display = "none";
      lbNext.style.display = "none";
    }
  }

  // ---------- custom cursor ----------
  const cursor = $(".cursor");
  const isFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (cursor && isFinePointer && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.body.classList.add("cursor-on");
    const dot = cursor.querySelector(".cursor-dot");
    const ring = cursor.querySelector(".cursor-ring");
    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let dx = mx, dy = my, rx = mx, ry = my;
    let raf = 0;

    const tick = () => {
      // dot tracks immediately-ish, ring trails for smoothness
      dx += (mx - dx) * 0.55;
      dy += (my - dy) * 0.55;
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      dot.style.transform = `translate(${dx}px, ${dy}px) translate(-50%, -50%)`;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      raf = requestAnimationFrame(tick);
    };
    document.addEventListener("mousemove", (e) => {
      mx = e.clientX; my = e.clientY;
      if (!raf) raf = requestAnimationFrame(tick);
    }, { passive: true });

    // Hover state on interactive elements
    const hoverSel = "a, button, .figure-zoom img, [role='button'], .menu-btn, input, label";
    document.addEventListener("mouseover", (e) => {
      const t = e.target;
      if (!(t instanceof Element)) return;
      const interactive = t.closest(hoverSel);
      if (!interactive) {
        document.body.classList.remove("cursor-hover", "cursor-zoom");
        return;
      }
      document.body.classList.add("cursor-hover");
      const isImg = !!t.closest(".figure-zoom");
      document.body.classList.toggle("cursor-zoom", isImg);
    });
    document.addEventListener("mouseleave", () => {
      document.body.classList.remove("cursor-hover", "cursor-zoom");
    });
    document.addEventListener("mouseout", (e) => {
      if (!e.relatedTarget) {
        document.body.classList.remove("cursor-hover", "cursor-zoom");
      }
    });
    tick();
  }

  // ---------- brand-mark easter egg → confetti ----------
  const brandMark = $(".brand-mark");
  if (brandMark) {
    let count = 0;
    let resetT = 0;
    const COLORS = [
      "#8a3a1f", "#b8643d", "#2c5f5d", "#5b7a3f",
      "#4a5b6e", "#c46a3a", "#6b5840", "#14110f",
    ];
    const SHAPES = ["sq", "ci", "tr"];
    const burst = () => {
      let layer = $(".confetti");
      if (!layer) {
        layer = document.createElement("div");
        layer.className = "confetti";
        document.body.appendChild(layer);
      }
      const N = 60;
      for (let i = 0; i < N; i++) {
        const bit = document.createElement("span");
        bit.className = "confetti-bit " + SHAPES[Math.floor(Math.random() * SHAPES.length)];
        const left = Math.random() * 100;
        const x = (Math.random() * 320 - 160) + "px";
        const r = (Math.random() * 1080 - 540) + "deg";
        const d = (2.4 + Math.random() * 2.4) + "s";
        const c = COLORS[Math.floor(Math.random() * COLORS.length)];
        bit.style.left = left + "vw";
        bit.style.setProperty("--x", x);
        bit.style.setProperty("--r", r);
        bit.style.setProperty("--d", d);
        bit.style.setProperty("--c", c);
        bit.style.animationDelay = (Math.random() * 0.6) + "s";
        layer.appendChild(bit);
        setTimeout(() => bit.remove(), 5500);
      }
    };
    brandMark.addEventListener("click", (e) => {
      // Don't block the anchor scroll-to-top, but track the streak
      count += 1;
      clearTimeout(resetT);
      resetT = setTimeout(() => { count = 0; }, 1800);
      if (count >= 3) {
        burst();
        count = 0;
      }
    });
  }
})();
