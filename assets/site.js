const scenes = {
  overworld: {
    image: "sunset",
    alt: "The sun setting over a cherry grove and a river valley",
    title: "THE OVERWORLD",
    caption: ["One more sunset.", "Then we log off."],
  },
  nether: {
    image: "nether",
    alt: "A piglin among giant crimson fungi in the Nether",
    title: "THE NETHER",
    caption: ["A little less peaceful.", "Just as familiar."],
  },
  survival: {
    image: "survival",
    alt: "Survival gameplay in a village square with villagers and the player hotbar",
    title: "SURVIVAL",
    caption: ["Back to the village.", "Back to your world."],
  },
};
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
let motionPaused = false;
try {
  motionPaused = localStorage.getItem("curse-motion") === "paused";
} catch {}
const motionButton = document.querySelector(".motion-control");
function setMotion(paused) {
  motionPaused = paused;
  document.body.classList.toggle("motion-paused", paused);
  if (motionButton) {
    motionButton.setAttribute("aria-pressed", String(paused));
    motionButton.setAttribute(
      "aria-label",
      paused ? "Resume decorative animations" : "Pause decorative animations",
    );
    motionButton.querySelector(".motion-label").textContent = paused
      ? "Resume motion"
      : "Pause motion";
    motionButton.firstElementChild.textContent = paused ? "▷" : "Ⅱ";
  }
  document.dispatchEvent(
    new CustomEvent("curse-motion", { detail: { paused } }),
  );
  try {
    localStorage.setItem("curse-motion", paused ? "paused" : "on");
  } catch {}
}
setMotion(motionPaused);
motionButton?.addEventListener("click", () => setMotion(!motionPaused));

let sceneRequest = 0;
document.querySelectorAll("[data-world]").forEach((button) => {
  button.addEventListener("click", async () => {
    const scene = scenes[button.dataset.world];
    if (!scene || button.getAttribute("aria-pressed") === "true") return;
    const request = ++sceneRequest;
    const gallery = document.querySelector(".gallery");
    const image = document.getElementById("world-image");
    gallery.classList.add("is-changing");
    const preload = new Image();
    preload.src = `/assets/shots/${scene.image}.webp`;
    try {
      await Promise.all([
        preload.decode(),
        new Promise((resolve) =>
          setTimeout(resolve, reducedMotion.matches || motionPaused ? 0 : 240),
        ),
      ]);
      if (request !== sceneRequest) return;
      image.src = preload.src;
      image.alt = scene.alt;
      document.getElementById("world-kicker").textContent = scene.title;
      document
        .getElementById("world-caption")
        .replaceChildren(
          document.createTextNode(scene.caption[0]),
          document.createElement("br"),
          document.createTextNode(scene.caption[1]),
        );
      document
        .querySelectorAll("[data-world]")
        .forEach((tab) =>
          tab.setAttribute("aria-pressed", String(tab === button)),
        );
    } catch {
      if (request !== sceneRequest) return;
    }
    gallery.classList.remove("is-changing");
  });
});

document.querySelectorAll("nav a").forEach((link) => {
  if (link.getAttribute("href") === location.pathname)
    link.setAttribute("aria-current", "page");
});

if (document.body.classList.contains("home")) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.08, rootMargin: "0px 0px -20px 0px" },
  );
  document
    .querySelectorAll(
      ".section-heading, .feature, .ecosystem-grid, .architecture, .faq details, .download-banner, .gallery",
    )
    .forEach((element, index) => {
      element.classList.add("reveal");
      element.style.setProperty(
        "--delay",
        `${element.classList.contains("feature") ? (index % 3) * 0.09 : 0}s`,
      );
      revealObserver.observe(element);
    });
  document.body.classList.add("enhanced");
  let scrollPending = false;
  const readProgress = () => {
    scrollPending = false;
    document.documentElement.style.setProperty(
      "--hero-shift",
      `${motionPaused || reducedMotion.matches ? 0 : Math.min(120, scrollY * 0.12)}px`,
    );
    const total = document.documentElement.scrollHeight - innerHeight;
    document.documentElement.style.setProperty(
      "--read",
      total > 0 ? Math.min(1, Math.max(0, scrollY / total)) : 0,
    );
  };
  addEventListener(
    "scroll",
    () => {
      if (!scrollPending) {
        scrollPending = true;
        requestAnimationFrame(readProgress);
      }
    },
    { passive: true },
  );
  addEventListener("resize", readProgress);
  readProgress();
  if (matchMedia("(pointer: fine)").matches) {
    document.querySelectorAll(".feature").forEach((card) => {
      card.addEventListener("pointermove", (event) => {
        if (motionPaused || reducedMotion.matches) return;
        const rect = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${event.clientX - rect.left}px`);
        card.style.setProperty("--my", `${event.clientY - rect.top}px`);
      });
    });
  }
}

const layers = {
  engine: {
    label: "NATIVE RUST",
    title: ["A different kind", "of foundation."],
    description:
      "World generation, simulation and networking, reimplemented in Rust. Vanilla behavior is the specification, with differential harnesses comparing both games on matching inputs.",
    link: "/docs.html",
    linkText: "Explore the documentation",
  },
  renderer: {
    label: "POWERED BY WGPU",
    title: ["Every block.", "A native perspective."],
    description:
      "The world is rendered through wgpu. Chunks, lighting and the view in front of you belong to the native engine. The game does not need a Java runtime to draw your world.",
    link: "/docs/install.html",
    linkText: "Prepare your first world",
  },
  launcher: {
    label: "GPUI + RUST",
    title: ["Your next session,", "one click closer."],
    description:
      "A native GPUI launcher handles Microsoft sign-in, game preparation, installed versions and updates. Client, server and launcher share a commitment to Rust.",
    link: "/download.html",
    linkText: "Get the native launcher",
  },
};
const architecture = document.querySelector(".architecture");
if (architecture) architecture.dataset.active = "engine";
document.querySelectorAll("[data-layer]").forEach((button) =>
  button.addEventListener("click", () => {
    const layer = layers[button.dataset.layer];
    if (!layer || button.getAttribute("aria-pressed") === "true") return;
    document
      .querySelectorAll("[data-layer]")
      .forEach((tab) =>
        tab.setAttribute("aria-pressed", String(tab === button)),
      );
    architecture.dataset.active = button.dataset.layer;
    document.getElementById("layer-label").textContent = layer.label;
    document
      .getElementById("layer-title")
      .replaceChildren(
        document.createTextNode(layer.title[0]),
        document.createElement("br"),
        document.createTextNode(layer.title[1]),
      );
    document.getElementById("layer-description").textContent =
      layer.description;
    const link = document.getElementById("layer-link");
    link.href = layer.link;
    link.textContent = layer.linkText;
    if (!reducedMotion.matches && !motionPaused) {
      document
        .querySelectorAll(".architecture-copy>h3, .architecture-copy>p")
        .forEach((element) =>
          element.animate(
            [
              { opacity: 0, transform: "translateY(12px)" },
              { opacity: 1, transform: "translateY(0)" },
            ],
            { duration: 400, easing: "ease-out" },
          ),
        );
    }
  }),
);

const command = document.querySelector(".command-dialog");
const search = document.getElementById("command-search");
function openCommand() {
  if (!command || command.open) return;
  command.showModal();
  search.value = "";
  command.querySelectorAll(".command-links a").forEach((link) => {
    link.hidden = false;
  });
  command.querySelector(".command-empty").hidden = true;
  search.focus();
}
document
  .querySelector(".command-trigger")
  ?.addEventListener("click", openCommand);
addEventListener("keydown", (event) => {
  if (
    (event.metaKey || event.ctrlKey) &&
    event.key.toLowerCase() === "k" &&
    command
  ) {
    event.preventDefault();
    if (command.open) command.close();
    else openCommand();
  }
});
search?.addEventListener("input", () => {
  let count = 0;
  const query = search.value.toLowerCase().trim();
  command.querySelectorAll(".command-links a").forEach((link) => {
    link.hidden = !link.textContent.toLowerCase().includes(query);
    if (!link.hidden) count++;
  });
  command.querySelector(".command-empty").hidden = count !== 0;
});
command
  ?.querySelectorAll("a")
  .forEach((link) => link.addEventListener("click", () => command.close()));
document
  .querySelectorAll("[data-close-dialog]")
  .forEach((button) =>
    button.addEventListener("click", () => button.closest("dialog").close()),
  );
document.querySelectorAll("dialog").forEach((dialog) => {
  dialog.addEventListener("click", (event) => {
    const rect = dialog.getBoundingClientRect();
    if (
      event.target === dialog &&
      (event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom)
    )
      dialog.close();
  });
});
document.querySelector(".gallery-expand")?.addEventListener("click", () => {
  const dialog = document.querySelector(".image-dialog");
  const image = document.getElementById("world-image");
  const expanded = dialog.querySelector("img");
  expanded.src = image.src;
  expanded.alt = image.alt;
  dialog.showModal();
});
