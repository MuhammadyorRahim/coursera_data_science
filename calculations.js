// Tail Index Calculation Functions

/**
 * Calculate daily returns (tendencies) from price data
 * Formula: (Price_t - Price_{t-1}) / Price_{t-1}
 */
function calculateReturns(data) {
    if (data.length < 2) return [];

    const returns = [];
    for (let i = 1; i < data.length; i++) {
        if (data[i - 1] !== null && data[i - 1] !== 0 && !isNaN(data[i - 1]) &&
            data[i] !== null && !isNaN(data[i])) {
            const ret = (data[i] - data[i - 1]) / data[i - 1];
            returns.push(ret);
        } else {
            returns.push(NaN);
        }
    }
    return returns;
}

/**
 * Hill's Estimator Method
 * Formula: ξ_Hill = n / Σ(log|r|(t) - log|r|(n))
 */
function hillEstimator(absReturns) {
    // Remove NaN values and sort in descending order
    const sorted = absReturns
        .filter(x => !isNaN(x) && x > 0)
        .sort((a, b) => b - a);

    const n = sorted.length;
    if (n < 2) return null;

    // Calculate sum of log differences
    const logRn = Math.log(sorted[n - 1]);
    let sum = 0;

    for (let i = 0; i < n; i++) {
        sum += Math.log(sorted[i]) - logRn;
    }

    const xi = n / sum;
    const se = (1 / Math.sqrt(n)) * xi;
    const ci_lower = xi - 1.96 * se;
    const ci_upper = xi + 1.96 * se;

    return {
        xi: xi,
        se: se,
        ci: [ci_lower, ci_upper],
        n: n
    };
}

/**
 * OLS Log-Log Rank-Size Regression Method (Gabaix-Ibragimov)
 * Formula: ln(t - 0.5) = a - b * ln|r|(t)
 * where b is the tail index estimate
 */
function rankSizeRegression(absReturns) {
    // Remove NaN values and sort in descending order
    const sorted = absReturns
        .filter(x => !isNaN(x) && x > 0)
        .sort((a, b) => b - a);

    const n = sorted.length;
    if (n < 2) return null;

    // Prepare data for regression
    const Y = []; // ln(t - 0.5)
    const X = []; // ln|r|(t)

    for (let t = 1; t <= n; t++) {
        const lnRank = Math.log(t - 0.5);
        const lnValue = Math.log(sorted[t - 1]);

        if (!isNaN(lnRank) && !isNaN(lnValue) && isFinite(lnRank) && isFinite(lnValue)) {
            Y.push(lnRank);
            X.push(lnValue);
        }
    }

    // Perform OLS regression
    const regression = ordinaryLeastSquares(X, Y);

    // The coefficient b (negative of the slope) is the tail index
    const xi = Math.abs(regression.slope);
    const se = Math.sqrt(2 / n) * xi;
    const ci_lower = xi - 1.96 * se;
    const ci_upper = xi + 1.96 * se;

    return {
        xi: xi,
        se: se,
        ci: [ci_lower, ci_upper],
        n: n,
        intercept: regression.intercept,
        r_squared: regression.r_squared
    };
}

/**
 * Ordinary Least Squares Regression
 * Returns slope, intercept, and r-squared
 */
function ordinaryLeastSquares(X, Y) {
    const n = X.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0, sumYY = 0;

    for (let i = 0; i < n; i++) {
        sumX += X[i];
        sumY += Y[i];
        sumXY += X[i] * Y[i];
        sumXX += X[i] * X[i];
        sumYY += Y[i] * Y[i];
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate R-squared
    const meanY = sumY / n;
    let ssRes = 0, ssTot = 0;
    for (let i = 0; i < n; i++) {
        const predicted = slope * X[i] + intercept;
        ssRes += Math.pow(Y[i] - predicted, 2);
        ssTot += Math.pow(Y[i] - meanY, 2);
    }
    const r_squared = 1 - (ssRes / ssTot);

    return { slope, intercept, r_squared };
}

/**
 * Rolling Window Analysis (Method 3)
 * Start with first 100 observations, then add one at a time
 */
function rollingWindowAnalysis(absReturns, method = 'both') {
    // Remove NaN values and sort in descending order
    const sorted = absReturns
        .filter(x => !isNaN(x) && x > 0)
        .sort((a, b) => b - a);

    const minWindow = Math.min(100, sorted.length);
    if (sorted.length < minWindow) return null;

    const results = {
        hill: [],
        rs: [],
        windowSizes: []
    };

    // Start from minWindow and expand by one each iteration
    for (let size = minWindow; size <= sorted.length; size++) {
        const windowData = sorted.slice(0, size);
        results.windowSizes.push(size);

        if (method === 'hill' || method === 'both') {
            const hillResult = hillEstimator(windowData);
            results.hill.push(hillResult);
        }

        if (method === 'rs' || method === 'both') {
            const rsResult = rankSizeRegression(windowData);
            results.rs.push(rsResult);
        }
    }

    return results;
}

/**
 * Positive/Negative Separation Analysis (Method 4)
 * Separate returns into positive and negative, analyze with truncation levels
 */
function separationAnalysis(returns, truncationLevels = [0.05, 0.10]) {
    const positive = [];
    const negative = [];

    // Separate returns
    for (const ret of returns) {
        if (!isNaN(ret) && ret !== 0) {
            if (ret > 0) {
                positive.push(ret);
            } else {
                negative.push(Math.abs(ret));
            }
        }
    }

    // Sort both in descending order
    positive.sort((a, b) => b - a);
    negative.sort((a, b) => b - a);

    const results = [];

    // Analyze positive returns
    for (const level of truncationLevels) {
        const n_used = Math.max(1, Math.floor(positive.length * level));
        const truncated = positive.slice(0, n_used);

        const hillResult = hillEstimator(truncated);
        const rsResult = rankSizeRegression(truncated);

        if (hillResult && rsResult) {
            results.push({
                type: 'Positive',
                N: positive.length,
                truncation_level: level,
                n: n_used,
                rs_xi: rsResult.xi,
                rs_se: rsResult.se,
                rs_ci: rsResult.ci,
                hill_xi: hillResult.xi,
                hill_se: hillResult.se,
                hill_ci: hillResult.ci
            });
        }
    }

    // Analyze negative returns
    for (const level of truncationLevels) {
        const n_used = Math.max(1, Math.floor(negative.length * level));
        const truncated = negative.slice(0, n_used);

        const hillResult = hillEstimator(truncated);
        const rsResult = rankSizeRegression(truncated);

        if (hillResult && rsResult) {
            results.push({
                type: 'Negative',
                N: negative.length,
                truncation_level: level,
                n: n_used,
                rs_xi: rsResult.xi,
                rs_se: rsResult.se,
                rs_ci: rsResult.ci,
                hill_xi: hillResult.xi,
                hill_se: hillResult.se,
                hill_ci: hillResult.ci
            });
        }
    }

    return results;
}

/**
 * Main analysis function
 * Processes a column of data and returns all analysis results
 */
function analyzeColumn(data, options = {}) {
    const {
        includeRolling = true,
        includeSeparation = true,
        methodHill = true,
        methodRS = true
    } = options;

    // Calculate returns
    const returns = calculateReturns(data);

    // Convert to absolute values
    const absReturns = returns.map(r => Math.abs(r));

    // Basic tail index calculations
    const results = {
        returns: returns,
        absReturns: absReturns
    };

    if (methodHill) {
        results.hill = hillEstimator(absReturns);
    }

    if (methodRS) {
        results.rs = rankSizeRegression(absReturns);
    }

    // Rolling window analysis
    if (includeRolling) {
        const method = methodHill && methodRS ? 'both' :
                      methodHill ? 'hill' :
                      methodRS ? 'rs' : 'both';
        results.rolling = rollingWindowAnalysis(absReturns, method);
    }

    // Separation analysis
    if (includeSeparation) {
        results.separation = separationAnalysis(returns);
    }

    return results;
}

// Export functions for use in main app
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        calculateReturns,
        hillEstimator,
        rankSizeRegression,
        rollingWindowAnalysis,
        separationAnalysis,
        analyzeColumn
    };
}
