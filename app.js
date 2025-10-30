// Main Application Logic

// Global state
let uploadedData = null;
let selectedColumns = [];
let analysisResults = {};

// DOM Elements
const uploadSection = document.getElementById('upload-section');
const configSection = document.getElementById('config-section');
const processingSection = document.getElementById('processing-section');
const resultsSection = document.getElementById('results-section');

const uploadArea = document.getElementById('upload-area');
const fileInput = document.getElementById('file-input');
const fileInfo = document.getElementById('file-info');
const fileName = document.getElementById('file-name');
const removeFileBtn = document.getElementById('remove-file');
const continueBtn = document.getElementById('continue-to-config');

const columnSelection = document.getElementById('column-selection');
const backToUploadBtn = document.getElementById('back-to-upload');
const startCalculationBtn = document.getElementById('start-calculation');

const processingStatus = document.getElementById('processing-status');

const downloadResultsBtn = document.getElementById('download-results');
const downloadChartsBtn = document.getElementById('download-charts');
const newAnalysisBtn = document.getElementById('new-analysis');

// Initialize event listeners
function init() {
    // Upload section
    uploadArea.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);
    removeFileBtn.addEventListener('click', removeFile);
    continueBtn.addEventListener('click', showConfigSection);

    // Drag and drop
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);

    // Config section
    backToUploadBtn.addEventListener('click', showUploadSection);
    startCalculationBtn.addEventListener('click', startCalculation);

    // Results section
    downloadResultsBtn.addEventListener('click', downloadResults);
    downloadChartsBtn.addEventListener('click', downloadCharts);
    newAnalysisBtn.addEventListener('click', resetApplication);

    // Tab switching
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
}

// File handling
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        processFile(file);
    }
}

function handleDragOver(event) {
    event.preventDefault();
    uploadArea.classList.add('drag-over');
}

function handleDragLeave(event) {
    event.preventDefault();
    uploadArea.classList.remove('drag-over');
}

function handleDrop(event) {
    event.preventDefault();
    uploadArea.classList.remove('drag-over');

    const file = event.dataTransfer.files[0];
    if (file) {
        processFile(file);
    }
}

function processFile(file) {
    const fileExtension = file.name.split('.').pop().toLowerCase();

    if (fileExtension === 'csv') {
        Papa.parse(file, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            complete: function(results) {
                uploadedData = results;
                displayFileInfo(file.name);
            },
            error: function(error) {
                alert('Error parsing CSV file: ' + error.message);
            }
        });
    } else if (fileExtension === 'xlsx') {
        alert('Excel files require additional library. Please convert to CSV format.');
    } else {
        alert('Unsupported file format. Please upload a CSV file.');
    }
}

function displayFileInfo(name) {
    fileName.textContent = name;
    fileInfo.classList.remove('hidden');
    continueBtn.classList.remove('hidden');
    uploadArea.style.display = 'none';
}

function removeFile() {
    uploadedData = null;
    fileInput.value = '';
    fileInfo.classList.add('hidden');
    continueBtn.classList.add('hidden');
    uploadArea.style.display = 'block';
}

// Navigation
function showSection(section) {
    uploadSection.classList.remove('active');
    configSection.classList.remove('active');
    processingSection.classList.remove('active');
    resultsSection.classList.remove('active');

    section.classList.add('active');
}

function showUploadSection() {
    showSection(uploadSection);
}

function showConfigSection() {
    if (!uploadedData) {
        alert('Please upload a file first');
        return;
    }

    populateColumnSelection();
    showSection(configSection);
}

function showProcessingSection() {
    showSection(processingSection);
}

function showResultsSection() {
    showSection(resultsSection);
}

// Configuration
function populateColumnSelection() {
    columnSelection.innerHTML = '';

    if (!uploadedData || !uploadedData.meta || !uploadedData.meta.fields) {
        return;
    }

    const columns = uploadedData.meta.fields;

    columns.forEach((col, index) => {
        const div = document.createElement('div');
        div.className = 'column-item';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `col-${index}`;
        checkbox.value = col;
        checkbox.checked = true;

        const label = document.createElement('label');
        label.htmlFor = `col-${index}`;
        label.textContent = col;
        label.style.cursor = 'pointer';

        div.appendChild(checkbox);
        div.appendChild(label);
        columnSelection.appendChild(div);
    });
}

function getSelectedColumns() {
    const checkboxes = columnSelection.querySelectorAll('input[type="checkbox"]:checked');
    return Array.from(checkboxes).map(cb => cb.value);
}

// Analysis
async function startCalculation() {
    selectedColumns = getSelectedColumns();

    if (selectedColumns.length === 0) {
        alert('Please select at least one column to analyze');
        return;
    }

    const options = {
        includeRolling: document.getElementById('option-rolling').checked,
        includeSeparation: document.getElementById('option-separation').checked,
        methodHill: document.getElementById('method-hill').checked,
        methodRS: document.getElementById('method-rs').checked,
        generateGraphics: document.getElementById('option-graphics').checked
    };

    showProcessingSection();

    // Simulate processing delay for UX
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
        analysisResults = {};

        for (let i = 0; i < selectedColumns.length; i++) {
            const colName = selectedColumns[i];
            processingStatus.textContent = `Processing column ${i + 1} of ${selectedColumns.length}: ${colName}...`;

            const columnData = uploadedData.data.map(row => row[colName]);
            const results = analyzeColumn(columnData, options);

            analysisResults[colName] = results;

            await new Promise(resolve => setTimeout(resolve, 100));
        }

        processingStatus.textContent = 'Analysis complete! Generating results...';
        await new Promise(resolve => setTimeout(resolve, 500));

        displayResults(options);
        showResultsSection();

    } catch (error) {
        alert('Error during calculation: ' + error.message);
        console.error(error);
        showConfigSection();
    }
}

// Results display
function displayResults(options) {
    displaySummaryResults();

    if (options.includeRolling) {
        displayRollingResults();
    }

    if (options.includeSeparation) {
        displaySeparationResults();
    }

    if (options.generateGraphics) {
        displayCharts(options);
    }
}

function displaySummaryResults() {
    const container = document.getElementById('summary-results');
    container.innerHTML = '';

    for (const [colName, results] of Object.entries(analysisResults)) {
        const section = document.createElement('div');
        section.style.marginBottom = '2rem';

        const title = document.createElement('h4');
        title.textContent = colName;
        title.style.marginBottom = '1rem';
        section.appendChild(title);

        const table = document.createElement('table');
        table.className = 'results-table';

        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th>Method</th>
                <th>Tail Index (ξ)</th>
                <th>Standard Error</th>
                <th>95% CI Lower</th>
                <th>95% CI Upper</th>
                <th>N</th>
            </tr>
        `;
        table.appendChild(thead);

        const tbody = document.createElement('tbody');

        if (results.hill) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>Hill's Estimator</strong></td>
                <td>${results.hill.xi.toFixed(4)}</td>
                <td>${results.hill.se.toFixed(4)}</td>
                <td>${results.hill.ci[0].toFixed(4)}</td>
                <td>${results.hill.ci[1].toFixed(4)}</td>
                <td>${results.hill.n}</td>
            `;
            tbody.appendChild(row);
        }

        if (results.rs) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>Rank-Size Regression</strong></td>
                <td>${results.rs.xi.toFixed(4)}</td>
                <td>${results.rs.se.toFixed(4)}</td>
                <td>${results.rs.ci[0].toFixed(4)}</td>
                <td>${results.rs.ci[1].toFixed(4)}</td>
                <td>${results.rs.n}</td>
            `;
            tbody.appendChild(row);
        }

        table.appendChild(tbody);
        section.appendChild(table);
        container.appendChild(section);
    }
}

function displayRollingResults() {
    const container = document.getElementById('rolling-results');
    container.innerHTML = '<p>Rolling window analysis completed. View charts in the Charts tab.</p>';
}

function displaySeparationResults() {
    const container = document.getElementById('separation-results');
    container.innerHTML = '';

    for (const [colName, results] of Object.entries(analysisResults)) {
        if (!results.separation || results.separation.length === 0) continue;

        const section = document.createElement('div');
        section.style.marginBottom = '2rem';

        const title = document.createElement('h4');
        title.textContent = colName;
        title.style.marginBottom = '1rem';
        section.appendChild(title);

        const table = document.createElement('table');
        table.className = 'results-table';

        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th>Type</th>
                <th>N (Total)</th>
                <th>Truncation</th>
                <th>n (Used)</th>
                <th>RS ξ</th>
                <th>RS SE</th>
                <th>RS 95% CI</th>
                <th>Hill ξ</th>
                <th>Hill SE</th>
                <th>Hill 95% CI</th>
            </tr>
        `;
        table.appendChild(thead);

        const tbody = document.createElement('tbody');

        results.separation.forEach(sep => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${sep.type}</td>
                <td>${sep.N}</td>
                <td>${(sep.truncation_level * 100).toFixed(0)}%</td>
                <td>${sep.n}</td>
                <td>${sep.rs_xi.toFixed(4)}</td>
                <td>${sep.rs_se.toFixed(4)}</td>
                <td>[${sep.rs_ci[0].toFixed(4)}, ${sep.rs_ci[1].toFixed(4)}]</td>
                <td>${sep.hill_xi.toFixed(4)}</td>
                <td>${sep.hill_se.toFixed(4)}</td>
                <td>[${sep.hill_ci[0].toFixed(4)}, ${sep.hill_ci[1].toFixed(4)}]</td>
            `;
            tbody.appendChild(row);
        });

        table.appendChild(tbody);
        section.appendChild(table);
        container.appendChild(section);
    }
}

function displayCharts(options) {
    const container = document.getElementById('charts-container');
    container.innerHTML = '';

    for (const [colName, results] of Object.entries(analysisResults)) {
        if (!results.rolling) continue;

        // Create charts for Hill method
        if (options.methodHill && results.rolling.hill && results.rolling.hill.length > 0) {
            createRollingChart(container, colName, results.rolling, 'hill', 'Hill\'s Estimator');
        }

        // Create charts for RS method
        if (options.methodRS && results.rolling.rs && results.rolling.rs.length > 0) {
            createRollingChart(container, colName, results.rolling, 'rs', 'Rank-Size Regression');
        }
    }
}

function createRollingChart(container, colName, rollingData, method, methodName) {
    const chartDiv = document.createElement('div');
    chartDiv.className = 'chart-container';
    chartDiv.id = `chart-${colName}-${method}`;

    const title = document.createElement('div');
    title.className = 'chart-title';
    title.textContent = `${colName} - ${methodName}`;
    chartDiv.appendChild(title);

    const plotDiv = document.createElement('div');
    plotDiv.style.width = '100%';
    plotDiv.style.height = '500px';
    chartDiv.appendChild(plotDiv);

    container.appendChild(chartDiv);

    // Prepare data
    const windowSizes = rollingData.windowSizes;
    const methodData = rollingData[method];

    const xiValues = methodData.map(d => d.xi);
    const ciLower = methodData.map(d => d.ci[0]);
    const ciUpper = methodData.map(d => d.ci[1]);

    // Create Plotly chart
    const trace1 = {
        x: windowSizes,
        y: xiValues,
        mode: 'lines',
        name: 'Tail Index (ξ)',
        line: { color: '#6366f1', width: 2 }
    };

    const trace2 = {
        x: windowSizes,
        y: ciUpper,
        mode: 'lines',
        name: '95% CI Upper',
        line: { color: 'rgba(99, 102, 241, 0.3)', width: 1, dash: 'dash' },
        showlegend: true
    };

    const trace3 = {
        x: windowSizes,
        y: ciLower,
        mode: 'lines',
        name: '95% CI Lower',
        fill: 'tonexty',
        fillcolor: 'rgba(99, 102, 241, 0.1)',
        line: { color: 'rgba(99, 102, 241, 0.3)', width: 1, dash: 'dash' },
        showlegend: true
    };

    const layout = {
        xaxis: {
            title: 'Window Size (n)',
            showgrid: true,
            gridcolor: '#e2e8f0'
        },
        yaxis: {
            title: 'Tail Index (ξ)',
            showgrid: true,
            gridcolor: '#e2e8f0'
        },
        hovermode: 'x unified',
        showlegend: true,
        legend: {
            x: 1,
            xanchor: 'right',
            y: 1
        },
        margin: { l: 60, r: 30, t: 30, b: 60 }
    };

    const config = {
        responsive: true,
        displayModeBar: true,
        displaylogo: false,
        modeBarButtonsToRemove: ['lasso2d', 'select2d']
    };

    Plotly.newPlot(plotDiv, [trace3, trace2, trace1], layout, config);
}

// Tab switching
function switchTab(tabName) {
    // Update buttons
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        if (btn.dataset.tab === tabName) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Update content
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => {
        content.classList.remove('active');
    });

    document.getElementById(`${tabName}-tab`).classList.add('active');
}

// Download functionality
function downloadResults() {
    let csvContent = '';

    // Summary results
    csvContent += 'SUMMARY RESULTS\n\n';

    for (const [colName, results] of Object.entries(analysisResults)) {
        csvContent += `Column: ${colName}\n`;
        csvContent += 'Method,Tail Index,Standard Error,CI Lower,CI Upper,N\n';

        if (results.hill) {
            csvContent += `Hill's Estimator,${results.hill.xi},${results.hill.se},${results.hill.ci[0]},${results.hill.ci[1]},${results.hill.n}\n`;
        }

        if (results.rs) {
            csvContent += `Rank-Size Regression,${results.rs.xi},${results.rs.se},${results.rs.ci[0]},${results.rs.ci[1]},${results.rs.n}\n`;
        }

        csvContent += '\n';
    }

    // Separation results
    csvContent += '\nPOSITIVE/NEGATIVE SEPARATION ANALYSIS\n\n';

    for (const [colName, results] of Object.entries(analysisResults)) {
        if (!results.separation) continue;

        csvContent += `Column: ${colName}\n`;
        csvContent += 'Type,N,Truncation,n,RS ξ,RS SE,RS CI Lower,RS CI Upper,Hill ξ,Hill SE,Hill CI Lower,Hill CI Upper\n';

        results.separation.forEach(sep => {
            csvContent += `${sep.type},${sep.N},${sep.truncation_level},${sep.n},`;
            csvContent += `${sep.rs_xi},${sep.rs_se},${sep.rs_ci[0]},${sep.rs_ci[1]},`;
            csvContent += `${sep.hill_xi},${sep.hill_se},${sep.hill_ci[0]},${sep.hill_ci[1]}\n`;
        });

        csvContent += '\n';
    }

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tail_index_results.csv';
    a.click();
    window.URL.revokeObjectURL(url);
}

function downloadCharts() {
    // Get all chart divs
    const chartContainers = document.querySelectorAll('.chart-container');

    chartContainers.forEach((container, index) => {
        const plotDiv = container.querySelector('div[style*="height"]');
        if (plotDiv && plotDiv._fullLayout) {
            const title = container.querySelector('.chart-title').textContent;
            const fileName = `chart_${index + 1}_${title.replace(/[^a-z0-9]/gi, '_')}.png`;

            Plotly.downloadImage(plotDiv, {
                format: 'png',
                width: 1200,
                height: 600,
                filename: fileName.substring(0, 50) // Limit filename length
            });
        }
    });

    alert('Charts are being downloaded. Check your downloads folder.');
}

function resetApplication() {
    uploadedData = null;
    selectedColumns = [];
    analysisResults = {};

    removeFile();
    showUploadSection();
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', init);
