{
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const easing = "cubic-bezier(0.22, 1, 0.36, 1)";
  const duration = 600;

  const headerParts = () => {
    const parts = [];
    const logo = document.querySelector("header .logo");
    const title = document.querySelector("header .title-text");
    if (logo) parts.push({ el: logo, scale: true });
    if (title) parts.push({ el: title, scale: false });
    document.querySelectorAll("header nav > a").forEach((el) => {
      parts.push({ el, scale: false });
    });
    return parts;
  };

  const play = (parts, fromHeight) => {
    const header = document.querySelector("header");
    const home = header.querySelector(".home");
    const nav = header.querySelector("nav");
    const toHeight = header.getBoundingClientRect().height;
    const sameHeight = Math.abs(toHeight - fromHeight) < 2;

    header.querySelectorAll("[data-header-shade]").forEach((node) => node.remove());

    if (!sameHeight) {
      header.style.background = "transparent";
      [home, nav].forEach((el) => {
        if (!el) return;
        el.style.position = "relative";
        el.style.zIndex = "1";
      });

      const shade = document.createElement("div");
      shade.setAttribute("data-header-shade", "");
      shade.style.cssText = "position:absolute;left:0;right:0;top:0;background:#000;z-index:0;pointer-events:none;";
      shade.style.height = fromHeight + "px";
      header.insertBefore(shade, header.firstChild);
      const cover = 34;
      const shadeAnim = shade.animate(
        [
          { height: fromHeight + cover + "px", offset: 0 },
          { height: Math.max(fromHeight, toHeight) + cover + "px", offset: 0.72 },
          { height: toHeight + "px", offset: 1 },
        ],
        { duration, easing, fill: "both" }
      );
      const restore = () => {
        shade.remove();
        header.style.background = "";
        [home, nav].forEach((el) => {
          if (!el) return;
          el.style.position = "";
          el.style.zIndex = "";
        });
      };
      shadeAnim.onfinish = restore;
      shadeAnim.oncancel = restore;
    }

    parts.forEach(({ el, scale, from }) => {
      const to = el.getBoundingClientRect();
      const dx = from.left - to.left;
      const dy = from.top - to.top;
      const scaleBy = scale && to.height ? from.height / to.height : 1;
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5 && Math.abs(scaleBy - 1) < 0.02) return;
      el.getAnimations().forEach((animation) => animation.cancel());
      el.style.transformOrigin = "top left";
      const fromTransform = scale
        ? `translate(${dx}px, ${dy}px) scale(${scaleBy})`
        : `translate(${dx}px, ${dy}px)`;
      const midDy = el.closest("nav") ? Math.max(dy, 0) : Math.min(dy, 0);
      const midScale = scale ? (scaleBy + 1) / 2 : 1;
      const midTransform = scale
        ? `translate(${dx / 2}px, ${midDy}px) scale(${midScale})`
        : `translate(${dx / 2}px, ${midDy}px)`;
      const animation = el.animate(
        [
          { transform: fromTransform, offset: 0 },
          { transform: midTransform, offset: 0.42 },
          { transform: "none", offset: 1 },
        ],
        { duration, easing, fill: "both" }
      );
      animation.onfinish = () => {
        el.style.transformOrigin = "";
      };
    });

    const main = document.querySelector("main");
    if (!main) return;
    main.getAnimations().forEach((animation) => animation.cancel());
    main.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 280, easing: "ease", fill: "both" });
  };

  const applyPage = (doc) => {
    const header = document.querySelector("header");
    const nextHeader = doc.querySelector("header");
    const main = document.querySelector("main");
    const nextMain = doc.querySelector("main");
    if (!header || !nextHeader || !main || !nextMain) return false;

    const fromBig = header.hasAttribute("data-big");
    const toBig = nextHeader.hasAttribute("data-big");
    if (toBig) header.setAttribute("data-big", "");
    else header.removeAttribute("data-big");

    const logo = header.querySelector(".logo");
    if (logo && (fromBig || toBig)) logo.style.height = "";

    if (nextMain.hasAttribute("data-nav")) main.setAttribute("data-nav", "");
    else main.removeAttribute("data-nav");
    main.innerHTML = nextMain.innerHTML;

    document.title = doc.title;
    if (typeof fitHeaderLogo === "function") fitHeaderLogo();
    window.scrollTo(0, 0);
    return true;
  };

  let requestId = 0;

  const go = async (url, push) => {
    const id = ++requestId;
    const fromHeight = document.querySelector("header").getBoundingClientRect().height;
    const parts = headerParts().map((part) => ({
      ...part,
      from: part.el.getBoundingClientRect(),
    }));
    const response = await fetch(url.href);
    if (id !== requestId) return;
    if (!response.ok) throw new Error(String(response.status));
    const doc = new DOMParser().parseFromString(await response.text(), "text/html");
    if (id !== requestId) return;
    if (!applyPage(doc)) throw new Error("missing layout");
    if (!reduced.matches) play(parts, fromHeight);
    if (push) history.pushState({ phl: true }, "", url.pathname + url.search + url.hash);
  };

  document.addEventListener("click", (event) => {
    if (typeof HTMLElement.prototype.animate !== "function") return;
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest("header a");
    if (!link || !link.href) return;
    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin) return;
    event.preventDefault();
    if (url.pathname === location.pathname && url.search === location.search) return;
    go(url, true).catch(() => location.assign(url.href));
  });

  window.addEventListener("popstate", () => {
    go(new URL(location.href), false).catch(() => location.reload());
  });
}
