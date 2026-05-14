const builderState = {
  form: {
    value: "The Oath Ring",
    price: 420
  },
  metal: {
    value: ".925 Sterling Silver",
    price: 0
  },
  stone: {
    value: "Black Diamond",
    price: 0,
    color: "#090909"
  },
  engraving: "ACT I"
};

const options = document.querySelectorAll(".option");
const engravingInput = document.getElementById("engravingInput");
const builderSubmit = document.getElementById("builderSubmit");

const summaryName = document.getElementById("summaryName");
const summaryDetails = document.getElementById("summaryDetails");
const summaryPrice = document.getElementById("summaryPrice");
const builderStatus = document.getElementById("builderStatus");
const stoneVisual = document.getElementById("stoneVisual");
const ringVisual = document.getElementById("ringVisual");

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
      color: option.dataset.color || builderState[type]?.color
    };

    updateBuilder();
  });
});

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

function updateBuilder() {
  if (!summaryName || !summaryDetails || !summaryPrice) return;

  const total =
    builderState.form.price +
    builderState.metal.price +
    builderState.stone.price;

  summaryName.textContent = builderState.form.value;
  summaryDetails.textContent = `${builderState.metal.value} - ${builderState.stone.value} - ${builderState.engraving}`;
  summaryPrice.textContent = `$${total.toLocaleString()} Estimated`;

  if (stoneVisual) stoneVisual.style.background = builderState.stone.color;
  if (ringVisual) {
    ringVisual.dataset.form = builderState.form.value;
    ringVisual.style.color = getMetalColor();
    ringVisual.style.borderColor = getMetalColor();
  }
}

function getMetalColor() {
  if (builderState.metal.value.includes("Oxidized")) return "#484640";
  if (builderState.metal.value.includes("Black Rhodium")) return "#101010";
  if (builderState.metal.value.includes("Gold")) return "#a88a3d";
  return "#c5c2ba";
}

function getCurrentItem() {
  const details = [
    builderState.metal.value,
    builderState.stone.value,
    builderState.engraving
  ].join(" / ");

  return {
    id: `custom-relic-${builderState.form.value}-${details}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, ""),
    name: `${builderState.form.value} / ${details}`,
    price: builderState.form.price + builderState.metal.price + builderState.stone.price,
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
