(function () {
  const DEFAULTS = {
    form: { value: "The Oath Ring", price: 420 },
    metal: { value: ".925 Sterling Silver", price: 0 },
    stone: { value: "Black Diamond", price: 0, color: "#090909" },
    engraving: "ACT I"
  };

  function initRitualBuilder() {
    const builder = document.querySelector(".sotp-ritual-builder");
    if (!builder || builder.dataset.ritualReady === "true") return;

    builder.dataset.ritualReady = "true";

    const engravingInput = builder.querySelector("#engravingInput");
    const builderSubmit = builder.querySelector("#builderSubmit");

    if (engravingInput && !engravingInput.value) {
      engravingInput.value = DEFAULTS.engraving;
    }

    builder.querySelectorAll(".option").forEach(option => {
      option.setAttribute("aria-pressed", option.classList.contains("active") ? "true" : "false");
    });

    builder.addEventListener("click", event => {
      const option = event.target.closest(".option");
      if (!option || !builder.contains(option)) return;

      const group = option.closest(".option-group");
      if (!group) return;

      group.querySelectorAll(".option").forEach(btn => {
        btn.classList.toggle("active", btn === option);
        btn.setAttribute("aria-pressed", btn === option ? "true" : "false");
      });

      updateBuilder(builder);
    });

    if (engravingInput) {
      engravingInput.addEventListener("input", () => {
        const cleanValue = engravingInput.value
          .toUpperCase()
          .replace(/[^A-Z0-9 /-]/g, "");

        if (engravingInput.value !== cleanValue) engravingInput.value = cleanValue;
        updateBuilder(builder);
      });
    }

    if (builderSubmit) {
      builderSubmit.addEventListener("click", () => {
        const item = getCurrentItem(builder);

        if (typeof window.addToCart === "function") {
          window.addToCart(item);
        } else {
          addItemToLocalCart(item);
        }

        const builderStatus = builder.querySelector("#builderStatus");
        if (builderStatus) {
          builderStatus.textContent = "Private commission saved.";
          window.clearTimeout(builderStatus.__timer);
          builderStatus.__timer = window.setTimeout(() => {
            builderStatus.textContent = "";
          }, 2200);
        }

        builderSubmit.textContent = "Commission Saved";
        window.setTimeout(() => {
          builderSubmit.textContent = "Request Private Commission";
        }, 1400);
      });
    }

    updateBuilder(builder);
  }

  function getBuilderState(builder) {
    const engravingInput = builder.querySelector("#engravingInput");

    return {
      form: readChoice(builder, "form", DEFAULTS.form),
      metal: readChoice(builder, "metal", DEFAULTS.metal),
      stone: readChoice(builder, "stone", DEFAULTS.stone),
      engraving: (engravingInput?.value || "").trim().toUpperCase() || "UNMARKED"
    };
  }

  function readChoice(builder, type, fallback) {
    const active = builder.querySelector(`.option-group[data-type="${type}"] .option.active`);
    if (!active) return { ...fallback };

    return {
      value: active.dataset.value || active.textContent.trim() || fallback.value,
      price: Number(active.dataset.price || 0),
      color: active.dataset.color || fallback.color
    };
  }

  function updateBuilder(builder) {
    const state = getBuilderState(builder);
    const summaryName = builder.querySelector("#summaryName");
    const summaryDetails = builder.querySelector("#summaryDetails");
    const summaryPrice = builder.querySelector("#summaryPrice");
    const stoneVisual = builder.querySelector("#stoneVisual");
    const ringVisual = builder.querySelector("#ringVisual");
    const total = state.form.price + state.metal.price + state.stone.price;
    const metalColor = getMetalColor(state.metal.value);

    if (summaryName) summaryName.textContent = state.form.value;
    if (summaryDetails) {
      summaryDetails.textContent = `${state.metal.value} - ${state.stone.value} - ${state.engraving}`;
    }
    if (summaryPrice) summaryPrice.textContent = `$${total.toLocaleString()} Estimated`;
    if (stoneVisual) stoneVisual.style.background = state.stone.color;

    if (ringVisual) {
      ringVisual.dataset.form = state.form.value;
      ringVisual.style.color = metalColor;
      ringVisual.style.borderColor = metalColor;
      ringVisual.setAttribute("aria-label", `${state.form.value} preview with ${state.stone.value}`);
    }
  }

  function getMetalColor(metalValue) {
    if (metalValue.includes("Oxidized")) return "#484640";
    if (metalValue.includes("Black Rhodium")) return "#101010";
    if (metalValue.includes("Gold")) return "#a88a3d";
    return "#c5c2ba";
  }

  function getCurrentItem(builder) {
    const state = getBuilderState(builder);
    const details = [
      state.metal.value,
      state.stone.value,
      state.engraving
    ].join(" / ");

    return {
      id: `custom-relic-${state.form.value}-${details}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),
      name: `${state.form.value} / ${details}`,
      price: state.form.price + state.metal.price + state.stone.price,
      img: "assets/BlackDiamond VVS 999.sterling silver.png",
      qty: 1
    };
  }

  function addItemToLocalCart(item) {
    const cart = JSON.parse(localStorage.getItem("stp_cart") || "[]");
    const existing = cart.find(entry => entry.id === item.id);

    if (existing) {
      existing.qty += 1;
    } else {
      cart.push(item);
    }

    localStorage.setItem("stp_cart", JSON.stringify(cart));
    if (typeof window.updateBadge === "function") window.updateBadge();
  }

  window.initRitualBuilder = initRitualBuilder;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initRitualBuilder);
  } else {
    initRitualBuilder();
  }

  document.addEventListener("swup:contentReplaced", initRitualBuilder);
})();
