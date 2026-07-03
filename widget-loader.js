(function() {
  var currentScript = document.currentScript;
  if (!currentScript) return;

  var WIDGETS = {
    "wheel-fortune": {
      path: "gallery/widgets/wheel-fortune-widget.html",
      title: "Колесо фортуны"
    }
  };

  function attr(name, fallback) {
    var value = currentScript.getAttribute(name);
    return value === null || value === "" ? fallback : value;
  }

  function getBaseUrl() {
    var src = currentScript.src.split("?")[0];
    return src.slice(0, src.lastIndexOf("/") + 1);
  }

  function isMobile() {
    return window.matchMedia && window.matchMedia("(max-width: 767px)").matches;
  }

  function addParam(params, key, value) {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, value);
    }
  }

  var widgetId = attr("data-widget", "wheel-fortune");
  var widget = WIDGETS[widgetId];
  if (!widget) {
    console.warn("[widgets0] Unknown widget:", widgetId);
    return;
  }

  var params = new URLSearchParams();
  params.set("embed", "1");
  addParam(params, "source", attr("data-source", ""));
  addParam(params, "webhookUrl", attr("data-webhook-url", ""));
  addParam(params, "webhookSecret", attr("data-webhook-secret", ""));
  addParam(params, "delay", attr("data-delay", ""));
  addParam(params, "frequency", attr("data-frequency", ""));
  addParam(params, "position", attr("data-position", ""));
  addParam(params, "pageUrl", window.location.href.split("#")[0]);

  var zIndex = attr("data-z-index", "2147483000");
  var dimColor = attr("data-dim-color", "rgba(0, 0, 0, 0.48)");

  var layer = document.createElement("div");
  layer.setAttribute("data-widgets0-layer", widgetId);
  layer.style.position = "fixed";
  layer.style.inset = "0";
  layer.style.zIndex = zIndex;
  layer.style.pointerEvents = "none";
  layer.style.opacity = "0";
  layer.style.transition = "opacity 240ms ease";

  var backdrop = document.createElement("div");
  backdrop.style.position = "absolute";
  backdrop.style.inset = "0";
  backdrop.style.background = dimColor;
  backdrop.style.backdropFilter = "blur(2px)";
  backdrop.style.webkitBackdropFilter = "blur(2px)";
  backdrop.style.pointerEvents = "auto";

  var iframe = document.createElement("iframe");
  iframe.src = getBaseUrl() + widget.path + "?" + params.toString();
  iframe.title = widget.title;
  iframe.loading = "eager";
  iframe.setAttribute("allow", "clipboard-write");
  iframe.setAttribute("scrolling", "no");
  iframe.setAttribute("allowtransparency", "true");

  iframe.style.position = "absolute";
  iframe.style.inset = "0";
  iframe.style.width = "100%";
  iframe.style.height = "100%";
  iframe.style.border = "0";
  iframe.style.background = "transparent";
  iframe.style.colorScheme = "normal";
  iframe.style.pointerEvents = "none";

  layer.appendChild(backdrop);
  layer.appendChild(iframe);

  function activateLayer() {
    layer.style.pointerEvents = "auto";
    layer.style.opacity = "1";
    iframe.style.pointerEvents = "auto";
  }

  function removeLayer() {
    layer.style.opacity = "0";
    layer.style.pointerEvents = "none";
    iframe.style.pointerEvents = "none";
    window.setTimeout(function() {
      if (layer.parentNode) layer.parentNode.removeChild(layer);
    }, 260);
  }

  function mount() {
    if (document.body) {
      document.body.appendChild(layer);
      return;
    }
    window.requestAnimationFrame(mount);
  }

  window.addEventListener("message", function(event) {
    if (event.source !== iframe.contentWindow) return;
    if (event.data && event.data.type === "widgets0:open") activateLayer();
    if (!event.data || event.data.type !== "widgets0:close") return;
    removeLayer();
  });

  mount();
})();
