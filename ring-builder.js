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
    color: "#111111"
  },
  engraving: "ACT I"
};

const options = document.querySelectorAll(".option");
const engravingInput = document.getElementById("engravingInput");
const builderSubmit = document.getElementById("builderSubmit");

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
      color: option.dataset.color || builderState[type].color
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

  summaryName.textContent = builderState.form.value;
  summaryDetails.textContent =
    `${builderState.metal.value} - ${builderState.stone.value} - ${builderState.engraving}`;
  summaryPrice.textContent = `$${total.toLocaleString()} Estimated`;

  stoneVisual.style.background = builderState.stone.color;
  stoneVisual.style.color = builderState.stone.color;

  ringVisual.classList.toggle("form-vice", builderState.form.value.includes("Vice"));
  ringVisual.classList.toggle("form-signet", builderState.form.value.includes("Signet"));

  if (builderState.metal.value.includes("Oxidized")) {
    ringVisual.style.borderColor = "#4a4a4a";
  } else if (builderState.metal.value.includes("Black Rhodium")) {
    ringVisual.style.borderColor = "#111111";
  } else if (builderState.metal.value.includes("Gold")) {
    ringVisual.style.borderColor = "#b89b45";
  } else {
    ringVisual.style.borderColor = "#c7c7c7";
  }
}

function getTotal() {
  return builderState.form.price +
    builderState.metal.price +
    builderState.stone.price;
}

function getCurrentItem() {
  const name = `${builderState.form.value} / ${builderState.metal.value} / ${builderState.stone.value}`;

  return {
    id: `custom-ring-${builderState.form.value}-${builderState.metal.value}-${builderState.stone.value}-${builderState.engraving}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, ""),
    name: `${name} / ${builderState.engraving}`,
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
