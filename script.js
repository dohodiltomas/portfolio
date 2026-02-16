// footer year
document.getElementById("year").textContent = new Date().getFullYear();

// Lightbox
const lightboxEl = document.getElementById("lightbox");
const lightbox = new bootstrap.Modal(lightboxEl);
const lightboxImg = document.getElementById("lightboxImg");
const lightboxTitle = document.getElementById("lightboxTitle");

function openLightbox(src, title){
  lightboxImg.src = src;
  lightboxTitle.textContent = title || "Foto";
  lightbox.show();
}

// Layout deck like overlapping playing cards
function layoutDeck(deckEl, startIndex = 0){
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
  for (let stackPos = 0; stackPos < maxVisible; stackPos++){
    const idx = order[stackPos];
    const card = cards[idx];

    const dx = stackPos * 10;
    const dy = stackPos * 10;
    const rot = (stackPos === 0) ? 0 : (stackPos % 2 ? 1.2 : -1.0);
    const scl = 1 - stackPos * 0.03;

    card.style.zIndex = 100 - stackPos;
    card.style.opacity = (stackPos === 3) ? 0.86 : 1;
    card.style.transform = `translate(${dx}px, ${dy}px) rotate(${rot}deg) scale(${scl})`;
    card.style.pointerEvents = (stackPos === 0) ? "auto" : "none";

    if (stackPos === 0) card.classList.add("is-top");
  }

  deckEl.dataset.index = String(startIndex);
}

function initDecks(){
  document.querySelectorAll(".deck").forEach(deck => {
    layoutDeck(deck, 0);

    deck.addEventListener("click", (e) => {
      // když klikneš na šipky (nebo jejich děti), neotvírej lightbox
      if (e.target.closest(".deck-next") || e.target.closest(".deck-prev")) return;

      const top = deck.querySelector(".deck-card.is-top");
      if (!top) return;
      openLightbox(top.getAttribute("data-full"), top.getAttribute("data-title"));
    });
  });

  document.querySelectorAll(".deck-next").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation(); // důležité: ať se to nepřeklikne do deck clicku

      const name = btn.dataset.deck;
      const deck = document.querySelector(`.deck[data-deck="${name}"]`);
      if (!deck) return;

      const n = deck.querySelectorAll(".deck-card").length;
      if (n <= 1) return; // není co listovat

      const i = parseInt(deck.dataset.index || "0", 10);
      layoutDeck(deck, (i + 1) % n);
    });
  });

  document.querySelectorAll(".deck-prev").forEach(btn => {
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

  // About photo click -> lightbox
  const aboutBtn = document.querySelector(".about-photo");
  if (aboutBtn){
    aboutBtn.addEventListener("click", () => {
      openLightbox(aboutBtn.getAttribute("data-full"), aboutBtn.getAttribute("data-title"));
    });
  }
}

initDecks();

