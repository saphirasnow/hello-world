const gramsPerTon = 1000000;
const milesPerKm = 0.621371;
const kmPerMile = (1 / milesPerKm);
const maxEmissions = 20.0; // Max Emissions in Tons per Year used for all graphs
const foodColorMap = {
    "Meat" : "#810707",
    "Nut" : "#dfbc23",
    "Dairy" : "rgba(56,157,252,0.74)",
    "Grain" : "#a48f11",
    "Snack" : "#c35e5e",
    "Vegetable" : "#54982b"
}

const transportColorMap = {
    "Flight" : "#16c8e2",
    "Bus" : "#27a586",
    "Train" : "#726bdb",
    "Car" : "#b31df0"
}

const houseAndWasteColorMap = {
    "Waste" : "#b31faa",
    "Direct House" : "rgba(220,77,58,0.94)",
    "Indirect House" : "#a5d37f"
}

/* Based on Jones and Kammen at
   http://carbon-calc.erg.berkeley.edu/carbon_calc.bak/ltcalc/data_and_calculations.pdf,
   we know the following on average:
        - Meat, fish, and eggs (4.52 grams of C02 per calorie)
        - Nuts (7.39 grams of C02 per calorie)
        - Dairy (4.66 grams of C02 per calorie)
        - Grains (1.47 grams of C02 per calorie)
        - Fruits and Vegetables (3.03 grams of C02 per calorie)
        - Snacks, drinks, etc. (3.73 grams of C02 per calorie)
   According to https://www.ers.usda.gov/amber-waves/2016/december/a-look-at-calorie-sources-in-the-american-diet
   we get that the breakdown of the average American diet is roughly:
        - 440 calories Meat
        - 60 calories Nuts
        - 250 calories Dairy
        - 600 calories Grains
        - 200 calories Fruits and Vegetables
        - 900 calories (Added plant based oils and sugars which go into the Snack category from above)
 */
function calcFood(vegetableFruitPercent, meatPercent, dairyPercent,
                  nutsPercent, snackPercent, grainPercent, caloriesPerDay) {
    let totalPercent = vegetableFruitPercent + grainPercent + nutsPercent +
                       snackPercent + meatPercent + dairyPercent;
    let vegetableFruitCaloriesPerDay = (vegetableFruitPercent / totalPercent) * caloriesPerDay;
    let meatCaloriesPerDay = (meatPercent / totalPercent) * caloriesPerDay;
    let dairyCaloriesPerDay = (dairyPercent / totalPercent) * caloriesPerDay;
    let grainCaloriesPerDay = (grainPercent / totalPercent) * caloriesPerDay;
    let nutsCaloriesPerDay = (nutsPercent / totalPercent) * caloriesPerDay;
    let snackCaloriesPerDay = (snackPercent / totalPercent) * caloriesPerDay;
    let meatTonsPerYear = (meatCaloriesPerDay * 4.52 * 365) / gramsPerTon;
    let nutTonsPerYear = (nutsCaloriesPerDay * 7.39 * 365) / gramsPerTon;
    let dairyTonsPerYear = (dairyCaloriesPerDay * 4.66 * 365) / gramsPerTon;
    let grainTonsPerYear = (grainCaloriesPerDay * 1.47 * 365) / gramsPerTon;
    let vegetableTonsPerYear = (vegetableFruitCaloriesPerDay * 3.03 * 365) / gramsPerTon;
    let snackTonsPerYear = (snackCaloriesPerDay * 3.73 * 365) / gramsPerTon;
    let result = {};
    result["Meat"] = meatTonsPerYear;
    result["Nut"] = nutTonsPerYear;
    result["Dairy"] = dairyTonsPerYear;
    result["Grain"] = grainTonsPerYear;
    result["Snack"] = snackTonsPerYear;
    result["Vegetable"] = vegetableTonsPerYear;
    return result;
}

/* Based on https://assets.publishing.service.gov.uk/government/uploads/system/uploads/attachment_data/file/904215/2019-ghg-conversion-factors-methodology-v01-02.pdf
   we know that:
    - Airplane: 94.9 gC02 per km (international flight)
    - Bus: 103.91 gC02e per passenger km
    - Train: 34.80 gC02e per passenger km
   Also based on https://www.epa.gov/greenvehicles/greenhouse-gas-emissions-typical-passenger-vehicle#:~:text=typical%20passenger%20vehicle%3F-,A%20typical%20passenger%20vehicle%20emits%20about%204.6%20metric%20tons%20of,8%2C887%20grams%20of%20CO2
   we know that 8,887 grams CO2 emitted / gallon driven
 */
function calcTransportationCost(flightsPerYear, busMilesPerDay,
                                trainMilesPerDay, carMilesPerDay,
                                carMilesPerGallon) {
    let averageFlightDistanceMiles = 3000; // 3000 miles being the medium haul flight limit based on https://en.wikipedia.org/wiki/Flight_length
    let flightTonsPerYear = (flightsPerYear * averageFlightDistanceMiles * kmPerMile * 94.9) / gramsPerTon;
    let busTonsPerYear = (((busMilesPerDay * 365) / milesPerKm) * 103.91) / gramsPerTon;
    let trainTonsPerYear = (((trainMilesPerDay * 365) / milesPerKm) * 34.8) / gramsPerTon;
    let carTonsPerYear = (((carMilesPerDay * 365) / carMilesPerGallon) * 8887) / gramsPerTon;
    let result = {};
    result["Flight"] = flightTonsPerYear;
    result["Bus"] = busTonsPerYear;
    result["Train"] = trainTonsPerYear;
    result["Car"] = carTonsPerYear;
    return result;
}

function directHouseEms(dollars) {
  const emFactor = 682; // g/$
  return dollars * emFactor;
}

function indirectHouseEms(state) { //NOTE: a little inefficient
  let consumptions = {"Connecticut": 689, "Maine": 562, "Massachusetts": 574,
  "New Hampshire": 599, "Rhode Island": 560, "Vermont": 549, "New Jersey": 663,
  "New York": 577, "Pennsylvania": 837, "Illinois": 709, "Indiana": 960,
  "Michigan": 637, "Ohio": 874, "Wisconsin": 674, "Iowa": 867, "Kansas": 891,
  "Minnesota": 759, "Missouri": 1058, "Nebraska": 1004, "North Dakota": 1109,
  "South Dakota": 1044, "Delaware": 950, "District of Columbia": 752,
  "Florida": 1108, "Georgia": 1121, "Maryland": 975, "North Carolina": 1079,
  "South Carolina": 1114, "Virginia": 1122, "West Virginia": 1084,
  "Alabama": 1201, "Kentucky": 1112, "Mississippi": 1206, "Tennessee": 1217,
  "Arkansas": 1118, "Louisiana": 1232, "Oklahoma": 1116, "Texas": 1140,
  "Arizona": 1014, "Colorado": 682, "Idaho": 949, "Montana": 857,
  "Nevada": 890, "New Mexico": 640, "Utah": 727, "Wyoming": 864,
  "California": 532, "Oregon": 911, "Washington": 973, "Alaska": 555,
  "Hawaii": 525, "United States": 887};
  let impacts = {"Alaska": 1375.109, "Alabama": 1284.902, "Arkansas": 1569.596,
  "Arizona": 1426.414, "California": 828.446, "Colorado": 1758.347,
  "Connecticut": 840.995, "District of Columbia": 840.310, "Delaware": 719.562,
  "Florida": 1014.673, "Georgia": 1265.963, "Hawaii": 1720.079,
  "Iowa": 1781.354, "Idaho": 800.591, "Illinois": 1886.206,
  "Indiana": 1750.667, "Kansas": 2219.947, "Kentucky": 1893.401,
  "Louisiana": 977.082, "Massachusetts": 963.737, "Maryland": 1376.112,
  "Maine": 498.952, "Michigan": 1538.390, "Minnesota": 1634.383,
  "Missouri": 1974.734, "Mississippi": 1011.486, "Montana": 2280.744,
  "North Carolina": 1361.928, "North Dakota": 2226.141, "Nebraska": 2169.050,
  "New Hampshire": 884.163, "New Jersey": 895.225, "New Mexico": 1748.001,
  "Nevada": 1031.220, "New York": 967.731, "Ohio": 1486.322,
  "Oklahoma": 1195.231, "Oregon": 1011.478, "Pennsylvania": 1245.582,
  "Rhode Island": 882.900, "South Carolina": 1314.195,
  "South Dakota": 1878.510, "Tennessee": 1581.154, "Texas": 1252.145,
  "Utah": 1793.493, "Virginia": 933.325, "Vermont": 274.245,
  "Washington": 1281.442, "Wisconsin": 1612.155, "West Virginia": 2052.382,
  "Wyoming": 2368.877, "United States": 1381.591};
  consumptions[state] = consumptions[state] * 12.0 / 1000.0;
  console.log("consumption: " + consumptions[state] + "MWh/year");
  impacts[state] = impacts[state] * consumptions[state] / 2204.62 * 1000000; // conversion to metric ton
  return impacts[state];
}

function wasteEms(recycled, dollars) { // how much recycled in TONS, need amount spent on waste
  const emFactor = 4121.0;
  const totalWasteEms = dollars * emFactor; // amount spent on waste
  const saveConst = 1308.6; // kg/ton RECYCLED
  const savings = recycled * saveConst;
  return totalWasteEms - savings;
}

function calcHouseAndWaste(house1, house2, waste1, waste2) {
    let waste = wasteEms(waste1, waste2);
    let directHouse = directHouseEms(house1);
    let indirectHouse = indirectHouseEms(house2);
    let result = {};
    result["Waste"] = waste / gramsPerTon;
    result["Direct House"] = directHouse / gramsPerTon;
    result["Indirect House"] = indirectHouse / gramsPerTon;
    return result;
}

let firstTimeTransport = true;
function drawTransport(canvas, transportArray) {
    let startX = 0;
    let startY = (canvas.height / 2) - 10;
    let rectHeight = 140;
    let rightMargin = 40;
    let maxWidth = canvas.width - rightMargin;
    let maxValue = maxEmissions;
    drawHorizBar(canvas, transportArray, transportColorMap, startX, startY, rectHeight, maxWidth, maxValue);
    if (firstTimeTransport) {
        drawAxis1(canvas, maxWidth);
        drawLegend1(canvas, transportColorMap);
        firstTimeTransport = false;
    }
    return;
}


let firstTimeHouse = true;
function drawHouseAndWaste(canvas, houseAndWasteArray) {
    let startX = 0;
    let startY = (canvas.height / 2) - 10;
    let rectHeight = 140;
    let rightMargin = 40;
    let maxWidth = canvas.width - rightMargin;
    let maxValue = maxEmissions;
    drawHorizBar(canvas, houseAndWasteArray, houseAndWasteColorMap, startX, startY, rectHeight, maxWidth, maxValue);
    if (firstTimeHouse) {
        drawAxis1(canvas, maxWidth);
        drawLegend1(canvas, houseAndWasteColorMap);
        firstTimeHouse = false;
    }
    return;
}

let firstTimeFood = true;
function drawFood(canvas, foodArray) {
    let startX = 0;
    let startY = (canvas.height / 2) - 10;
    let rectHeight = 140;
    let rightMargin = 40;
    let maxWidth = canvas.width - rightMargin;
    let maxValue = maxEmissions;
    drawHorizBar(canvas, foodArray, foodColorMap, startX, startY, rectHeight, maxWidth, maxValue);
    if (firstTimeFood) {
        drawAxis1(canvas, maxWidth);
        drawLegend1(canvas, foodColorMap);
        firstTimeFood = false;
    }
    return;
}

function drawHorizBar(canvas, values, colors, startX, startY, rectHeight, maxWidth, maxValue) {
    let cxt = canvas.getContext('2d');
    let curX = startX;
    let curSum = 0;
    cxt.fillStyle = "#ffffff";
    cxt.fillRect(curX + 1, startY - 20, canvas.width, rectHeight + 20);
    for (let key in values) {
        let emissionAmount = values[key];
        let color = colors[key];
        let rectWidth = (emissionAmount * maxWidth) / maxValue;
        cxt.fillStyle = color;
        cxt.fillRect(curX, startY, rectWidth, rectHeight);
        curX += rectWidth;
        curSum += emissionAmount;
        cxt.fillStyle = "#000000";
        cxt.font = '12px Arial';
        cxt.fillText(curSum.toFixed(1), curX - 10, startY - 5);
    }
}

function sumArray(arr) {
    let sum = 0;
    for (let i = 0; i < arr.length; i++) {
        sum += arr[i];
    }
    return sum;
}

function drawVertBar(canvas, values, colors, startX, startY, rectWidth, maxHeight, maxValue) {
    let cxt = canvas.getContext('2d');
    let buffer = 20;
    cxt.fillStyle = "#ffffff";
    cxt.fillRect(startX - buffer, startY - canvas.height - 2, rectWidth + buffer, canvas.height);
    let curY = startY;
    let curSum = 0;
    for (let key in values) {
        let emissionAmount = values[key];
        let color = colors[key];
        let rectHeight = (emissionAmount * maxHeight) / maxValue;
        cxt.fillStyle = color;
        cxt.fillRect(startX, curY - rectHeight, rectWidth, rectHeight);
        curY -= rectHeight;
        curSum += emissionAmount;
        cxt.fillStyle = "#000000";
        cxt.font = '12px Arial';
        cxt.fillText(curSum.toFixed(1), startX - buffer, curY);
    }
}

const drawLine1 = function (ctx, x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.closePath();
    ctx.stroke();
}

function drawAxis1(canvas, maxWidth) {
    let ctx = canvas.getContext('2d');
    let height = canvas.height;
    let curY = height - 40;
    ctx.strokeStyle = "#080808";
    ctx.lineWidth = 0.8;
    drawLine1(ctx, 0, curY, maxWidth, curY);
    drawLine1(ctx, 0, height - 40, 0, 20);
    ctx.fillStyle = "#080707";
    ctx.font = '18px Arial';
    ctx.fillText(maxEmissions.toFixed(1), maxWidth + 5, curY + 5);
    ctx.fillText("C02 Emissions (Tons per year)", maxWidth / 2 - 110, curY + 30);
}

function drawLegend1(canvas, colorMap) {
    let ctx = canvas.getContext('2d');
    let curX = 50
    let curY = 140
    for (let key in colorMap) {
        ctx.fillStyle = colorMap[key];
        ctx.fillRect(curX, curY, 20, 20);
        ctx.fillStyle = "#000000";
        ctx.font = '14px Arial';
        ctx.fillText(key, curX + 25, curY + 15);
        // Thank you to https://stackoverflow.com/questions/20912889/size-of-character-in-pixels/20915304
        // for code to find length of a string in pixels as it will be rendered on the canvas
        let wordLen = ctx.measureText(key).width;
        curX += 35 + wordLen;
    }
    return;
}

let firstTimeBarChart = true;
function drawBarChart(canvas, transportArray, houseAndWasteArray, foodArray) {

    const width = canvas.width;
    const height = canvas.height;
    const leftMargin = 60;
    const rightMargin = 60;
    const topMargin = 60;
    const botMargin = 50;
    const graphWidth = width - (leftMargin + rightMargin);
    const graphHeight = height - (topMargin + botMargin);
    const ctx = canvas.getContext('2d');

    const drawLine = function (x1, y1, x2, y2) {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.closePath();
        ctx.stroke();
    }

    const drawAxis2 = function() {
        ctx.strokeStyle = "#080808";
        ctx.lineWidth = 0.8;
        drawLine(leftMargin, topMargin, leftMargin, height - botMargin);
        drawLine(leftMargin, height - botMargin, width - rightMargin, height - botMargin);
        ctx.fillStyle = "#080707";
        ctx.font = '18px Arial';
        ctx.fillText("" + maxEmissions.toFixed(1), leftMargin - (width / 60), topMargin - (width / 60));
    }

    const drawTitles2 = function() {
        let offset = 110;
        ctx.fillStyle = "#0a0707";
        ctx.font = '18px Arial';
        // Thanks to Bella for showing me how to make the y-axis label align properly
        ctx.save()
        ctx.translate(graphHeight * 0.5 / 13, graphWidth * 20 / 52);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText("C02 Emissions (Tons per year)", 0, 0);
        ctx.restore();
    }

    const drawLegends2 = function() {
        const horizBuffer = 165;
        const spaceX = (graphWidth - (2 * 165)) / (3-1);

        let curX = horizBuffer + leftMargin - 110;
        let curY = height - botMargin - 80;
        for (let key in transportColorMap) {
            ctx.fillStyle = transportColorMap[key];
            ctx.fillRect(curX, curY, 10, 10);
            ctx.fillStyle = "#000000";
            ctx.font = '14px Arial';
            ctx.fillText(key, curX + 18, curY + 10);
            curY -= 20;
        }

        curX += spaceX - 30;
        curY = height - botMargin - 100;
        for (let key in houseAndWasteColorMap) {
            ctx.fillStyle = houseAndWasteColorMap[key];
            ctx.fillRect(curX, curY, 10, 10);
            ctx.fillStyle = "#000000";
            ctx.font = '14px Arial';
            ctx.fillText(key, curX + 18, curY + 10);
            curY -= 20;
        }

        curX += spaceX + 30;
        curY = height - botMargin - 40;
        for (let key in foodColorMap) {
            ctx.fillStyle = foodColorMap[key];
            ctx.fillRect(curX, curY, 10, 10);
            ctx.fillStyle = "#000000";
            ctx.font = '14px Arial';
            ctx.fillText(key, curX + 18, curY + 10);
            curY -= 20;
        }
    }

    const drawBars = function() {
        const horizBuffer = 165;
        const spaceX = (graphWidth - (2 * horizBuffer)) / (3-1);
        const rectWidth = 120;
        ctx.fillStyle = "#000000";
        ctx.font = '18px Arial';
        let curX = 0;

        curX = horizBuffer + leftMargin;
        drawVertBar(canvas, transportArray, transportColorMap, curX, height - botMargin, rectWidth, graphHeight, maxEmissions);
        if (firstTimeBarChart) {
            ctx.fillStyle = "#000000";
            ctx.font = '18px Arial';
            ctx.fillText("Transport", curX - (width / 25) + (rectWidth / 2), height - botMargin + (height / 26));
        }

        curX += spaceX;
        drawVertBar(canvas, houseAndWasteArray, houseAndWasteColorMap, curX, height - botMargin, rectWidth, graphHeight, maxEmissions);
        if (firstTimeBarChart) {
            console.log("Here");
            ctx.fillStyle = "#000000";
            ctx.font = '18px Arial';
            ctx.fillText("Household", curX - (width / 25) + (rectWidth / 2), height - botMargin + (height / 26));
        }

        curX += spaceX;
        drawVertBar(canvas, foodArray, foodColorMap, curX, height - botMargin, rectWidth, graphHeight, maxEmissions);
        if (firstTimeBarChart) {
            ctx.fillStyle = "#000000";
            ctx.font = '18px Arial';
            ctx.fillText("Food", curX + (rectWidth / 3), height - botMargin + (height / 26));
        }
    }

    if (firstTimeBarChart) {
        drawAxis2();
        drawTitles2();
        drawLegends2();
        firstTimeBarChart = false;
    }
    drawBars();
}
