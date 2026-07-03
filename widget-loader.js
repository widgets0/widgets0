(function() {
  var currentScript = document.currentScript;
  if (!currentScript) return;

  var WIDGETS = {
    "wheel-fortune": {
      path: "gallery/widgets/wheel-fortune-widget.html",
      title: "Колесо фортуны",
      desktopWidth: "960px",
      desktopHeight: "620px",
      mobileWidth: "100vw",
      mobileHeight: "100dvh"
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

  var iframe = document.createElement("iframe");
  iframe.src = getBaseUrl() + widget.path + "?" + params.toString();
  iframe.title = widget.title;
  iframe.loading = "eager";
  iframe.setAttribute("allow", "clipboard-write");
  iframe.setAttribute("scrolling", "no");

  var mobile = isMobile();
  var position = attr("data-position", "center");
  var width = mobile ? widget.mobileWidth : attr("data-width", widget.desktopWidth);
  var height = mobile ? widget.mobileHeight : attr("data-height", widget.desktopHeight);

  iframe.style.position = "fixed";
  iframe.style.zIndex = attr("data-z-index", "2147483000");
  iframe.style.width = width;
  iframe.style.height = height;
  iframe.style.border = "0";
  iframe.style.background = "transparent";
  iframe.style.colorScheme = "normal";

  if (mobile) {
    iframe.style.inset = "0";
  } else if (position === "bottom-left") {
    iframe.style.left = "24px";
    iframe.style.bottom = "24px";
  } else if (position === "bottom-right") {
    iframe.style.right = "24px";
    iframe.style.bottom = "24px";
  } else {
    iframe.style.left = "50%";
    iframe.style.top = "50%";
    iframe.style.transform = "translate(-50%, -50%)";
  }

  function mount() {
    if (document.body) {
      document.body.appendChild(iframe);
      return;
    }
    window.requestAnimationFrame(mount);
  }

  window.addEventListener("message", function(event) {
    if (event.source !== iframe.contentWindow) return;
    if (!event.data || event.data.type !== "widgets0:close") return;
    if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
  });

  mount();
})();
