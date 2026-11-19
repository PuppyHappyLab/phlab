function fitHeaderLogo() {
  const header = document.querySelector("header:not([data-big])");
  if (!header) return;

  const title = header.querySelector(".title");
  const subtitle = header.querySelector(".subtitle");
  const logo = header.querySelector(".logo");
  if (!title || !logo) return;

  const range = document.createRange();
  range.selectNodeContents(title);
  const top = range.getBoundingClientRect().top;
  range.selectNodeContents(subtitle || title);
  const bottom = range.getBoundingClientRect().bottom;
  logo.style.height = Math.max(0, bottom - top) + "px";
}

function scheduleHeaderLogo() {
  fitHeaderLogo();
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(fitHeaderLogo);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", scheduleHeaderLogo);
} else {
  scheduleHeaderLogo();
}

window.addEventListener("resize", fitHeaderLogo);
