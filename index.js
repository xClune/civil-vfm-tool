function validateInputs() {
  const chainageStart = parseFloat(
    document.getElementById("chainageStart").value
  );
  const chainageEnd = parseFloat(document.getElementById("chainageEnd").value);
  const roadWidth = parseFloat(document.getElementById("roadWidth").value);
  const patchCost = parseFloat(document.getElementById("patchCost").value);
  const altMethodCost = parseFloat(
    document.getElementById("altMethodCost").value
  );

  let errorMessage = "";

  // Validate chainage
  if (chainageStart >= chainageEnd) {
    errorMessage += "Chainage start must be less than chainage end.\n";
  }

  // Validate road width
  if (roadWidth <= 0) {
    errorMessage += "Road width must be greater than 0.\n";
  }

  // Validate costs
  if (patchCost <= 0) {
    errorMessage += "Patch repair cost must be greater than 0.\n";
  }
  if (altMethodCost <= 0) {
    errorMessage += "Alternative method cost must be greater than 0.\n";
  }

  if (errorMessage) {
    document.getElementById("errorMessage").textContent = errorMessage;
    return false; // Invalid input
  }

  document.getElementById("errorMessage").textContent = ""; // Clear any existing errors
  return true; // Valid input
}

function handleFile() {
  if (!validateInputs()) {
    return; // If inputs are invalid, stop processing
  }
  // triggered when spreadsheet file is uploaded

  const input = document.getElementById("inputFile");
  // selects the file input HTML element
  const file = input.files[0];
  // access the uploaded file (only one should have been uploaded)

  if (file) {
    const reader = new FileReader();
    // create a FileReader object (asynchronously) to read the file
    // (FileReader API is a built in web API available in modern browsers)

    // .onload triggered after the file has been successfully read
    reader.onload = function (e) {
      const data = new Uint8Array(e.target.result); // read file as an array of bytes
      const workbook = XLSX.read(data, { type: "array" }); // Use SheetJS (XLSX) to parse the data as an excel workbook
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]]; // Access the first sheet of the workbook

      // Convert the sheet data into JSON format
      const sheetData = XLSX.utils.sheet_to_json(firstSheet);

      processSpreadsheetData(sheetData); // Pass the parsed data to processSpreadsheetData()
    };
    reader.readAsArrayBuffer(file); // Read the file as an ArrayBuffer (binary data)
  }
}

function processSpreadsheetData(sheetData) {
  const chainageStart = parseFloat(
    document.getElementById("chainageStart").value
  );
  const chainageEnd = parseFloat(document.getElementById("chainageEnd").value);
  const road_length = chainageEnd - chainageStart;
  const width = parseFloat(document.getElementById("roadWidth").value); // Use the input width value
  let patches = [];
  let details = "";

  // Filter patches based on road chainage range
  sheetData.forEach((row) => {
    const patchStart = row["Patch Start Chainage"]; // Get user input for chainage start
    const patchEnd = patchStart + row["Patch Length"]; // Get user input for chainage end

    // Include patches that fall within the chainageStart and chainageEnd range
    if (
      patchStart >= chainageStart &&
      patchEnd <= chainageEnd &&
      row["Patch Length"] &&
      row["Patch Width"] &&
      row["Side"]
    ) {
      patches.push({
        startChainage: patchStart, //
        length: row["Patch Length"],
        width: row["Patch Width"],
        side: row["Side"], // "left", "right", or "center"
      });
      details += `Patch: Start Chainage = ${patchStart}, Length = ${row["Patch Length"]}, Width = ${row["Patch Width"]}, Side = ${row["Side"]}\n`;
    }
  });

  details += `\nRoad Chainage Start: ${chainageStart} meters\n`;
  details += `Road Chainage End: ${chainageEnd} meters\n`;
  details += `Calculated Road Length: ${road_length} meters\n`;
  details += `Road Width: ${width} meters\n`;

  // Show intermediate steps to the user
  document.getElementById("details").textContent = details;

  // Get user inputs for the alternative method name and costs
  const patchRepairCost = parseFloat(
    document.getElementById("patchCost").value
  );
  const altMethodName = document.getElementById("altMethodName").value;
  const altMethodCost = parseFloat(
    document.getElementById("altMethodCost").value
  );

  // Perform the comparison with dynamic costs and method name
  const result = compareTreatments(
    road_length,
    width,
    patches,
    patchRepairCost,
    altMethodCost,
    altMethodName
  );
  document.getElementById("result").textContent = result;

  // Draw the graphical representation
  drawRoadAndPatches(road_length, width, patches, altMethodName);
}

// Treatment comparison logic with dynamic costs and method names
function calculateUnboundCost(road_length, width, patches, patchRepairCost) {
  let totalCost = 0;
  let patchDetails = "";

  patches.forEach((patch) => {
    const patchArea = patch.length * patch.width;
    const patchCost = patchArea * patchRepairCost;
    totalCost += patchCost;
    patchDetails += `Patch area: ${patchArea} sqm, Treatment: Unbound Pavement (Rate: $${patchRepairCost}/sqm), Cost: $${patchCost.toFixed(
      2
    )}\n`;
  });

  patchDetails += `Total Unbound Pavement Cost: $${totalCost.toFixed(2)}\n\n`;
  return { totalCost, patchDetails };
}

function calculateAltMethodCost(patches, width, altMethodCost, altMethodName) {
  // Determine the start and end of the alternative treatment
  const firstPatchStart = Math.min(...patches.map((p) => p.startChainage));
  const lastPatchEnd = Math.max(
    ...patches.map((p) => p.startChainage + p.length)
  );
  // alt method will be from start of first patch to end of last patch.
  const altMethodLength = lastPatchEnd - firstPatchStart;
  const fullArea = altMethodLength * width;
  const totalCost = fullArea * altMethodCost;

  return {
    totalCost,
    details: `Full Road Area (From First to Last Patch): ${fullArea} sqm, Treatment: ${altMethodName} (Rate: $${altMethodCost}/sqm), Cost: $${totalCost.toFixed(
      2
    )}\n\n`,
  };
}

function compareTreatments(
  road_length,
  width,
  patches,
  patchRepairCost,
  altMethodCost,
  altMethodName
) {
  const { totalCost: unboundCost, patchDetails } = calculateUnboundCost(
    road_length,
    width,
    patches,
    patchRepairCost
  );
  const { totalCost: altMethodTotalCost, details: altMethodDetails } =
    calculateAltMethodCost(patches, width, altMethodCost, altMethodName);

  let result = patchDetails + altMethodDetails;

  if (altMethodTotalCost < unboundCost) {
    result += `${altMethodName} is cheaper: $${altMethodTotalCost.toFixed(
      2
    )} vs $${unboundCost.toFixed(2)}`;
  } else {
    result += `Unbound pavement is cheaper: $${unboundCost.toFixed(
      2
    )} vs $${altMethodTotalCost.toFixed(2)}`;
  }

  return result;
}

// Drawing the road and patches with the alternative method between the extents of the patches
function drawRoadAndPatches(road_length, width, patches, altMethodName) {
  // access the canvas HTML element
  const canvas = document.getElementById("roadCanvas");

  // set canvas context to display two dimensional graphics
  const ctx = canvas.getContext("2d");

  // scale from real world params to pixels
  const roadLengthInPixels = 900;
  const roadWidthInPixels = 100;
  const roadX = 50;
  const roadY = 150;

  // proportion the dimensions to the canvas using scaling factor
  const lengthScale = roadLengthInPixels / road_length;

  // Clear the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw the road as the base layer (entire road)
  ctx.fillStyle = "#EEEEEE"; // Gray for the entire road
  ctx.fillRect(
    roadX,
    roadY - roadWidthInPixels / 2,
    roadLengthInPixels,
    roadWidthInPixels
  );

  // Determine the extents of the alternative method (from the first to the last patch)
  const firstPatchStart = Math.min(...patches.map((p) => p.startChainage));
  const lastPatchEnd = Math.max(
    ...patches.map((p) => p.startChainage + p.length)
  );
  const altMethodStartPx = roadX + firstPatchStart * lengthScale;
  const altMethodLengthPx = (lastPatchEnd - firstPatchStart) * lengthScale;

  // Draw the alternative method full width between the first and last patches
  ctx.fillStyle = "#CCCCFF"; // Light blue for full-width alternative treatment
  ctx.fillRect(
    altMethodStartPx,
    roadY - roadWidthInPixels / 2,
    altMethodLengthPx,
    roadWidthInPixels
  );

  // Draw the patches (unbound pavement treatment) with chainage and side
  ctx.fillStyle = "#FF6666"; // Red for patches
  patches.forEach((patch) => {
    const patchStartPx = roadX + patch.startChainage * lengthScale;
    const patchLengthPx = patch.length * lengthScale;
    const patchWidthPx = (patch.width / width) * roadWidthInPixels;

    let patchY = roadY;

    // Position patch based on side of the road
    if (patch.side.toLowerCase() === "left") {
      patchY -= roadWidthInPixels / 2; // Left side
    } else if (patch.side.toLowerCase() === "right") {
      patchY += roadWidthInPixels / 2 - patchWidthPx; // Right side
    } else if (patch.side.toLowerCase() === "center") {
      patchY -= patchWidthPx / 2; // Center of the road
    }

    ctx.fillRect(patchStartPx, patchY, patchLengthPx, patchWidthPx);
  });

  // Add chainage labels along the bottom of the road
  ctx.fillStyle = "#000000"; // Set the text color to black
  ctx.font = "12px Arial"; // Set the font size and style

  const numberOfLabels = 5; // Number of chainage labels to display
  const chainageInterval = road_length / numberOfLabels; // Interval between each chainage label

  for (let i = 0; i <= numberOfLabels; i++) {
    const chainageValue = (chainageInterval * i).toFixed(0); // Calculate the chainage value
    const chainageX = roadX + chainageValue * lengthScale; // Scale the x-coordinate of the chainage label

    // Draw the chainage value
    ctx.fillText(
      `${chainageValue} m`,
      chainageX,
      roadY + roadWidthInPixels / 2 + 20
    ); // Adjust the y-coordinate below the road
  }

  // Add legend with color boxes
  ctx.fillStyle = "#000000"; // Black text
  ctx.font = "16px Arial";

  // Full-width treatment legend with color box
  ctx.fillStyle = "#CCCCFF"; // Light blue for full-width treatment
  ctx.fillRect(50, 30, 20, 20); // Color box for full-width treatment
  ctx.fillStyle = "#000000"; // Reset to black for text
  ctx.fillText(altMethodName, 80, 45); // Full-width treatment text

  // Patches treatment legend with color box
  ctx.fillStyle = "#FF6666"; // Red for patches
  ctx.fillRect(50, 60, 20, 20); // Color box for patches
  ctx.fillStyle = "#000000"; // Reset to black for text
  ctx.fillText("Patches (Unbound Pavement)", 80, 75); // Patches text
}
