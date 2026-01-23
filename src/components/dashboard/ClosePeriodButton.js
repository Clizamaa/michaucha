'use client';

import { useState } from 'react';
import { closePeriod } from '@/app/actions/period';

export default function ClosePeriodButton() {
    const [isLoading, setIsLoading] = useState(false);

    const handleClose = async () => {
        if (!confirm("¿Estás seguro de que quieres cerrar el periodo actual? Esto reiniciará los gastos fijos para el nuevo periodo.")) {
            return;
        }

        setIsLoading(true);
        try {
            const result = await closePeriod();
            if (result.success) {
                alert("Periodo cerrado exitosamente. ¡Bienvenido al nuevo periodo!");
                // La acción ya hace revalidatePath, así que la UI se actualizará
            } else {
                alert("Error al cerrar el periodo");
            }
        } catch (error) {
            console.error(error);
            alert("Ocurrió un error inesperado");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handleClose}
            disabled={isLoading}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50"
        >
            {isLoading ? 'Cerrando...' : 'Cerrar Periodo'}
        </button>
    );
}
