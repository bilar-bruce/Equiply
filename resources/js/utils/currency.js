/**
 * Currency utility for formatting amounts in Philippine Peso (PHP / ₱).
 */
export const formatPHP = (amount) => {
    const val = Number(amount) || 0;
    return `₱${val.toFixed(2)}`;
};

export default formatPHP;
