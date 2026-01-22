'use client';

import { Trash2 } from "lucide-react";
import { deleteTransaction } from "@/app/actions/transaction";
import { useState } from "react";

export default function DeleteButton({ id, className }) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async (e) => {
        e.preventDefault(); // Prevenir navegación de enlace si está dentro de un enlace
        e.stopPropagation();

        if (!confirm("¿Estás seguro de eliminar este gasto?")) return;

        setIsDeleting(true);
        try {
            await deleteTransaction(id);
        } catch (error) {
            alert("Error al eliminar");
            setIsDeleting(false);
        }
    };

    return (
        <button
            onClick={handleDelete}
            disabled={isDeleting}
            className={`p-2 rounded-lg text-slate-500 hover:text-red-500 hover:bg-red-500/10 transition-colors ${className}`}
            title="Eliminar"
        >
            <Trash2 size={16} className={isDeleting ? "animate-pulse" : ""} />
        </button>
    );
}
