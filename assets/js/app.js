/* =====================================================================
   FLORA & FAUNE – App-Logik
   Rendering, Filter, Warenkorb (localStorage), Drawer, UI-Helfer
   ===================================================================== */
(function () {
  "use strict";

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const euro = (n) => n.toLocaleString("de-DE", { style: "currency", currency: "EUR" });
  const catLabel = (id) => (CATEGORIES.find((c) => c.id === id) || {}).label || id;

  const STORAGE_KEY = "ff_cart_v1";
  const FAV_KEY = "ff_favs_v1";

  let activeCat = "alle";
  let cart = loadJSON(STORAGE_KEY, {});      // { productId: qty }
  let favs = new Set(loadJSON(FAV_KEY, []));

  /* ---------- Persistenz ---------- */
  function loadJSON(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  }
  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    localStorage.setItem(FAV_KEY, JSON.stringify([...favs]));
  }
  const product = (id) => PRODUCTS.find((p) => p.id === id);

  /* ---------- Filter rendern ---------- */
  function renderFilters() {
    const wrap = $("#filters");
    wrap.innerHTML = "";
    CATEGORIES.forEach((c) => {
      const btn = document.createElement("button");
      btn.className = "filter" + (c.id === activeCat ? " is-active" : "");
      btn.textContent = c.label;
      btn.setAttribute("role", "tab");
      btn.setAttribute("aria-selected", c.id === activeCat);
      btn.addEventListener("click", () => setCategory(c.id));
      wrap.appendChild(btn);
    });
  }

  function setCategory(id) {
    activeCat = id;
    renderFilters();
    renderGrid();
  }

  /* ---------- Produktgitter ---------- */
  function renderGrid() {
    const grid = $("#productGrid");
    const empty = $("#gridEmpty");
    const items = PRODUCTS.filter((p) => activeCat === "alle" || p.category === activeCat);

    grid.innerHTML = "";
    empty.hidden = items.length > 0;

    items.forEach((p, i) => grid.appendChild(buildCard(p, i)));
    observeReveals();
  }

  function buildCard(p, index) {
    const card = document.createElement("article");
    card.className = "card reveal";

    const media = document.createElement("div");
    media.className = "card__media";
    media.dataset.label = p.name;

    const img = document.createElement("img");
    img.className = "card__img";
    img.src = p.img;
    img.alt = `${p.name} – ${catLabel(p.category)}`;
    img.loading = "lazy";
    // Eleganter Fallback, falls das Foto nicht lädt
    img.addEventListener("error", () => {
      media.classList.add("is-fallback", "fb-" + (index % 4));
    });
    media.appendChild(img);

    if (p.tag) {
      const tag = document.createElement("span");
      tag.className = "card__tag";
      tag.textContent = p.tag;
      media.appendChild(tag);
    }

    const fav = document.createElement("button");
    fav.className = "card__fav" + (favs.has(p.id) ? " is-fav" : "");
    fav.setAttribute("aria-label", "Zu Favoriten hinzufügen");
    fav.textContent = favs.has(p.id) ? "♥" : "♡";
    fav.addEventListener("click", () => toggleFav(p.id, fav));
    media.appendChild(fav);

    const body = document.createElement("div");
    body.className = "card__body";
    body.innerHTML = `
      <span class="card__cat">${catLabel(p.category)}</span>
      <h3 class="card__name">${p.name}</h3>
      <p class="card__desc">${p.desc}</p>
      <div class="card__foot">
        <span class="card__price">${euro(p.price)}</span>
      </div>`;

    const addBtn = document.createElement("button");
    addBtn.className = "card__add";
    addBtn.textContent = "In den Warenkorb";
    addBtn.addEventListener("click", () => addToCart(p.id));
    $(".card__foot", body).appendChild(addBtn);

    card.append(media, body);
    return card;
  }

  function toggleFav(id, btn) {
    if (favs.has(id)) { favs.delete(id); btn.classList.remove("is-fav"); btn.textContent = "♡"; }
    else { favs.add(id); btn.classList.add("is-fav"); btn.textContent = "♥"; toast("Zu Favoriten hinzugefügt"); }
    save();
  }

  /* ---------- Warenkorb ---------- */
  function addToCart(id) {
    cart[id] = (cart[id] || 0) + 1;
    save();
    updateCartUI();
    toast(`„${product(id).name}" hinzugefügt`);
    bumpCount();
  }
  function setQty(id, qty) {
    if (qty <= 0) delete cart[id];
    else cart[id] = qty;
    save();
    updateCartUI();
  }
  const cartCount = () => Object.values(cart).reduce((a, b) => a + b, 0);
  const cartTotal = () =>
    Object.entries(cart).reduce((sum, [id, q]) => sum + (product(id)?.price || 0) * q, 0);

  function updateCartUI() {
    const count = cartCount();
    const badge = $("#cartCount");
    badge.textContent = count;
    badge.hidden = count === 0;

    const body = $("#cartItems");
    const empty = $("#cartEmpty");
    const foot = $("#cartFoot");
    const entries = Object.entries(cart);

    empty.style.display = entries.length ? "none" : "flex";
    foot.hidden = entries.length === 0;
    body.innerHTML = "";

    entries.forEach(([id, qty]) => {
      const p = product(id);
      if (!p) return;
      const row = document.createElement("div");
      row.className = "cart-item";
      row.innerHTML = `
        <img class="cart-item__img" src="${p.img}" alt="${p.name}"
             onerror="this.style.background='var(--clay)';this.removeAttribute('src');" />
        <div>
          <div class="cart-item__name">${p.name}</div>
          <div class="cart-item__price">${euro(p.price)}</div>
          <div class="cart-item__qty">
            <button aria-label="Weniger" data-dec>−</button>
            <span>${qty}</span>
            <button aria-label="Mehr" data-inc>+</button>
          </div>
        </div>
        <div class="cart-item__right">
          <span class="cart-item__sum">${euro(p.price * qty)}</span>
          <button class="cart-item__remove" data-remove>Entfernen</button>
        </div>`;
      $("[data-dec]", row).addEventListener("click", () => setQty(id, qty - 1));
      $("[data-inc]", row).addEventListener("click", () => setQty(id, qty + 1));
      $("[data-remove]", row).addEventListener("click", () => setQty(id, 0));
      body.appendChild(row);
    });

    $("#cartTotal").textContent = euro(cartTotal());
  }

  function bumpCount() {
    const badge = $("#cartCount");
    badge.animate(
      [{ transform: "scale(1)" }, { transform: "scale(1.4)" }, { transform: "scale(1)" }],
      { duration: 320, easing: "ease-out" }
    );
  }

  /* ---------- Drawer ---------- */
  function openDrawer() { $("#cartDrawer").classList.add("is-open"); $("#cartDrawer").setAttribute("aria-hidden", "false"); document.body.style.overflow = "hidden"; }
  function closeDrawer() { $("#cartDrawer").classList.remove("is-open"); $("#cartDrawer").setAttribute("aria-hidden", "true"); document.body.style.overflow = ""; }

  /* ---------- Toast ---------- */
  let toastTimer;
  function toast(msg) {
    const el = $("#toast");
    el.textContent = msg;
    el.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("is-visible"), 2200);
  }

  /* ---------- Scroll-Reveal ---------- */
  let revealObserver;
  function observeReveals() {
    if (!("IntersectionObserver" in window)) {
      $$(".reveal").forEach((el) => el.classList.add("is-visible"));
      return;
    }
    revealObserver = revealObserver || new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("is-visible"); revealObserver.unobserve(e.target); }
      }),
      { threshold: 0.12 }
    );
    $$(".reveal:not(.is-visible)").forEach((el) => revealObserver.observe(el));
  }

  /* ---------- Events verdrahten ---------- */
  function bindEvents() {
    $("#cartBtn").addEventListener("click", openDrawer);
    $$("[data-close]").forEach((el) => el.addEventListener("click", closeDrawer));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeDrawer(); });

    $("#checkoutBtn").addEventListener("click", () => {
      toast("Bestellung simuliert – danke fürs Stöbern! 🌿");
      cart = {};
      save();
      updateCartUI();
      setTimeout(closeDrawer, 900);
    });

    // Mobile Navigation
    const toggle = $("#navToggle");
    const nav = $("#nav");
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      toggle.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", open);
    });

    // Nav-Links: ggf. Kategorie setzen + Mobilmenü schließen
    $$("#nav a").forEach((a) =>
      a.addEventListener("click", () => {
        const cat = a.dataset.cat;
        if (cat) setCategory(cat);
        nav.classList.remove("is-open");
        toggle.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      })
    );

    // Newsletter
    $("#newsletterForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const input = $("#newsletterEmail");
      const hint = $("#newsletterHint");
      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim());
      if (ok) { hint.textContent = "Willkommen! Dein 10-%-Code ist unterwegs. 🌸"; input.value = ""; }
      else { hint.textContent = "Bitte gib eine gültige E-Mail-Adresse ein."; }
    });

    // Schatten am Header beim Scrollen
    const header = $("#header");
    const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Init ---------- */
  function init() {
    $("#year").textContent = new Date().getFullYear();
    renderFilters();
    renderGrid();
    updateCartUI();
    bindEvents();
    observeReveals();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
