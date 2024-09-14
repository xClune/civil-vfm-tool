// Example cost per unit area for each treatment type (you can adjust these values)
const COST_UNBOUND_PER_SQM = 110; // Cost for unbound pavement per square meter
const COST_STABILISATION_PER_SQM = 90; // Cost for stabilization per square meter

// Function to calculate the cost for the unbound pavement treatment (patches)
function calculateUnboundCost(chainage, width, patches) {
  let totalCost = 0;
  
  patches.forEach(patch => {
    const patchArea = patch.length * patch.width;
    totalCost += patchArea * COST_UNBOUND_PER_SQM * 2; // 2 layers
  });
  
  return totalCost;
}

// Function to calculate the cost for full-width treatment using stabilization
function calculateStabilisationCost(chainage, width) {
  const fullArea = chainage * width;
  return fullArea * COST_STABILISATION_PER_SQM;
}

// Function to compare both treatments and return which one is cheaper
function compareTreatments(chainage, width, patches) {
  const unboundCost = calculateUnboundCost(chainage, width, patches);
  const stabilisationCost = calculateStabilisationCost(chainage, width);
  
  if (stabilisationCost < unboundCost) {
    return `Stabilization is cheaper: $${stabilisationCost} vs $${unboundCost}`;
  } else {
    return `Unbound pavement is cheaper: $${unboundCost} vs $${stabilisationCost}`;
  }
}

// Example input
const chainage = 500; // Length of the road section in meters
const width = 10; // Full width of the road in meters

// Array of patches for the first treatment method (patch length and width)
const patches = [
  { length: 400, width: 5 },
  { length: 30, width: 3 },
  { length: 20, width: 4 }
];

// Compare both treatments
const result = compareTreatments(chainage, width, patches);
console.log(result);
