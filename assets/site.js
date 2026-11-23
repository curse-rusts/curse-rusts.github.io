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
document.querySelectorAll("[data-world]").forEach((button) => {
  button.addEventListener("click", () => {
    const scene = scenes[button.dataset.world];
    if (!scene) return;
    document
      .querySelectorAll("[data-world]")
      .forEach((tab) =>
        tab.setAttribute("aria-pressed", String(tab === button)),
      );
    const image = document.getElementById("world-image");
    image.src = `/assets/shots/${scene.image}.webp`;
    image.alt = scene.alt;
    document.getElementById("world-kicker").textContent = scene.title;
    const caption = document.getElementById("world-caption");
    caption.replaceChildren(
      document.createTextNode(scene.caption[0]),
      document.createElement("br"),
      document.createTextNode(scene.caption[1]),
    );
  });
});
document.querySelectorAll("nav a").forEach((link) => {
  if (link.getAttribute("href") === location.pathname)
    link.setAttribute("aria-current", "page");
});
