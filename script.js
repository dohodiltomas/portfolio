// ===== FOOTER YEAR =====
document.getElementById("year").textContent = new Date().getFullYear();

// ===== LIGHTBOX (Bootstrap Modal) =====
const lightboxEl = document.getElementById("lightbox");
const lightbox = new bootstrap.Modal(lightboxEl);
const lightboxImg = document.getElementById("lightboxImg");
const lightboxTitle = document.getElementById("lightboxTitle");

// Lightbox "gallery state"
let lbCards = [];
let lbIndex = 0;

// --------- HELPERS ---------
function setLightboxButtonsEnabled(enabled) {
  const prevBtn = document.getElementById("lbPrev");
  const nextBtn = document.getElementById("lbNext");
  if (prevBtn) prevBtn.disabled = !enabled;
  if (nextBtn) nextBtn.disabled = !enabled;
}

function showLightboxImage() {
  const card = lbCards[lbIndex];
  if (!card) return;

  lightboxImg.src = card.getAttribute("data-full");
  lightboxTitle.textContent = card.getAttribute("data-title") || "Foto";

  setLightboxButtonsEnabled(lbCards.length > 1);
}

function shiftLightbox(delta) {
  if (lbCards.length <= 1) return;
  lbIndex = (lbIndex + delta + lbCards.length) % lbCards.length;
  showLightboxImage();
}

// Open lightbox as a gallery from a deck
function openLightboxFromDeck(deckName, index) {
  const deck = document.querySelector(`.deck[data-deck="${deckName}"]`);
  if (!deck) return;

  lbCards = Array.from(deck.querySelectorAll(".deck-card"));
  if (!lbCards.length) return;

  lbIndex = ((index % lbCards.length) + lbCards.length) % lbCards.length;
  showLightboxImage();
  lightbox.show();
}

// Open lightbox as a single image (no gallery)
function openLightboxSingle(src, title) {
  lbCards = [];
  lbIndex = 0;

  lightboxImg.src = src;
  lightboxTitle.textContent = title || "Foto";
  setLightboxButtonsEnabled(false);

  lightbox.show();
}

// ===== DECK (SHOWCASE) =====
function layoutDeck(deckEl, startIndex = 0) {
  const cards = Array.from(deckEl.querySelectorAll(".deck-card"));
  const n = cards.length;
  if (!n) return;

  const order = [];
  for (let i = 0; i < n; i++) order.push((startIndex + i) % n);

  cards.forEach((card) => {
    card.classList.remove("is-top");
    card.style.zIndex = 0;
    card.style.opacity = 0;
    card.style.transform = "translate(0,0) rotate(0deg) scale(1)";
    card.style.pointerEvents = "none";
  });

  const maxVisible = Math.min(4, n);
  for (let stackPos = 0; stackPos < maxVisible; stackPos++) {
    const idx = order[stackPos];
    const card = cards[idx];

    const dx = stackPos * 10;
    const dy = stackPos * 10;
    const rot = stackPos === 0 ? 0 : (stackPos % 2 ? 1.2 : -1.0);
    const scl = 1 - stackPos * 0.03;

    card.style.zIndex = 100 - stackPos;
    card.style.opacity = stackPos === 3 ? 0.86 : 1;
    card.style.transform = `translate(${dx}px, ${dy}px) rotate(${rot}deg) scale(${scl})`;
    card.style.pointerEvents = stackPos === 0 ? "auto" : "none";

    if (stackPos === 0) card.classList.add("is-top");
  }

  deckEl.dataset.index = String(startIndex);
}

// ===== INIT =====
function initDecks() {
  // Init decks + click on top card opens gallery lightbox
  document.querySelectorAll(".deck").forEach((deck) => {
    layoutDeck(deck, 0);

    deck.addEventListener("click", () => {
      const top = deck.querySelector(".deck-card.is-top");
      if (!top) return;

      const deckName = deck.getAttribute("data-deck");
      const i = parseInt(deck.dataset.index || "0", 10);
      openLightboxFromDeck(deckName, i);
    });
  });

  // Showcase navigation buttons
  document.querySelectorAll(".deck-next").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      const name = btn.dataset.deck;
      const deck = document.querySelector(`.deck[data-deck="${name}"]`);
      if (!deck) return;

      const n = deck.querySelectorAll(".deck-card").length;
      if (n <= 1) return;

      const i = parseInt(deck.dataset.index || "0", 10);
      layoutDeck(deck, (i + 1) % n);
    });
  });

  document.querySelectorAll(".deck-prev").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      const name = btn.dataset.deck;
      const deck = document.querySelector(`.deck[data-deck="${name}"]`);
      if (!deck) return;

      const n = deck.querySelectorAll(".deck-card").length;
      if (n <= 1) return;

      const i = parseInt(deck.dataset.index || "0", 10);
      layoutDeck(deck, (i - 1 + n) % n);
    });
  });

  // About photo: single lightbox (no gallery)
  const aboutBtn = document.querySelector(".about-photo");
  if (aboutBtn) {
    aboutBtn.addEventListener("click", () => {
      openLightboxSingle(
        aboutBtn.getAttribute("data-full"),
        aboutBtn.getAttribute("data-title")
      );
    });
  }
}

// ===== LIGHTBOX CONTROLS (PROFI: delegated clicks) =====
// This works even if you accidentally had duplicate buttons earlier.
lightboxEl.addEventListener("click", (e) => {
  const prev = e.target.closest("#lbPrev");
  const next = e.target.closest("#lbNext");
  if (!prev && !next) return;

  e.preventDefault();
  e.stopPropagation();

  if (prev) shiftLightbox(-1);
  if (next) shiftLightbox(+1);
});

// Keyboard arrows inside open modal
document.addEventListener("keydown", (e) => {
  if (!lightboxEl.classList.contains("show")) return;

  if (e.key === "ArrowLeft") shiftLightbox(-1);
  if (e.key === "ArrowRight") shiftLightbox(+1);
});

// Swipe (mobile)
let touchStartX = null;

lightboxEl.addEventListener(
  "touchstart",
  (e) => {
    if (!e.touches || e.touches.length !== 1) return;
    touchStartX = e.touches[0].clientX;
  },
  { passive: true }
);

lightboxEl.addEventListener(
  "touchend",
  (e) => {
    if (touchStartX === null) return;

    const endX =
      e.changedTouches && e.changedTouches[0] ? e.changedTouches[0].clientX : null;
    if (endX === null) {
      touchStartX = null;
      return;
    }

    const dx = endX - touchStartX;
    touchStartX = null;

    // threshold to avoid tiny gestures
    if (Math.abs(dx) < 40) return;

    // swipe left -> next, swipe right -> prev
    if (dx < 0) shiftLightbox(+1);
    else shiftLightbox(-1);
  },
  { passive: true }
);

// Reset gallery state when modal is closed (clean)
lightboxEl.addEventListener("hidden.bs.modal", () => {
  lbCards = [];
  lbIndex = 0;
});

// ===== START =====
initDecks();
