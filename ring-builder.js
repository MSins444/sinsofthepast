import * as THREE from "./vendor/three.module.js";

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
const builderStatus = document.getElementById("builderStatus");
const ringStage = document.getElementById("ringStage");
const ringCanvas = document.getElementById("ringCanvas");

let scene;
let camera;
let renderer;
let ringGroup;
let currentDrag = null;
let targetRotation = { x: -0.34, y: 0.42 };

initRingScene();
bindBuilderControls();
updateBuilder();
animateRing();

function bindBuilderControls() {
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
}

function initRingScene() {
  if (!ringStage || !ringCanvas) return;

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
  camera.position.set(0, 0.35, 7.4);

  renderer = new THREE.WebGLRenderer({
    canvas: ringCanvas,
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: true
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  scene.add(new THREE.AmbientLight(0xf1f4f8, 1.15));

  const key = new THREE.DirectionalLight(0xffffff, 3.2);
  key.position.set(3.8, 4.2, 5.4);
  scene.add(key);

  const rim = new THREE.DirectionalLight(0x00e0c6, 1.4);
  rim.position.set(-4.5, 1.2, -3);
  scene.add(rim);

  const warm = new THREE.PointLight(0xff5a5a, 1.1, 9);
  warm.position.set(0, -3, 4);
  scene.add(warm);

  ringGroup = new THREE.Group();
  scene.add(ringGroup);

  ringStage.addEventListener("pointerdown", startDrag);
  window.addEventListener("pointermove", moveDrag);
  window.addEventListener("pointerup", stopDrag);
  window.addEventListener("resize", resizeRenderer);
  resizeRenderer();
  requestAnimationFrame(resizeRenderer);
  window.setTimeout(resizeRenderer, 250);
}

function rebuildRingScene() {
  if (!ringGroup) return;

  ringGroup.clear();

  const metalMaterial = makeMetalMaterial();
  const stoneMaterial = makeStoneMaterial();
  const scale = getFormScale();
  const tube = getBandTube();
  const band = new THREE.Mesh(
    new THREE.TorusGeometry(1.78, tube, 44, 128),
    metalMaterial
  );
  band.scale.set(scale.x, scale.y, scale.z);
  band.rotation.x = Math.PI / 2;
  ringGroup.add(band);

  if (builderState.form.value.includes("Seraph")) addSplitShoulders(metalMaterial);
  if (builderState.form.value.includes("Signet")) addSignetFace(metalMaterial);

  const stone = createStone(stoneMaterial);
  stone.position.set(0, 1.72, 0.22);
  ringGroup.add(stone);

  addSetting(stoneMaterial, metalMaterial);
  addAccents(metalMaterial, stoneMaterial);

  ringGroup.rotation.x = targetRotation.x;
  ringGroup.rotation.y = targetRotation.y;
}

function makeMetalMaterial() {
  const color = new THREE.Color(builderState.metal.metal || "#c7c7c7");
  const isDark = builderState.metal.value.includes("Black") || builderState.metal.value.includes("Oxidized");
  const roughness = builderState.finish.value.includes("High") ? 0.18 :
    builderState.finish.value.includes("Satin") ? 0.46 :
    builderState.finish.value.includes("Hammered") ? 0.36 :
    builderState.finish.value.includes("Antique") ? 0.58 : 0.24;

  return new THREE.MeshStandardMaterial({
    color,
    metalness: isDark ? 0.78 : 0.94,
    roughness,
    envMapIntensity: 1.3
  });
}

function makeStoneMaterial() {
  const color = new THREE.Color(builderState.stone.color || "#111111");
  const clearStone = builderState.stone.value.includes("VVS") || builderState.stone.value.includes("Opal");

  return new THREE.MeshPhysicalMaterial({
    color,
    metalness: 0,
    roughness: clearStone ? 0.04 : 0.18,
    transmission: clearStone ? 0.52 : 0.1,
    thickness: 0.8,
    ior: 1.9,
    clearcoat: 1,
    clearcoatRoughness: 0.05
  });
}

function getFormScale() {
  if (builderState.form.value.includes("Vice")) return { x: 1.12, y: 0.88, z: 1 };
  if (builderState.form.value.includes("Signet")) return { x: 1.2, y: 0.9, z: 1.06 };
  if (builderState.form.value.includes("Seraph")) return { x: 1.05, y: 0.94, z: 1 };
  if (builderState.form.value.includes("Cathedral")) return { x: 1, y: 1.06, z: 1 };
  return { x: 1, y: 1, z: 1 };
}

function getBandTube() {
  if (builderState.form.value.includes("Signet")) return 0.2;
  if (builderState.form.value.includes("Cathedral")) return 0.17;
  return 0.15;
}

function createStone(material) {
  if (builderState.stone.value.includes("Emerald")) {
    const emerald = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.5, 0.38, 3, 3, 3), material);
    emerald.rotation.set(0.2, 0.22, Math.PI / 4);
    return emerald;
  }

  if (builderState.stone.value.includes("Ruby") || builderState.stone.value.includes("Opal")) {
    const cab = new THREE.Mesh(new THREE.SphereGeometry(0.42, 42, 24), material);
    cab.scale.set(1, 0.68, 0.78);
    return cab;
  }

  const diamond = new THREE.Mesh(new THREE.OctahedronGeometry(0.48, 2), material);
  diamond.scale.set(1, 0.86, 1);
  diamond.rotation.set(0.2, 0.18, Math.PI / 4);
  return diamond;
}

function addSetting(stoneMaterial, metalMaterial) {
  if (builderState.setting.value.includes("Flush")) {
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.62, 0.16, 64), metalMaterial);
    cup.position.set(0, 1.56, 0.14);
    cup.rotation.x = Math.PI / 2;
    ringGroup.add(cup);
    return;
  }

  if (builderState.setting.value.includes("Bezel")) {
    const bezel = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.055, 18, 64), metalMaterial);
    bezel.position.set(0, 1.72, 0.22);
    bezel.rotation.x = Math.PI / 2;
    ringGroup.add(bezel);
    return;
  }

  if (builderState.setting.value.includes("Halo")) {
    for (let i = 0; i < 14; i++) {
      const gem = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 10), stoneMaterial);
      const angle = (i / 14) * Math.PI * 2;
      gem.position.set(Math.cos(angle) * 0.64, 1.72 + Math.sin(angle) * 0.45, 0.24);
      ringGroup.add(gem);
    }
  }

  if (builderState.setting.value.includes("Tension")) {
    addBar(-0.58, 1.72, 0.18, 0.18, 0.18, 0.72, metalMaterial);
    addBar(0.58, 1.72, 0.18, 0.18, 0.18, 0.72, metalMaterial);
    return;
  }

  for (let i = 0; i < 4; i++) {
    const prong = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.58, 12), metalMaterial);
    const angle = Math.PI / 4 + i * Math.PI / 2;
    prong.position.set(Math.cos(angle) * 0.34, 1.72 + Math.sin(angle) * 0.25, 0.2);
    prong.rotation.z = -angle * 0.35;
    ringGroup.add(prong);
  }
}

function addSplitShoulders(material) {
  addBar(-0.62, 1.12, 0.03, 0.12, 0.9, 0.16, material, -0.52);
  addBar(0.62, 1.12, 0.03, 0.12, 0.9, 0.16, material, 0.52);
}

function addSignetFace(material) {
  const face = new THREE.Mesh(new THREE.CylinderGeometry(0.82, 0.64, 0.3, 8), material);
  face.position.set(0, 1.56, 0.02);
  face.rotation.x = Math.PI / 2;
  face.rotation.z = Math.PI / 8;
  ringGroup.add(face);
}

function addAccents(metalMaterial, stoneMaterial) {
  if (builderState.accent.value.includes("Plain")) return;

  if (builderState.accent.value.includes("Relief")) {
    addBar(-0.98, 1.05, 0.2, 0.18, 0.18, 0.18, metalMaterial, 0.7);
    addBar(0.98, 1.05, 0.2, 0.18, 0.18, 0.18, metalMaterial, -0.7);
    return;
  }

  const count = builderState.accent.value.includes("Pave") ? 10 : 2;
  for (let i = 0; i < count; i++) {
    const side = count === 2 ? (i === 0 ? -1 : 1) : (i < 5 ? -1 : 1);
    const offset = count === 2 ? 0 : (i % 5 - 2) * 0.12;
    const gem = new THREE.Mesh(new THREE.SphereGeometry(0.06, 18, 12), stoneMaterial);
    gem.position.set(side * (0.82 + Math.abs(offset) * 0.25), 1.13 + offset, 0.18);
    ringGroup.add(gem);
  }
}

function addBar(x, y, z, sx, sy, sz, material, rz = 0) {
  const bar = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), material);
  bar.position.set(x, y, z);
  bar.rotation.z = rz;
  ringGroup.add(bar);
}

function updateBuilder() {
  if (!summaryName || !summaryDetails || !summaryPrice) return;

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

  rebuildRingScene();
}

function resizeRenderer() {
  if (!renderer || !ringStage || !camera) return;

  const rect = ringStage.getBoundingClientRect();
  const width = Math.max(1, rect.width);
  const height = Math.max(1, rect.height);
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function animateRing() {
  requestAnimationFrame(animateRing);
  if (!renderer || !scene || !camera || !ringGroup) return;

  if (!currentDrag) targetRotation.y += 0.004;
  ringGroup.rotation.x += (targetRotation.x - ringGroup.rotation.x) * 0.08;
  ringGroup.rotation.y += (targetRotation.y - ringGroup.rotation.y) * 0.08;
  renderer.render(scene, camera);
}

function startDrag(event) {
  currentDrag = {
    x: event.clientX,
    y: event.clientY,
    rotationX: targetRotation.x,
    rotationY: targetRotation.y
  };
  ringStage.setPointerCapture?.(event.pointerId);
}

function moveDrag(event) {
  if (!currentDrag) return;
  const dx = event.clientX - currentDrag.x;
  const dy = event.clientY - currentDrag.y;
  targetRotation.y = currentDrag.rotationY + dx * 0.01;
  targetRotation.x = Math.max(-1.05, Math.min(0.6, currentDrag.rotationX + dy * 0.01));
}

function stopDrag() {
  currentDrag = null;
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
