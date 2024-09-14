# civil-vfm-tool

tool for comparing road rehabilitation options given data on current damages (potholes, patches, full width, etc.)

User Inputs: Users upload an Excel file and specify chainage start, chainage end, road width, and treatment costs via input fields.

File Processing:
The file is processed using the FileReader API.

SheetJS converts the uploaded file into a JSON format.

Data Filtering: The data is filtered in processSpreadsheetData() to only include patches within the specified chainage range.

Cost Calculation: The app then compares the cost of patch repairs and the alternative full-width method via the compareTreatments() function.

Graphical Representation: The drawRoadAndPatches() function visually represents the road, patches, and alternative method on the canvas.
