let plotWidth = parseFloat(document.getElementById("plot-width-input").value);
let plotHeight = parseFloat(document.getElementById("plot-height-input").value);
let houseWidth = parseFloat(document.getElementById("house-width-input").value);
let houseHeight = parseFloat(
  document.getElementById("house-height-input").value
);
let scale = parseFloat(document.getElementById("scale-input").value);

let scene = new THREE.Scene();

// Use an orthographic camera for 2D view
const camera = new THREE.OrthographicCamera(
  window.innerWidth / -2,
  window.innerWidth / 2,
  window.innerHeight / 2,
  window.innerHeight / -2,
  1,
  1000
);

camera.position.z = 1; // Set the camera position

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

let plotWidthInPixels = plotWidth * scale; // Width of the plot in pixels
let plotHeightInPixels = plotHeight * scale; // Height of the plot in pixels

let plotGeometry = new THREE.PlaneGeometry(
  plotWidthInPixels,
  plotHeightInPixels
);
let plotMaterial = new THREE.MeshBasicMaterial({
  color: 0xffff00,
  side: THREE.DoubleSide,
});
let plot = new THREE.Mesh(plotGeometry, plotMaterial);

scene.add(plot);

let houseWidthInPixels = houseWidth * scale; // Width of the house in pixels
let houseHeightInPixels = houseHeight * scale; // Height of the house in pixels

let houseGeometry = new THREE.PlaneGeometry(
  houseWidthInPixels,
  houseHeightInPixels
);
let houseMaterial = new THREE.MeshBasicMaterial({
  color: 0xff0000,
  side: THREE.DoubleSide,
});

let house = new THREE.Mesh(houseGeometry, houseMaterial);
house.position.x =
  -plotWidthInPixels / 2 + houseWidthInPixels / 2 + 12.5 * scale;
house.position.y =
  -plotHeightInPixels / 2 + houseHeightInPixels / 2 + 12 * scale;

scene.add(house);

let garageWidth = parseFloat(
  document.getElementById("garage-width-input").value
);
let garageHeight = parseFloat(
  document.getElementById("garage-height-input").value
);

let garageWidthInPixels = garageWidth * scale;
let garageHeightInPixels = garageHeight * scale;

let garageGeometry = new THREE.PlaneGeometry(
  garageWidthInPixels,
  garageHeightInPixels
);
let garageMaterial = new THREE.MeshBasicMaterial({
  color: 0x0000ff,
  side: THREE.DoubleSide,
});
let garage = new THREE.Mesh(garageGeometry, garageMaterial);
garage.position.x =
  -plotWidthInPixels / 2 + garageWidthInPixels / 2 + 3.1 * scale;
garage.position.y =
  -plotHeightInPixels / 2 + garageHeightInPixels / 2 + 5 * scale;

scene.add(garage);

const mouse = new THREE.Vector2();
const raycaster = new THREE.Raycaster();

let isDragging = false;

function checkCollision(mesh1, mesh2) {
  const box1 = new THREE.Box3().setFromObject(mesh1);
  const box2 = new THREE.Box3().setFromObject(mesh2);
  return box1.intersectsBox(box2);
}

function getClosestEdgePoint(bounds, targetPosition) {
  const distances = bounds.map((b) => b.distanceTo(targetPosition));
  const minDistance = Math.min(...distances);
  return bounds[distances.indexOf(minDistance)];
}

function onMouseMove(event) {
  event.preventDefault();
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  if (isDragging) {
    let intersects = raycaster.intersectObject(plot);

    if (intersects.length > 0) {
      let proposedPosition = intersects[0].point;
      let objectWidthInPixels =
        selectedObject === house ? houseWidthInPixels : garageWidthInPixels;
      let objectHeightInPixels =
        selectedObject === house ? houseHeightInPixels : garageHeightInPixels;

      // Make sure that the selected object does not cross the plot boundaries
      let minX = -plotWidthInPixels / 2 + objectWidthInPixels / 2;
      let maxX = plotWidthInPixels / 2 - objectWidthInPixels / 2;
      let minY = -plotHeightInPixels / 2 + objectHeightInPixels / 2;
      let maxY = plotHeightInPixels / 2 - objectHeightInPixels / 2;

      if (proposedPosition.x < minX) proposedPosition.x = minX;
      if (proposedPosition.x > maxX) proposedPosition.x = maxX;
      if (proposedPosition.y < minY) proposedPosition.y = minY;
      if (proposedPosition.y > maxY) proposedPosition.y = maxY;

      selectedObject.position.copy(proposedPosition);
    }
  }
}

function onMouseDown(event) {
  event.preventDefault();
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  // Differentiate between house and garage
  let intersectsHouse = raycaster.intersectObject(house);
  let intersectsGarage = raycaster.intersectObject(garage);

  // Reset intersections
  intersects = [];

  if (intersectsHouse.length > 0) {
    intersects = intersectsHouse;
    selectedObject = house;
  } else if (intersectsGarage.length > 0) {
    intersects = intersectsGarage;
    selectedObject = garage;
  }

  if (intersects.length > 0) {
    isDragging = true;
  }
}

function onMouseUp(event) {
  isDragging = false;
}

renderer.domElement.addEventListener("mousemove", onMouseMove, false);
renderer.domElement.addEventListener("mousedown", onMouseDown, false);
renderer.domElement.addEventListener("mouseup", onMouseUp, false);

// draw distance lines
function addLine(from, to, color = 0x0000ff) {
  const material = new THREE.LineDashedMaterial({
    color,
    dashSize: 1,
    gapSize: 1,
  });

  const points = [];
  points.push(from, to);

  const geometry = new THREE.BufferGeometry().setFromPoints(points);

  const line = new THREE.Line(geometry, material);
  line.computeLineDistances();
  scene.add(line);
  return line;
}

const lines = [];
for (let i = 0; i < 4; i++) {
  lines.push(addLine(new THREE.Vector3(), new THREE.Vector3()));
}

const garageLines = [];
for (let i = 0; i < 4; i++) {
  garageLines.push(addLine(new THREE.Vector3(), new THREE.Vector3()));
}

function toScreenPosition(vector, camera) {
  // Make a copy of the vector
  var vec = vector.clone();

  // Project the vector to the camera
  vec.project(camera);

  // Convert the vector to screen coordinates
  vec.x = ((vec.x + 1) / 2) * window.innerWidth;
  vec.y = (-(vec.y - 1) / 2) * window.innerHeight;

  return vec;
}

function animate() {
  requestAnimationFrame(animate);

  // Update line positions for the house
  const houseBounds = [
    new THREE.Vector3(
      house.position.x - houseWidthInPixels / 2,
      house.position.y,
      0
    ), // left
    new THREE.Vector3(
      house.position.x + houseWidthInPixels / 2,
      house.position.y,
      0
    ), // right
    new THREE.Vector3(
      house.position.x,
      house.position.y - houseHeightInPixels / 2,
      0
    ), // bottom
    new THREE.Vector3(
      house.position.x,
      house.position.y + houseHeightInPixels / 2,
      0
    ), // top
  ];

  const plotBoundsHouse = [
    new THREE.Vector3(-plotWidthInPixels / 2, house.position.y, 0), // left
    new THREE.Vector3(plotWidthInPixels / 2, house.position.y, 0), // right
    new THREE.Vector3(house.position.x, -plotHeightInPixels / 2, 0), // bottom
    new THREE.Vector3(house.position.x, plotHeightInPixels / 2, 0), // top
  ];

  for (let i = 0; i < 4; i++) {
    const points = [houseBounds[i], plotBoundsHouse[i]];
    lines[i].geometry.setFromPoints(points);
    lines[i].geometry.verticesNeedUpdate = true;
    lines[i].computeLineDistances();
    const distance = houseBounds[i].distanceTo(plotBoundsHouse[i]) / scale;
    const label = document.getElementById(
      `label-${["left", "right", "bottom", "top"][i]}`
    );

    label.textContent = distance.toFixed(2);
    const midpoint = new THREE.Vector3().lerpVectors(
      houseBounds[i],
      plotBoundsHouse[i],
      0.5
    );
    const screenPosition = toScreenPosition(midpoint, camera);

    const left = screenPosition.x;
    const top = screenPosition.y;

    label.style.left = `${left}px`;
    label.style.top = `${top}px`;
  }

  // Update line positions for the garage
  const garageBounds = [
    new THREE.Vector3(
      garage.position.x - garageWidthInPixels / 2,
      garage.position.y,
      0
    ), // left
    new THREE.Vector3(
      garage.position.x + garageWidthInPixels / 2,
      garage.position.y,
      0
    ), // right
    new THREE.Vector3(
      garage.position.x,
      garage.position.y - garageHeightInPixels / 2,
      0
    ), // bottom
    new THREE.Vector3(
      garage.position.x,
      garage.position.y + garageHeightInPixels / 2,
      0
    ), // top
  ];

  const plotBoundsGarage = [
    new THREE.Vector3(-plotWidthInPixels / 2, garage.position.y, 0), // left
    new THREE.Vector3(plotWidthInPixels / 2, garage.position.y, 0), // right
    new THREE.Vector3(garage.position.x, -plotHeightInPixels / 2, 0), // bottom
    new THREE.Vector3(garage.position.x, plotHeightInPixels / 2, 0), // top
  ];

  for (let i = 0; i < 4; i++) {
    const points = [garageBounds[i], plotBoundsGarage[i]];
    garageLines[i].geometry.setFromPoints(points);
    garageLines[i].geometry.verticesNeedUpdate = true;
    garageLines[i].computeLineDistances();

    const distance = garageBounds[i].distanceTo(plotBoundsGarage[i]) / scale;
    const label = document.getElementById(
      `garage-label-${["left", "right", "bottom", "top"][i]}`
    );

    label.textContent = distance.toFixed(2);
    const midpoint = new THREE.Vector3().lerpVectors(
      garageBounds[i],
      plotBoundsGarage[i],
      0.5
    );
    const screenPosition = toScreenPosition(midpoint, camera);

    const left = screenPosition.x;
    const top = screenPosition.y;

    label.style.left = `${left}px`;
    label.style.top = `${top}px`;
  }

  renderer.render(scene, camera);
}

function updateScene() {
  plotWidth = parseFloat(document.getElementById("plot-width-input").value);
  plotHeight = parseFloat(document.getElementById("plot-height-input").value);
  houseWidth = parseFloat(document.getElementById("house-width-input").value);
  houseHeight = parseFloat(document.getElementById("house-height-input").value);
  scale = parseFloat(document.getElementById("scale-input").value);

  // Update existing elements based on new input values
  // Remove old plot and house
  scene.remove(plot);
  scene.remove(house);

  // Recreate plot and house with new dimensions
  plotWidthInPixels = plotWidth * scale; // Width of the plot in pixels
  plotHeightInPixels = plotHeight * scale; // Height of the plot in pixels
  plotGeometry = new THREE.PlaneGeometry(plotWidthInPixels, plotHeightInPixels);
  plot = new THREE.Mesh(plotGeometry, plotMaterial);
  scene.add(plot);

  houseWidthInPixels = houseWidth * scale; // Width of the house in pixels
  houseHeightInPixels = houseHeight * scale; // Height of the house in pixels
  houseGeometry = new THREE.PlaneGeometry(
    houseWidthInPixels,
    houseHeightInPixels
  );
  house = new THREE.Mesh(houseGeometry, houseMaterial);
  scene.add(house);

  garageWidth = parseFloat(document.getElementById("garage-width-input").value);
  garageHeight = parseFloat(
    document.getElementById("garage-height-input").value
  );

  // Remove old garage
  scene.remove(garage);

  // Recreate garage with new dimensions
  garageWidthInPixels = garageWidth * scale;
  garageHeightInPixels = garageHeight * scale;
  garageGeometry = new THREE.PlaneGeometry(
    garageWidthInPixels,
    garageHeightInPixels
  );
  garage = new THREE.Mesh(garageGeometry, garageMaterial);
  scene.add(garage);
}

document.getElementById("update-btn").addEventListener("click", updateScene);

animate();
