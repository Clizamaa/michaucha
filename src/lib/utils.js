import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility to merge Tailwind classes
 */
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

/**
 * Format number to Chilean Peso (CLP)
 */
export function formatCLP(amount) {
    return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}
