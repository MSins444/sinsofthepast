const builderState = {
  tier: { value: "Archive Commission", price: 0 },
  form: { value: "The Oath Ring", price: 420 },
  metal: { value: ".925 Sterling Silver", price: 0, metal: "#c7c7c7" },
  finish: { value: "High Polish", price: 0 },
  stone: { value: "Black Diamond", price: 180, color: "#111111" },
  setting: { value: "Cathedral Claw", price: 350 },
  accent: { value: "Plain Shoulders", price: 0 },
  presentation: { value: "Black Archive Box", price: 0 },
  size: "Size 7",
  engraving: "ACT I"
};

const options = document.querySelectorAll(".option");
const engravingInput = document.getElementById("engravingInput");
const ringSizeInput = document.getElementById("ringSizeInput");
const builderSubmit = document.getElementById("builderSubmit");

const summaryTier = document.getElementById("summaryTier");
const summaryName = document.getElementById("summaryName");
const summaryDetails = document.getElementById("summaryDetails");
const summaryPrice = document.getElementById("summaryPrice");
const stoneVisual = document.getElementById("stoneVisual");
const ringVisual = document.getElementById("ringVisual");
const builderStatus = document.getElementById("builderStatus");

options.forEach(option => {
  option.setAttribute("aria-pressed", option.classList.contains("active") ? "true" : "false");

  option.addEventListener("click", () => {
    const group = option.closest(".option-group");
    const type = group.dataset.type;

    group.querySelectorAll(".option").forEach(btn => {
      btn.classList.remove("active");
      btn.setAttribute("aria-pressed", "false");
    });

    option.classList.add("active");
    option.setAttribute("aria-pressed", "true");

    builderState[type] = {
      value: option.dataset.value,
      price: Number(option.dataset.price || 0),
      color: option.dataset.color || builderState[type].color,
      metal: option.dataset.metal || builderState[type].metal
    };

    updateBuilder();
  });
});

if (ringSizeInput) {
  ringSizeInput.addEventListener("change", () => {
    builderState.size = ringSizeInput.value;
    updateBuilder();
  });
}

if (engravingInput) {
  engravingInput.value = builderState.engraving;
  engravingInput.addEventListener("input", () => {
    const cleanValue = engravingInput.value
      .toUpperCase()
      .replace(/[^A-Z0-9 /-]/g, "");

    if (engravingInput.value !== cleanValue) engravingInput.value = cleanValue;

    builderState.engraving = cleanValue.trim() || "UNMARKED";
    updateBuilder();
  });
}

if (builderSubmit) {
  builderSubmit.addEventListener("click", () => {
    const item = getCurrentItem();

    if (typeof window.addToCart === "function") {
      window.addToCart(item);
    } else {
      addItemToLocalCart(item);
    }

    if (builderStatus) {
      builderStatus.textContent = "Added to bag - private quote saved.";
      window.clearTimeout(builderStatus.__timer);
      builderStatus.__timer = window.setTimeout(() => {
        builderStatus.textContent = "";
      }, 2200);
    }

    builderSubmit.textContent = "Added to Bag";
    window.setTimeout(() => {
      builderSubmit.textContent = "Add Custom Relic to Bag";
    }, 1200);
  });
}

function updateBuilder() {
  if (!summaryName || !summaryDetails || !summaryPrice || !stoneVisual || !ringVisual) return;

  const total = getTotal();

  if (summaryTier) summaryTier.textContent = builderState.tier.value;
  summaryName.textContent = builderState.form.value;
  summaryDetails.textContent = [
    builderState.metal.value,
    builderState.finish.value,
    builderState.stone.value,
    builderState.setting.value,
    builderState.accent.value,
    builderState.size,
    builderState.engraving
  ].join(" - ");
  summaryPrice.textContent = `$${total.toLocaleString()} Estimated`;

  stoneVisual.style.background = builderState.stone.color;
  stoneVisual.style.color = builderState.stone.color;
  ringVisual.style.borderColor = builderState.metal.metal || "#c7c7c7";

  setVisualClasses();
}

function setVisualClasses() {
  const visualFlags = [
    "form-vice",
    "form-signet",
    "form-seraph",
    "form-cathedral",
    "finish-satin",
    "finish-antique",
    "finish-hammered",
    "finish-ice",
    "setting-flush",
    "setting-bezel",
    "setting-halo",
    "setting-tension",
    "accent-gems",
    "accent-relief"
  ];

  ringVisual.classList.remove(...visualFlags);
  ringVisual.classList.toggle("form-vice", builderState.form.value.includes("Vice"));
  ringVisual.classList.toggle("form-signet", builderState.form.value.includes("Signet"));
  ringVisual.classList.toggle("form-seraph", builderState.form.value.includes("Seraph"));
  ringVisual.classList.toggle("form-cathedral", builderState.form.value.includes("Cathedral"));
  ringVisual.classList.toggle("finish-satin", builderState.finish.value.includes("Satin"));
  ringVisual.classList.toggle("finish-antique", builderState.finish.value.includes("Antique"));
  ringVisual.classList.toggle("finish-hammered", builderState.finish.value.includes("Hammered"));
  ringVisual.classList.toggle("finish-ice", builderState.finish.value.includes("Ice"));
  ringVisual.classList.toggle("setting-flush", builderState.setting.value.includes("Flush"));
  ringVisual.classList.toggle("setting-bezel", builderState.setting.value.includes("Bezel"));
  ringVisual.classList.toggle("setting-halo", builderState.setting.value.includes("Halo"));
  ringVisual.classList.toggle("setting-tension", builderState.setting.value.includes("Tension"));
  ringVisual.classList.toggle("accent-gems", builderState.accent.value.includes("Diamond") || builderState.accent.value.includes("Ruby"));
  ringVisual.classList.toggle("accent-relief", builderState.accent.value.includes("Relief"));
}

function getTotal() {
  return [
    builderState.tier,
    builderState.form,
    builderState.metal,
    builderState.finish,
    builderState.stone,
    builderState.setting,
    builderState.accent,
    builderState.presentation
  ].reduce((total, choice) => total + Number(choice.price || 0), 0);
}

function getCurrentItem() {
  const name = `${builderState.tier.value} / ${builderState.form.value}`;
  const details = [
    builderState.metal.value,
    builderState.finish.value,
    builderState.stone.value,
    builderState.setting.value,
    builderState.accent.value,
    builderState.size,
    builderState.presentation.value,
    builderState.engraving
  ].join(" / ");

  return {
    id: `custom-ring-${name}-${details}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, ""),
    name: `${name} / ${details}`,
    price: getTotal(),
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

updateBuilder();
