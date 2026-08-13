(() => {
  "use strict";

  const languagePicker = document.querySelector("[data-language-picker]");
  const rootPrefix = document.documentElement.dataset.rootPrefix || "";

  document.querySelectorAll("[data-app-store-link]").forEach((link) => {
    if (link instanceof HTMLAnchorElement) link.href = "https://apps.apple.com/app/id6772479708";
  });

  if (languagePicker) {
    languagePicker.addEventListener("change", () => {
      const locale = languagePicker.value;
      const destination = locale === "en"
        ? `${rootPrefix}index.html`
        : `${rootPrefix}${locale}/index.html`;
      window.location.assign(destination);
    });
  }

  const header = document.querySelector("[data-header]");
  const updateHeader = () => header?.classList.toggle("is-scrolled", window.scrollY > 18);
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  const menuToggle = document.querySelector("[data-menu-toggle]");
  const nav = document.getElementById("primary-navigation");
  if (menuToggle && nav) {
    menuToggle.addEventListener("click", () => {
      const open = menuToggle.getAttribute("aria-expanded") !== "true";
      menuToggle.setAttribute("aria-expanded", String(open));
      nav.classList.toggle("is-open", open);
    });
    nav.addEventListener("click", (event) => {
      if (event.target instanceof HTMLAnchorElement) {
        menuToggle.setAttribute("aria-expanded", "false");
        nav.classList.remove("is-open");
      }
    });
  }

  const revealItems = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        const hasPassedViewport = entry.boundingClientRect.bottom <= window.innerHeight;
        if (!entry.isIntersecting && !hasPassedViewport) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -5%" });
    revealItems.forEach((item) => revealObserver.observe(item));
    const revealPassedItems = () => {
      revealItems.forEach((item) => {
        if (!item.classList.contains("is-visible") && item.getBoundingClientRect().bottom < window.innerHeight * 0.12) {
          item.classList.add("is-visible");
          revealObserver.unobserve(item);
        }
      });
    };
    window.addEventListener("scroll", revealPassedItems, { passive: true });
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }

  const stage = document.querySelector("[data-flow-stage]");
  const machine = document.querySelector("[data-flow-dropzone]");
  const sources = [...document.querySelectorAll("[data-flow-source]")];
  const editButton = document.querySelector("[data-flow-edit]");
  const pasteButton = document.querySelector("[data-flow-paste]");
  const resetButton = document.querySelector("[data-flow-reset]");
  const title = document.querySelector("[data-flow-title]");
  const description = document.querySelector("[data-flow-description]");
  const message = document.querySelector("[data-flow-message]");
  const status = document.querySelector("[data-flow-status]");
  const count = document.querySelector("[data-flow-count]");
  const labels = Object.fromEntries(sources.map((source) => [source.dataset.flowSource, source.lastElementChild?.textContent || ""]));
  let selected = "image";
  let step = 1;

  function setFlowState(nextStep, sourceType = selected) {
    if (!stage || !machine) return;
    selected = sourceType;
    step = nextStep;
    sources.forEach((source) => {
      const isSelected = source.dataset.flowSource === selected;
      source.classList.toggle("is-selected", isSelected);
      source.setAttribute("aria-pressed", String(isSelected));
    });
    machine.classList.toggle("is-edited", step === 3);
    if (title) title.textContent = labels[selected];
    if (count) count.textContent = `0${step} / 03`;
    if (status) status.textContent = step === 1 ? stage.dataset.idle : step === 2 ? stage.dataset.picked : stage.dataset.complete;
    if (description) description.textContent = step === 3 ? stage.dataset.complete : step === 2 ? stage.dataset.edited : message?.textContent || "";
    if (message) message.textContent = step === 1 ? stage.dataset.idle : step === 2 ? stage.dataset.edited : stage.dataset.complete;
    if (pasteButton) pasteButton.disabled = step < 2;
  }

  sources.forEach((source) => {
    source.addEventListener("click", () => setFlowState(2, source.dataset.flowSource));
    source.addEventListener("dragstart", (event) => {
      event.dataTransfer?.setData("text/plain", source.dataset.flowSource || "image");
      if (event.dataTransfer) event.dataTransfer.effectAllowed = "copy";
    });
  });

  if (machine) {
    ["dragenter", "dragover"].forEach((eventName) => machine.addEventListener(eventName, (event) => {
      event.preventDefault();
      machine.classList.add("is-dragover");
    }));
    ["dragleave", "drop"].forEach((eventName) => machine.addEventListener(eventName, () => machine.classList.remove("is-dragover")));
    machine.addEventListener("drop", (event) => {
      event.preventDefault();
      setFlowState(2, event.dataTransfer?.getData("text/plain") || selected);
    });
    machine.addEventListener("click", () => setFlowState(Math.min(step + 1, 3), selected));
    machine.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      setFlowState(Math.min(step + 1, 3), selected);
    });
  }

  editButton?.addEventListener("click", (event) => {
    event.stopPropagation();
    setFlowState(3, selected);
  });
  pasteButton?.addEventListener("click", (event) => {
    event.stopPropagation();
    setFlowState(3, selected);
  });
  resetButton?.addEventListener("click", () => setFlowState(1, "image"));

  if (stage && !window.matchMedia("(prefers-reduced-motion: reduce)").matches && window.matchMedia("(pointer: fine)").matches) {
    stage.addEventListener("pointermove", (event) => {
      const bounds = stage.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - 0.5;
      const y = (event.clientY - bounds.top) / bounds.height - 0.5;
      stage.style.transform = `rotateY(${x * 5 - 2}deg) rotateX(${y * -4 + 1}deg)`;
      stage.classList.add("is-hovering");
    });
    stage.addEventListener("pointerleave", () => {
      stage.style.removeProperty("transform");
      stage.classList.remove("is-hovering");
    });
  }

  const video = document.querySelector("[data-product-video]");
  const fallback = document.querySelector("[data-media-fallback]");
  if (video && fallback) {
    const showVideo = () => { fallback.hidden = true; };
    const showFallback = () => { fallback.hidden = false; video.hidden = true; };
    video.addEventListener("loadedmetadata", showVideo, { once: true });
    video.addEventListener("error", showFallback, { once: true });
    video.querySelector("source")?.addEventListener("error", showFallback, { once: true });
  }
})();
