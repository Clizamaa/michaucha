import { NextResponse } from 'next/server';
import { TransactionService } from '@/lib/transaction-service';
import { toggleFixedExpenseByName } from '@/app/actions/fixed-expense';
import { updateSavingsGoal, getCurrentPeriod } from '@/app/actions/period';
import { getPeriodSpendingAnalysis } from '@/lib/analysis';

export async function POST(request) {
  try {
    // 1. Validar Secreto
    // Asegúrate de tener N8N_WEBHOOK_SECRET definido en tu archivo .env
    const secret = request.headers.get('x-n8n-secret');
    const validSecret = process.env.N8N_WEBHOOK_SECRET;

    // Solo verificar el secreto si está definido en env, de lo contrario advertir (o bloquear)
    // Por seguridad, bloqueamos si no hay variable de entorno configurada para evitar acceso abierto accidental
    if (!validSecret || secret !== validSecret) {
      console.warn("Unauthorized webhook attempt or N8N_WEBHOOK_SECRET not set.");
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Analizar Cuerpo
    const body = await request.json();
    console.log("Webhook received:", body);

    const { amount, category, description, date, paymentMethod, mode, isPaid, fixedExpenseName } = body;

    // -------------------------------------------------------------
    // NUEVO MODO: Establecer Meta de Ahorro
    // -------------------------------------------------------------
    if (mode === 'set_savings_goal') {
      if (!amount) {
        return NextResponse.json({ error: 'Amount is required for savings goal' }, { status: 400 });
      }

      const activePeriod = await getCurrentPeriod();
      const updateResult = await updateSavingsGoal(activePeriod.id, amount);

      if (!updateResult.success) {
        return NextResponse.json({ error: updateResult.error }, { status: 500 });
      }

      // Obtener contexto histórico para la IA
      const analysis = await getPeriodSpendingAnalysis(3); // Últimos 3 periodos cerrados

      return NextResponse.json({
        success: true,
        message: `Meta de ahorro actualizada a ${amount}`,
        goal: amount,
        context: {
          currentGoal: amount,
          analysis // Incluye promedios de gastos, ingresos, etc.
        }
      });
    }

    // -------------------------------------------------------------
    // MODO: Actualizar solo estado de Gasto Fijo
    // -------------------------------------------------------------
    // Si mode es 'status_update' o si no hay amount pero sí un nombre de gasto fijo explícito
    if (mode === 'status_update' || (!amount && (fixedExpenseName || category))) {
      const targetName = fixedExpenseName || category;
      const targetDate = date ? new Date(date) : new Date();
      // Nota: Si usamos periodos, idealmente deberíamos buscar el periodo por fecha
      // pero por ahora el toggleFixedExpenseByName busca periodo activo si no se da ID.
      // Podríamos mejorar esto pasando el ID del periodo correcto.

      // isPaid debe ser booleano. Si viene como string 'true', convertirlo. Si es undefined, asumimos true (marcar pagado).
      const paidStatus = isPaid === undefined ? true : (String(isPaid) === 'true' || isPaid === true);

      console.log(`[Webhook] Actualizando estado de gasto fijo: ${targetName} -> ${paidStatus ? 'PAGADO' : 'PENDIENTE'}`);

      // Usamos null para periodId para que busque el activo por defecto
      const result = await toggleFixedExpenseByName(targetName, null, paidStatus);

      if (!result.success) {
        console.warn(`[Webhook] Error al actualizar gasto fijo: ${result.error}`);
        // Si falla porque no existe el gasto, devolvemos error 404
        if (result.error && result.error.includes('no encontrado')) {
          return NextResponse.json({ error: result.error }, { status: 404 });
        }
        return NextResponse.json({ error: result.error }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: `Gasto fijo '${targetName}' marcado como ${paidStatus ? 'PAGADO' : 'PENDIENTE'}`,
        data: result
      });
    }

    // -------------------------------------------------------------
    // MODO POR DEFECTO: Crear Transacción
    // -------------------------------------------------------------

    // Validación básica para transacciones
    if (!amount) {
      return NextResponse.json({ error: 'Amount is required for transaction creation' }, { status: 400 });
    }

    // 3. Crear Transacción
    // TransactionService maneja la resolución de categoría (nombre -> id) y valores predeterminados
    const result = await TransactionService.createTransaction({
      amount: Number(amount),
      category: category, // Pasar el nombre directamente
      description: description,
      date: date || new Date(),
      paymentMethod: paymentMethod || 'CASH'
    });

    console.log("Create Result:", result);

    if (!result.success) {
      console.error("Failed to create transaction:", result.error);
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    console.log("Transaction created successfully:", result.data);

    // 4. Auto-Verificar Gastos Fijos
    // Si la categoría de la transacción coincide con un Gasto Fijo, marcarlo como pagado para este mes.
    try {
      const categoryName = result.data.category?.name || category;
      console.log(`Checking fixed expense for category: ${categoryName}`);
      // Auto-update fixed expense in active period
      await toggleFixedExpenseByName(categoryName, null, true);

    } catch (feError) {
      console.warn("Could not auto-update fixed expense:", feError);
      // No fallamos la solicitud si esta parte falla, es una característica adicional
    }

    return NextResponse.json({ success: true, transaction: result.data });

  } catch (error) {
    console.error('[API] Webhook Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
