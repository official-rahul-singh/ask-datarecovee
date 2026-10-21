import Swiper from "swiper";
import { Pagination, Autoplay } from "swiper/modules";

const TAB_ORDER = {
  popular: ["backup", "recovery", "mac", "iphone", "windows"],
  latest: ["iphone", "windows", "mac", "recovery", "backup"],
  "most-answered": ["recovery", "backup", "windows", "mac", "iphone"],
  newest: ["windows", "iphone", "recovery", "mac", "backup"],
};

const TAB_COUNTS = {
  popular: {
    backup: "100+ Questions",
    recovery: "100+ Questions",
    mac: "100+ Questions",
    iphone: "100+ Questions",
    windows: "100+ Questions",
  },
  latest: {
    backup: "36 Questions",
    recovery: "42 Questions",
    mac: "28 Questions",
    iphone: "54 Questions",
    windows: "31 Questions",
  },
  "most-answered": {
    backup: "180+ Answers",
    recovery: "220+ Answers",
    mac: "95+ Answers",
    iphone: "140+ Answers",
    windows: "110+ Answers",
  },
  newest: {
    backup: "8 New",
    recovery: "12 New",
    mac: "5 New",
    iphone: "15 New",
    windows: "9 New",
  },
};

function applyGroupTab(tabName) {
  const grid = document.getElementById("groups-grid");
  if (!grid) return;

  const order = TAB_ORDER[tabName] || TAB_ORDER.popular;
  const counts = TAB_COUNTS[tabName] || TAB_COUNTS.popular;
  const cards = new Map(
    [...grid.querySelectorAll("[data-id]")].map((card) => [
      card.dataset.id,
      card,
    ]),
  );

  order.forEach((id) => {
    const card = cards.get(id);
    if (!card) return;
    grid.appendChild(card);
    const countEl = card.querySelector("[data-count]");
    if (countEl && counts[id]) countEl.textContent = counts[id];
  });
}

const DISCUSSION_TABS = new Set([
  "all",
  "open",
  "solved",
  "unanswered",
  "following",
]);

function applyDiscussionTab(tabName) {
  const area = document.querySelector(".question-area");
  if (!area) return;

  area.querySelectorAll("article.card").forEach((card) => {
    const status = card.dataset.status || "open";
    const following = card.dataset.following === "true";
    let show = true;

    if (tabName === "solved") show = status === "solved";
    else if (tabName === "unanswered") show = status === "unanswered";
    else if (tabName === "open") show = status === "open" || status === "unanswered";
    else if (tabName === "following") show = following;
    else show = true;

    card.hidden = !show;
  });
}

document.querySelectorAll('[role="tablist"]').forEach((list) => {
  list.querySelectorAll('[role="tab"]').forEach((tab) => {
    tab.addEventListener("click", () => {
      list.querySelectorAll('[role="tab"]').forEach((t) => {
        t.setAttribute("aria-selected", "false");
      });
      tab.setAttribute("aria-selected", "true");

      const name = tab.dataset.tab;
      if (name in TAB_ORDER) applyGroupTab(name);
      if (DISCUSSION_TABS.has(name)) applyDiscussionTab(name);
    });
  });
});

function closeDropdown(dropdown) {
  const trigger = dropdown.querySelector(".dropdown-trigger");
  const menu = dropdown.querySelector(".dropdown-menu");
  if (!trigger || !menu) return;
  dropdown.classList.remove("is-open");
  trigger.setAttribute("aria-expanded", "false");
  menu.classList.add("hidden");
}

function openDropdown(dropdown) {
  const trigger = dropdown.querySelector(".dropdown-trigger");
  const menu = dropdown.querySelector(".dropdown-menu");
  if (!trigger || !menu) return;
  dropdown.classList.add("is-open");
  trigger.setAttribute("aria-expanded", "true");
  menu.classList.remove("hidden");
}

function closeAllDropdowns(except) {
  document.querySelectorAll(".dropdown.is-open").forEach((dropdown) => {
    if (dropdown !== except) closeDropdown(dropdown);
  });
}

document.querySelectorAll(".dropdown").forEach((dropdown) => {
  const trigger = dropdown.querySelector(".dropdown-trigger");
  const menu = dropdown.querySelector(".dropdown-menu");
  const label = dropdown.querySelector(".dropdown-label");
  const input = dropdown.querySelector(".dropdown-input");
  if (!trigger || !menu) return;

  const isAccordion = dropdown.classList.contains("dropdown-accordion");
  const isMobileSidebarAccordion = () =>
    isAccordion &&
    dropdown.closest(".home-sidebar") &&
    window.matchMedia("(width < 64rem)").matches;

  const toggleDropdown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isMobileSidebarAccordion()) {
      closeDropdown(dropdown);
      return;
    }
    const isOpen = dropdown.classList.contains("is-open");
    if (!isAccordion) closeAllDropdowns(dropdown);
    if (isOpen) closeDropdown(dropdown);
    else openDropdown(dropdown);
  };

  trigger.addEventListener("click", toggleDropdown);
  trigger.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") toggleDropdown(e);
  });

  if (!isAccordion) {
    menu.querySelectorAll("[data-value]").forEach((option) => {
      option.addEventListener("click", () => {
        menu.querySelectorAll("[data-value]").forEach((o) => {
          o.setAttribute("aria-selected", "false");
        });
        option.setAttribute("aria-selected", "true");
        if (label) label.textContent = option.textContent.trim();
        if (input) input.value = option.dataset.value;
        closeDropdown(dropdown);
      });
    });
  }
});

document.addEventListener("click", () => {
  document.querySelectorAll(".dropdown.is-open:not(.dropdown-accordion)").forEach(closeDropdown);
});

document.querySelectorAll("[data-like]").forEach((el) => {
  const icon = el.querySelector("[data-like-icon]");
  const countEl = el.querySelector("[data-like-count]");
  if (!icon || !countEl) return;

  const toggleLike = () => {
    const liked = el.getAttribute("aria-pressed") === "true";
    const next = !liked;
    el.setAttribute("aria-pressed", String(next));
    icon.setAttribute("fill", next ? "currentColor" : "none");
    const n = parseInt(countEl.textContent.replace(/,/g, ""), 10);
    if (!Number.isNaN(n)) countEl.textContent = String(next ? n + 1 : n - 1);
  };

  el.addEventListener("click", toggleLike);
  el.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleLike();
    }
  });
});

function buildUserCard(el) {
  if (el.querySelector(".user-card")) return;

  const name = el.dataset.name || "user";
  const initial = el.dataset.initial || name.charAt(0).toUpperCase();
  const avatar = el.dataset.avatar || "";
  const avatarBg = el.dataset.avatarBg || "#bbf7d0";
  const avatarColor = el.dataset.avatarColor || "#166534";
  const role = el.dataset.role || "Member";
  const joined = el.dataset.joined || "—";
  const seen = el.dataset.seen || "—";
  const messages = el.dataset.messages || "0";
  const reactions = el.dataset.reactions || "0";
  const points = el.dataset.points || "0";
  const profile = el.dataset.profile || "#member";

  const avatarHtml = avatar
    ? `<img src="${avatar}" alt="" />`
    : initial;

  const card = document.createElement("div");
  card.className = "user-card";
  card.setAttribute("role", "tooltip");
  card.innerHTML = `
    <div class="user-card__head">
      <a href="${profile}" class="user-card__avatar" style="background:${avatarBg};color:${avatarColor}">${avatarHtml}</a>
      <div class="user-card__meta">
        <a href="${profile}" class="user-card__name">${name}</a>
        <span class="user-card__badge">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          ${role}
        </span>
        <p class="user-card__detail">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
          Joined: ${joined}
        </p>
        <p class="user-card__detail">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
          Last seen: ${seen}
        </p>
      </div>
    </div>
    <div class="user-card__stats">
      <div class="user-card__stat">
        <span class="user-card__stat-text">
          <span class="user-card__stat-label">Messages</span>
          <span class="user-card__stat-value">${messages}</span>
        </span>
      </div>
      <div class="user-card__stat">
        <span class="user-card__stat-text">
          <span class="user-card__stat-label">Reaction score</span>
          <span class="user-card__stat-value">${reactions}</span>
        </span>
      </div>
      <div class="user-card__stat">
        <span class="user-card__stat-text">
          <span class="user-card__stat-label">Points</span>
          <span class="user-card__stat-value">${points}</span>
        </span>
      </div>
    </div>
  `;
  el.appendChild(card);
}

document.querySelectorAll("[data-user-card]").forEach(buildUserCard);

const signupSwiperEl = document.querySelector(".signup-swiper");
if (signupSwiperEl) {
  new Swiper(signupSwiperEl, {
    modules: [Pagination, Autoplay],
    slidesPerView: 1,
    spaceBetween: 16,
    loop: true,
    autoplay: {
      delay: 4000,
      disableOnInteraction: false,
    },
    pagination: {
      el: ".signup-swiper-pagination",
      clickable: true,
      renderBullet(index, className) {
        return `<button type="button" class="${className} signup-swiper-bullet" aria-label="Slide ${index + 1}">${index + 1}</button>`;
      },
    },
  });
}

document.querySelectorAll(".password-toggle").forEach((btn) => {
  btn.addEventListener("click", () => {
    const field = btn.closest(".password-field");
    const input = field?.querySelector("input");
    if (!input) return;

    const showIcon = btn.querySelector(".password-icon-show");
    const hideIcon = btn.querySelector(".password-icon-hide");
    const isHidden = input.type === "password";

    input.type = isHidden ? "text" : "password";
    btn.setAttribute("aria-pressed", String(isHidden));
    btn.setAttribute("aria-label", isHidden ? "Hide password" : "Show password");
    showIcon?.classList.toggle("hidden", isHidden);
    hideIcon?.classList.toggle("hidden", !isHidden);
  });
});

const signupForm = document.getElementById("signup-form");
const signupPassword = document.getElementById("signup-password");
const signupPasswordConfirm = document.getElementById(
  "signup-password-confirm",
);

function validateSignupPasswords() {
  if (!signupPassword || !signupPasswordConfirm) return true;

  if (
    signupPasswordConfirm.value &&
    signupPassword.value !== signupPasswordConfirm.value
  ) {
    signupPasswordConfirm.setCustomValidity("Passwords do not match");
    return false;
  }

  signupPasswordConfirm.setCustomValidity("");
  return true;
}

if (signupPassword && signupPasswordConfirm) {
  signupPassword.addEventListener("input", validateSignupPasswords);
  signupPasswordConfirm.addEventListener("input", validateSignupPasswords);
}

signupForm?.addEventListener("submit", (event) => {
  if (!validateSignupPasswords()) {
    event.preventDefault();
    signupPasswordConfirm?.reportValidity();
  }
});

/* Mobile header slide menu */
const headerSlide = document.querySelector(".header-slide");
const headerSlideOverlay = document.querySelector(".header-slide-overlay");
const toggleSlideBtns = document.querySelectorAll(".toggle-slide-btn");
const closeSlideBtns = document.querySelectorAll(".header-slide-close");

function setSearchBtnState(btn, isOpen) {
  btn.classList.toggle("is-active", isOpen);
  btn.setAttribute("aria-expanded", String(isOpen));
  btn.setAttribute("aria-label", isOpen ? "Close search" : "Open search");
  btn.querySelector(".search-btn-icon--open")?.classList.toggle("hidden", isOpen);
  btn.querySelector(".search-btn-icon--close")?.classList.toggle("hidden", !isOpen);
}

function closeMobileSearch() {
  document.querySelector(".search-bar")?.classList.remove("is-open");
  document.querySelectorAll(".search-btn").forEach((btn) => {
    setSearchBtnState(btn, false);
  });
}

function openHeaderSlide() {
  if (!headerSlide) return;
  closeMobileSearch();
  headerSlide.classList.add("is-open");
  headerSlideOverlay?.classList.add("is-open");
  document.body.classList.add("menu-open");
  toggleSlideBtns.forEach((btn) => btn.setAttribute("aria-expanded", "true"));
}

function closeHeaderSlide() {
  if (!headerSlide) return;
  headerSlide.classList.remove("is-open");
  headerSlideOverlay?.classList.remove("is-open");
  document.body.classList.remove("menu-open");
  toggleSlideBtns.forEach((btn) => btn.setAttribute("aria-expanded", "false"));
}

toggleSlideBtns.forEach((btn) => {
  btn.setAttribute("aria-expanded", "false");
  btn.setAttribute("aria-controls", "header-slide");
  btn.addEventListener("click", () => {
    if (headerSlide?.classList.contains("is-open")) closeHeaderSlide();
    else openHeaderSlide();
  });
});

closeSlideBtns.forEach((btn) => {
  btn.addEventListener("click", closeHeaderSlide);
});

headerSlideOverlay?.addEventListener("click", closeHeaderSlide);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeHeaderSlide();
});

window.addEventListener("resize", () => {
  if (window.matchMedia("(min-width: 80rem)").matches) closeHeaderSlide();
});

document.querySelectorAll(".openLogin").forEach((btn) => {
  btn.addEventListener("click", () => {
    window.location.href = "login-pg.html";
  });
});

document.querySelectorAll(".openSignup").forEach((btn) => {
  btn.addEventListener("click", () => {
    window.location.href = "signup-pg.html";
  });
});

document.querySelectorAll(".search-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const bar = document.querySelector(".search-bar");
    if (!bar) return;
    const willOpen = !bar.classList.contains("is-open");
    bar.classList.toggle("is-open", willOpen);
    setSearchBtnState(btn, willOpen);
    if (willOpen) {
      bar.querySelector("input")?.focus();
    }
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeMobileSearch();
});


