import { format } from "date-fns";
import { es } from "date-fns/locale";

export const CATEGORIES = {
    ARRIENDO: ["arriendo", "depósito", "casa", "depto", "departamento"],
    ALMUERZO: ["almuerzo", "comida", "restaurante", "colación", "sushi", "pizza", "hamburguesa", "mcdonalds", "burger"],
    LOCOMOCION: ["locomoción", "uber", "didi", "cabify", "bus", "metro", "bencina", "estacionamiento", "peaje", "copec", "shell"],
    LUZ: ["luz", "electricidad", "enel", "cge"],
    CELULAR: ["celular", "plan", "recarga", "entel", "wom", "movistar", "claro"],
    ASEO: ["aseo", "municipal", "basura"],
    VTR: ["vtr", "internet", "cable", "wifi"],
    TIO_FELIX: ["tío félix", "tío felix", "felix"],
    SEGURO_AUTO: ["seguro auto", "seguro del auto"],
    VISA: ["con visa", "pagué con visa", "tarjeta de crédito", "usé la visa"],
};

function parseAmount(text) {
    if (!text) return null;
    // Normalize text
    let cleanText = text.toLowerCase()
        .replace(/[$.]/g, "") // Remove $ and dots
        .replace(/,/g, ".");  // Replace comma with dot (if decimal)

    // Handle textual numbers common in speech (simple mapping)
    const textNumbers = {
        'un': 1, 'una': 1, 'dos': 2, 'tres': 3, 'cuatro': 4, 'cinco': 5,
        'seis': 6, 'siete': 7, 'ocho': 8, 'nueve': 9, 'diez': 10,
        'once': 11, 'doce': 12, 'trece': 13, 'catorce': 14, 'quince': 15,
        'veinte': 20
    };

    // Replace text numbers followed by "mil"
    // e.g. "doce mil" -> "12 mil"
    for (const [word, val] of Object.entries(textNumbers)) {
        const regex = new RegExp(`\\b${word}\\s+mil\\b`, 'g');
        if (cleanText.match(regex)) {
            cleanText = cleanText.replace(regex, `${val}000`);
        }
    }

    // Regex for "X mil" -> X*1000
    const milMatch = cleanText.match(/(\d+)\s*mil/);
    if (milMatch) {
        return parseInt(milMatch[1], 10) * 1000;
    }

    // Regex for plain numbers
    // Look for biggest number in string as amount? Or first?
    // Usually amount is the most significant number.
    const numberMatches = cleanText.match(/(\d+)/g);
    if (numberMatches) {
        // Filter out small numbers that might be dates (e.g. "dia 5") if we have larger ones
        const numbers = numberMatches.map(n => parseInt(n, 10));
        const maxNum = Math.max(...numbers);
        // Heuristic: If max number is > 1000, use it. Else use first?
        // "2 lucas" -> need "luca" support?
        if (cleanText.includes("luca") || cleanText.includes("lucas")) {
            const lucaMatch = cleanText.match(/(\d+)\s*luca/);
            if (lucaMatch) return parseInt(lucaMatch[1], 10) * 1000;
            // "una luca" handled by textNumbers? "una" -> 1. "1000".
            if (cleanText.includes("una luca")) return 1000;
        }

        return maxNum; // Default to largest found number
    }

    return null;
}

function parseCategory(text) {
    const lowerText = text.toLowerCase();

    for (const [key, keywords] of Object.entries(CATEGORIES)) {
        if (key === 'VISA') continue; // Handled separately
        if (keywords.some(k => lowerText.includes(k))) {
            return key.charAt(0) + key.slice(1).toLowerCase().replace('_', ' '); // Format nicely
        }
    }

    return "Gastos varios"; // Default
}

function parsePaymentMethod(text) {
    const lowerText = text.toLowerCase();
    // Check specifically for VISA phrases
    if (CATEGORIES.VISA.some(k => lowerText.includes(k))) {
        return "VISA";
    }
    return "CASH";
}

function parseDate(text) {
    const lower = text.toLowerCase();
    const today = new Date();

    if (lower.includes("ayer")) {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return yesterday;
    }

    // "lunes pasado", etc could be added here.
    return today;
}

export function parseTransaction(text) {
    if (!text) return null;

    const amount = parseAmount(text);
    const category = parseCategory(text);
    const paymentMethod = parsePaymentMethod(text);
    const date = parseDate(text);
    const description = text.charAt(0).toUpperCase() + text.slice(1);

    if (!amount) return null; // Invalid if no amount found

    return {
        amount,
        category,
        date,
        description,
        paymentMethod
    };
}
