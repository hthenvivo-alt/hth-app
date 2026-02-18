export const evaluateArithmetic = (input: string): number | null => {
    if (!input || typeof input !== 'string') return null;

    // Convert comma to dot for decimal support and remove spaces
    let clean = input.replace(/,/g, '.').replace(/\s/g, '');

    // Basic validation: only numbers and basic math operators
    if (!/^[0-9+\-*/().]+$/.test(clean)) {
        return null;
    }

    try {
        // Use a safer evaluation method
        // eslint-disable-next-line no-new-func
        const result = new Function(`return ${clean}`)();

        if (typeof result === 'number' && isFinite(result)) {
            // Round to 2 decimals to keep it clean
            return Math.round(result * 100) / 100;
        }
        return null;
    } catch (e) {
        return null;
    }
};
export const safeEvaluate = (input: any): number => {
    if (input === null || input === undefined || input === '') return 0;
    if (typeof input === 'number') return input;

    // Try full evaluation first
    const evaluated = evaluateArithmetic(String(input));
    if (evaluated !== null) return evaluated;

    // Fallback: parse whatever numeric part we have at the start
    // This allows "100+" to be treated as 100 for running totals
    const match = String(input).replace(',', '.').match(/^-?\d*\.?\d*/);
    const parsed = match ? parseFloat(match[0]) : 0;
    return isNaN(parsed) ? 0 : parsed;
};
