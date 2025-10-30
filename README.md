# Tail Index Calculator

A modern web application for calculating tail indexes using Hill's Estimator and OLS Rank-Size Regression methods.

## Features

- **Modern UI**: Clean, responsive interface with step-by-step workflow
- **Multiple Methods**:
  - Hill's Estimator
  - OLS Log-Log Rank-Size Regression (Gabaix-Ibragimov)
- **Advanced Analysis**:
  - Rolling window analysis with expanding observations (starts at 100)
  - Positive/negative separation analysis with truncation levels (5%, 10%)
- **Interactive Charts**: Plotly-based visualizations with hover tooltips
- **Data Export**: Download results as CSV and charts as PNG

## How to Use

### Step 1: Open the Application

Simply open `index.html` in your web browser. No server or installation required!

```bash
# Option 1: Double-click index.html in your file explorer

# Option 2: From command line (Linux/Mac)
open index.html

# Option 3: From command line (Windows)
start index.html

# Option 4: From command line (Python)
python3 -m http.server 8000
# Then visit http://localhost:8000 in your browser
```

### Step 2: Upload Your Data

- Click the upload area or drag and drop a CSV file
- The first row should contain column names
- Data rows should contain numeric values (prices, returns, etc.)

**Example CSV format:**
```csv
Date,Asset1,Asset2,Asset3
2024-01-01,100.5,200.3,150.2
2024-01-02,101.2,198.5,151.0
...
```

### Step 3: Configure Analysis

1. **Select Columns**: Choose which columns to analyze
2. **Select Methods**:
   - Hill's Estimator (standard method)
   - Rank-Size Regression (recommended)
3. **Analysis Options**:
   - Rolling Window Analysis (calculates tail index with expanding window)
   - Positive/Negative Separation (analyzes positive and negative returns separately)
   - Generate Graphics (creates interactive charts)

### Step 4: View Results

The results are organized in tabs:

- **Summary**: Basic tail index calculations for each column
- **Rolling Analysis**: Shows how tail index evolves with sample size
- **Pos/Neg Analysis**: Separate analysis for positive and negative returns
- **Charts**: Interactive visualizations with 95% confidence intervals

### Step 5: Download Results

- **Download Results (CSV)**: All numerical results in CSV format
- **Download Charts (PNG)**: All charts as high-resolution images

## Calculation Methods

### Method 1: Hill's Estimator

Formula: `ξ_Hill = n / Σ(log|r|(t) - log|r|(n))`

- Standard tail index estimation method
- Works on sorted absolute values of returns
- Standard Error: `SE = (1/√n) * ξ`
- 95% CI: `ξ ± 1.96 * SE`

### Method 2: OLS Rank-Size Regression

Formula: `ln(t - 0.5) = a - b * ln|r|(t)`

- Preferred method by researchers
- Uses Gabaix-Ibragimov (2011) adjustment
- The coefficient b represents the tail index
- Standard Error: `SE = √(2/n) * ξ`
- 95% CI: `ξ ± 1.96 * SE`

## Data Processing

The application automatically:

1. Calculates daily returns: `(Price_t - Price_{t-1}) / Price_{t-1}`
2. Converts to absolute values
3. Removes NaN values
4. Sorts from largest to smallest
5. Applies the selected methods

## Rolling Window Analysis

- Starts with first 100 observations
- Adds one observation at a time
- Calculates tail index and 95% CI for each window
- Creates charts showing convergence

## Positive/Negative Separation

- Separates returns into positive and negative
- Analyzes each group independently
- Applies truncation levels (5% and 10%)
- Example: With 200 observations and 10% truncation, uses top 20 values

## Browser Compatibility

Works in all modern browsers:
- Chrome/Edge (recommended)
- Firefox
- Safari
- Opera

## Dependencies

All dependencies are loaded from CDN:
- Plotly.js (interactive charts)
- PapaParse (CSV parsing)

No installation required!

## Technical Details

- Pure JavaScript (no frameworks)
- Responsive CSS design
- Client-side processing (data never leaves your computer)
- Supports files up to browser memory limits

## Troubleshooting

**Problem**: Charts not displaying
- **Solution**: Check browser console for errors, ensure JavaScript is enabled

**Problem**: File upload not working
- **Solution**: Ensure file is in CSV format with proper structure

**Problem**: Calculations seem incorrect
- **Solution**: Verify data format (numeric values, no missing headers)

## Example Workflow

1. Prepare CSV with financial data (stock prices, returns, etc.)
2. Open `index.html` in browser
3. Upload CSV file
4. Select columns to analyze
5. Choose both methods and all analysis options
6. Click "Start Calculation"
7. Review results in all tabs
8. Download results and charts for your report

## Notes

- The application calculates returns automatically from price data
- First data row after headers may contain NaN (from return calculation) - these are automatically removed
- Tail index < 2 suggests heavy tails (fat tails, extreme events)
- Tail index > 2 suggests lighter tails (closer to normal distribution)
- Lower tail index = heavier tails = more extreme events

## Citation

If you use this tool in research, please cite the underlying methods:
- Hill, B.M. (1975). A simple general approach to inference about the tail of a distribution.
- Gabaix, X., & Ibragimov, R. (2011). Rank−1/2: A simple way to improve the OLS estimation of tail exponents.

---

**Created with Claude Code**
