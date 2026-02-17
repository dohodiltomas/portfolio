// ===== FOOTER YEAR =====
document.getElementById("year").textContent = new Date().getFullYear();

// ===== LIGHTBOX =====
const lightboxEl = document.getElementById("lightbox");
const lightbox = new bootstrap.Modal(lightboxEl);
const lightboxImg = document.getElementById("lightboxImg");
const lightboxTitle = document.getElementById("lightboxTitle");

// ===== LIGHTBOX STATE =====
let lbCards = [];
let lbIndex = 0;
let lbCurrentCard = null; // pro ruční metadata
let lbCurrentSrc = null;  // pro EXIF

// ===== LIGHTBOX BUTTONS =====
function setLightboxButtonsEnabled(enabled){
  const prev = document.getElementById("lbPrev");
  const next = document.getElementById("lbNext");
  if (prev) prev.disabled = !enabled;
  if (next) next.disabled = !enabled;
}

// ===== SHOW IMAGE =====
function showLightboxImage(){
  const card = lbCards[lbIndex];
  if (!card) return;

  lbCurrentCard = card;
  lightboxImg.src = card.getAttribute("data-full");
  lightboxTitle.textContent = card.getAttribute("data-title") || "Foto";
  lbCurrentSrc = lightboxImg.src;

  setLightboxButtonsEnabled(lbCards.length > 1);
}

// ===== SHIFT IMAGE =====
function shiftLightbox(delta){
  if (lbCards.length <= 1) return;

  lbIndex = (lbIndex + delta + lbCards.length) % lbCards.length;
  showLightboxImage();

  if (lbMeta && !lbMeta.hasAttribute("hidden")) {
    loadMetadataForCurrent();
  }
}

// ===== OPEN FROM DECK =====
function openLightboxFromDeck(deckName, index){
  const deck = document.querySelector(`.deck[data-deck="${deckName}"]`);
  if (!deck) return;

  lbCards = Array.from(deck.querySelectorAll(".deck-card"));
  if (!lbCards.length) return;

  lbIndex = ((index % lbCards.length) + lbCards.length) % lbCards.length;
  showLightboxImage();
  lightbox.show();
}

// ===== OPEN SINGLE =====
function openLightboxSingle(src, title){
  lbCards = [];
  lbIndex = 0;
  lbCurrentCard = null;

  lightboxImg.src = src;
  lightboxTitle.textContent = title || "Foto";
  lbCurrentSrc = lightboxImg.src;

  setLightboxButtonsEnabled(false);
  lightbox.show();
}

// ===== DECK LAYOUT =====
function layoutDeck(deckEl, startIndex = 0){
  const cards = Array.from(deckEl.querySelectorAll(".deck-card"));
  const n = cards.length;
  if (!n) return;

  cards.forEach(c => {
    c.classList.remove("is-top");
    c.style.opacity = 0;
    c.style.zIndex = 0;
    c.style.pointerEvents = "none";
    c.style.transform = "translate(0,0) rotate(0) scale(1)";
  });

  const maxVisible = Math.min(4, n);
  for (let i = 0; i < maxVisible; i++){
    const card = cards[(startIndex + i) % n];
    card.style.opacity = 1;
    card.style.zIndex = 100 - i;
    card.style.pointerEvents = i === 0 ? "auto" : "none";
    card.style.transform = `translate(${i * 10}px, ${i * 10}px) scale(${1 - i * 0.03})`;
    if (i === 0) card.classList.add("is-top");
  }

  deckEl.dataset.index = String(startIndex);
}

// ===== INIT =====
function initDecks(){
  document.querySelectorAll(".deck").forEach(deck => {
    layoutDeck(deck, 0);
    deck.addEventListener("click", () => {
      const top = deck.querySelector(".deck-card.is-top");
      if (!top) return;
      openLightboxFromDeck(deck.dataset.deck, parseInt(deck.dataset.index || "0", 10));
    });
  });

  document.querySelectorAll(".deck-next").forEach(btn => {
    btn.addEventListener("click", e => {
      e.preventDefault();
      e.stopPropagation();
      const deck = document.querySelector(`.deck[data-deck="${btn.dataset.deck}"]`);
      if (!deck) return;
      layoutDeck(deck, (parseInt(deck.dataset.index) + 1) % deck.children.length);
    });
  });

  document.querySelectorAll(".deck-prev").forEach(btn => {
    btn.addEventListener("click", e => {
      e.preventDefault();
      e.stopPropagation();
      const deck = document.querySelector(`.deck[data-deck="${btn.dataset.deck}"]`);
      if (!deck) return;
      layoutDeck(deck, (parseInt(deck.dataset.index) - 1 + deck.children.length) % deck.children.length);
    });
  });

  const about = document.querySelector(".about-photo");
  if (about){
    about.addEventListener("click", () => {
      openLightboxSingle(about.dataset.full, about.dataset.title);
    });
  }
}

// ===== LIGHTBOX NAV =====
lightboxEl.addEventListener("click", e => {
  if (e.target.closest("#lbPrev")) shiftLightbox(-1);
  if (e.target.closest("#lbNext")) shiftLightbox(+1);
});

// ===== METADATA =====
const lbInfoBtn = document.getElementById("lbInfoBtn");
const lbMeta = document.getElementById("lbMeta");
const lbMetaBody = document.getElementById("lbMetaBody");

function renderMeta(rows){
  lbMetaBody.innerHTML = rows.map(r => `
    <div class="lb-meta-row">
      <div class="lb-meta-key">${r.k}</div>
      <div class="lb-meta-val">${r.v}</div>
    </div>
  `).join("");
}

function loadManualMeta(){
  if (!lbCurrentCard) return null;
  const d = lbCurrentCard.dataset;

  const rows = [
    { k: "Foťák", v: d.camera },
    { k: "Objektiv", v: d.lens },
    { k: "ISO", v: d.iso },
    { k: "Čas", v: d.shutter },
    { k: "Clona", v: d.aperture },
    { k: "Ohnisko", v: d.focal },
    { k: "Datum", v: d.date },
  ].filter(r => r.v);

  return rows.length ? rows : null;
}

async function loadMetadataForCurrent(){

  // 1️⃣ ruční metadata mají přednost
  const manual = loadManualMeta();
  if (manual){
    renderMeta(manual);
    return;
  }

  // 2️⃣ EXIF fallback
  if (!lbCurrentSrc){
    lbMetaBody.textContent = "Metadata nejsou dostupná.";
    return;
  }

  try {
    const res = await fetch(lbCurrentSrc);
    const buf = await (await res.blob()).arrayBuffer();
    const tags = ExifReader.load(buf);

    const rows = [
      { k: "Foťák", v: tags.Make?.description || "—" },
      { k: "ISO", v: tags.ISOSpeedRatings?.description || "—" },
      { k: "Clona", v: tags.FNumber?.description || "—" },
      { k: "Čas", v: tags.ExposureTime?.description || "—" },
    ];

    renderMeta(rows);
  } catch {
    lbMetaBody.textContent = "Metadata nejsou dostupná.";
  }
}

lbInfoBtn?.addEventListener("click", async e => {
  e.preventDefault();
  e.stopPropagation();

  if (lbMeta.hasAttribute("hidden")){
    lbMeta.removeAttribute("hidden");
    await loadMetadataForCurrent();
  } else {
    lbMeta.setAttribute("hidden", "");
  }
});

// ===== KEYBOARD + SWIPE =====
document.addEventListener("keydown", e => {
  if (!lightboxEl.classList.contains("show")) return;
  if (e.key === "ArrowLeft") shiftLightbox(-1);
  if (e.key === "ArrowRight") shiftLightbox(+1);
});

let touchStartX = null;
lightboxEl.addEventListener("touchstart", e => {
  if (e.touches.length === 1) touchStartX = e.touches[0].clientX;
}, { passive: true });

lightboxEl.addEventListener("touchend", e => {
  if (touchStartX === null) return;
  const dx = e.changedTouches[0].clientX - touchStartX;
  touchStartX = null;
  if (Math.abs(dx) > 40) shiftLightbox(dx < 0 ? 1 : -1);
}, { passive: true });

// ===== RESET =====
lightboxEl.addEventListener("hidden.bs.modal", () => {
  lbCards = [];
  lbIndex = 0;
  lbCurrentCard = null;
  lbCurrentSrc = null;
  lbMeta?.setAttribute("hidden", "");
});

// ===== START =====
initDecks();
