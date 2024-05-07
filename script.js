// Get form inputs
const purchasePrice = document.getElementById("purchasePrice");
const powerCost = document.getElementById("powerCost");
const gpuWattage = document.getElementById("gpuWattage");
const depreciationRate = document.getElementById("depreciationRate");
const yearsOfOwnership = document.getElementById("yearsOfOwnership");
const hoursPerDay = document.getElementById("hoursPerDay");
const tokensPerSecond = document.getElementById("tokensPerSecond");
const inputTokenPrice = document.getElementById("inputTokenPrice");
const outputTokenPrice = document.getElementById("outputTokenPrice");
const tokensPerDay = document.getElementById("tokensPerDay");

// Get chart and report elements
const costChart = document.getElementById("costChart").getContext("2d");
const costReport = document.getElementById("costReport");
const downloadReportBtn = document.getElementById("downloadReport");
const calculateBtn = document.getElementById("calculateBtn");
const resetBtn = document.getElementById("resetBtn");

// Calculate costs
function calculateGPUCost() {
  const purchasePriceValue = Number(purchasePrice.value);
  const powerCostValue = Number(powerCost.value);
  const gpuWattageValue = Number(gpuWattage.value);
  const depreciationRateValue = Number(depreciationRate.value) / 100;
  const yearsOfOwnershipValue = Number(yearsOfOwnership.value);
  const hoursPerDayValue = Number(hoursPerDay.value);
  const tokensPerSecondValue = Number(tokensPerSecond.value);

  const dailyPowerCost =
    (gpuWattageValue / 1000) * powerCostValue * hoursPerDayValue;
  const annualPowerCost = dailyPowerCost * 365;

  const annualDepreciation = purchasePriceValue * depreciationRateValue;
  const totalDepreciation = annualDepreciation * yearsOfOwnershipValue;

  const annualCosts = [];
  for (let i = 1; i <= yearsOfOwnershipValue; i++) {
    const depreciation =
      purchasePriceValue *
      Math.pow(1 - depreciationRateValue, i - 1) *
      depreciationRateValue;
    const annualCost = annualPowerCost + depreciation;
    annualCosts.push(annualCost);
  }

  const totalCost = purchasePriceValue + annualCosts.reduce((a, b) => a + b, 0);

  const tokensPerDay = tokensPerSecondValue * hoursPerDayValue * 3600;
  const tokensPerYear = tokensPerDay * 365;

  return {
    purchasePriceValue,
    annualPowerCost,
    totalDepreciation,
    annualCosts,
    totalCost,
    tokensPerYear,
  };
}

function calculateAPICost() {
  const inputTokenPriceValue = Number(inputTokenPrice.value) / 1000000;
  const outputTokenPriceValue = Number(outputTokenPrice.value) / 1000000;
  const tokensPerDayValue = Number(tokensPerDay.value);

  const dailyCost =
    tokensPerDayValue * (inputTokenPriceValue + outputTokenPriceValue);
  const annualCost = dailyCost * 365;

  return {
    annualCost,
    tokensPerYear: tokensPerDayValue * 365,
  };
}

// Declare chart variable outside the function scope
let chart;

// Update chart and report
function updateChartAndReport() {
  const gpuCost = calculateGPUCost();
  const apiCost = calculateAPICost();

  const years = [];
  const gpuCosts = [gpuCost.purchasePriceValue];
  const apiCosts = [];
  const apiCostsGPUTokens = [];

  for (let i = 1; i <= Number(yearsOfOwnership.value); i++) {
    years.push(i);
    gpuCosts.push(gpuCosts[i - 1] + gpuCost.annualCosts[i - 1]);
    apiCosts.push(apiCost.annualCost * i);
    apiCostsGPUTokens.push(
      (apiCost.annualCost / apiCost.tokensPerYear) * gpuCost.tokensPerYear * i
    );
  }

  // Destroy existing chart if it exists
  if (chart) {
    chart.destroy();
  }

  chart = new Chart(costChart, {
    type: "line",
    data: {
      labels: years,
      datasets: [
        {
          label: "GPU Cost",
          data: gpuCosts,
          borderColor: "blue",
          fill: false,
        },
        {
          label: "API Cost",
          data: apiCosts,
          borderColor: "green",
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        x: {
          title: {
            display: true,
            text: "Years",
          },
        },
        y: {
          title: {
            display: true,
            text: "Cost ($)",
          },
        },
      },
      plugins: {
        zoom: {
          zoom: {
            wheel: {
              enabled: true,
            },
            pan: {
              enabled: true,
              mode: "xy",
            },
          },
        },
      },
    },
  });

  //const breakEvenPoint = gpuCost.annualCosts.findIndex((cost) => cost > apiCost.annualCost) + 1;
  const breakEvenPoint =
    apiCosts.findIndex((cost) => cost > gpuCosts[gpuCosts.length - 1]) + 1;

  costReport.innerHTML = `
  <p><strong>Initial Purchase Price of GPU:</strong> $${gpuCost.purchasePriceValue.toFixed(
    2
  )}</p>
  <p><strong>Annual Power Cost of GPU:</strong> $${gpuCost.annualPowerCost.toFixed(
    2
  )}</p>
  <p><strong>Total Depreciation of GPU over ${
    yearsOfOwnership.value
  } Years:</strong> $${gpuCost.totalDepreciation.toFixed(2)}</p>
  <p><strong>Annual Costs of Owning a GPU (Including Depreciation):</strong></p>
  <ul>
    ${gpuCost.annualCosts
      .map((cost, index) => `<li>Year ${index + 1}: $${cost.toFixed(2)}</li>`)
      .join("")}
  </ul>
  <p><strong>Total Cost of Owning a GPU over ${
    yearsOfOwnership.value
  } Years:</strong> $${gpuCost.totalCost.toFixed(2)}</p>
  <p><strong>Total Cost of Using an API per Year:</strong> $${apiCost.annualCost.toFixed(
    2
  )}</p>
  <p><strong>Total Cost of Using API per day:</strong> $${(
    apiCost.annualCost / 365
  ).toFixed(2)}</p>
  <p><strong>Total Cost of Using an API over ${
    yearsOfOwnership.value
  } Years:</strong> $${(
    apiCost.annualCost * Number(yearsOfOwnership.value)
  ).toFixed(2)}</p>
  <p><strong>Total Cost of Using an API to Generate the Same Amount of Tokens as the GPU:</strong> $${apiCostsGPUTokens[
    apiCostsGPUTokens.length - 1
  ].toFixed(2)}</p>
  <p><strong>Breakeven Point:</strong> ${
    breakEvenPoint > yearsOfOwnership.value
      ? "Not reached within the specified years of ownership"
      : breakEvenPoint + " Years"
  }</p>
  <p><strong>Estimated Tokens Generated per Year (GPU):</strong> ${gpuCost.tokensPerYear.toLocaleString()}</p>
  <p><strong>Estimated Tokens Generated per Year (API):</strong> ${apiCost.tokensPerYear.toLocaleString()}</p>
`;
}
// Download report as PDF
function downloadReport() {
  // Ensure jsPDF is defined before creating a new instance
  if (typeof jsPDF !== "undefined") {
    const doc = new jsPDF();
    doc.fromHTML(costReport, 15, 15, { width: 170 });
    doc.save("cost_report.pdf");
  } else {
    console.error("jsPDF library is not loaded.");
  }
}

// Reset form
function resetForm() {
  purchasePrice.value = 1500;
  powerCost.value = 0.12;
  gpuWattage.value = 350;
  depreciationRate.value = 8;
  yearsOfOwnership.value = 4;
  hoursPerDay.value = 8;
  tokensPerSecond.value = 30;
  inputTokenPrice.value = 10;
  outputTokenPrice.value = 15;
  tokensPerDay.value = 10000;
  updateChartAndReport();
}

// Event listeners
calculateBtn.addEventListener("click", updateChartAndReport);
resetBtn.addEventListener("click", resetForm);
downloadReportBtn.addEventListener("click", downloadReport);

// Initial chart and report
updateChartAndReport();
