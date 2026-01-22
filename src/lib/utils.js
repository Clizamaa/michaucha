import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utilidad para fusionar clases de Tailwind
 */
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

/**
 * Formatear número a Peso Chileno (CLP)
 */
export function formatCLP(amount) {
    return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}
