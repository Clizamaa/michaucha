import { NextResponse } from 'next/server';
import { TransactionService } from '@/lib/transaction-service';

export async function POST(request) {
  try {
    // 1. Validate Secret
    // Ensure you have N8N_WEBHOOK_SECRET defined in your .env file
    const secret = request.headers.get('x-n8n-secret');
    const validSecret = process.env.N8N_WEBHOOK_SECRET;

    // Only check secret if it's defined in env, otherwise warn (or block)
    // For safety, we block if no env var is set to prevent accidental open access
    if (!validSecret || secret !== validSecret) {
      console.warn("Unauthorized webhook attempt or N8N_WEBHOOK_SECRET not set.");
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse Body
    const body = await request.json();
    console.log("Webhook received:", body);

    const { amount, category, description, date, paymentMethod } = body;

    // Basic validation
    if (!amount) {
      return NextResponse.json({ error: 'Amount is required' }, { status: 400 });
    }

    // 3. Create Transaction
    // TransactionService handles category resolution (name -> id) and defaulting
    const result = await TransactionService.createTransaction({
      amount: Number(amount),
      category: category, // Pass the name directly
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

    // 4. Auto-Check Fixed Expenses
    // If the transaction category matches a Fixed Expense, mark it as paid for this month.
    try {
      const transactionDate = new Date(result.data.date);
      const month = transactionDate.getMonth() + 1;
      const year = transactionDate.getFullYear();
      const categoryName = result.data.category?.name || category;

      console.log(`Checking fixed expense for category: ${categoryName}`);

      const { toggleFixedExpenseByName } = require('@/app/actions/fixed-expense');
      await toggleFixedExpenseByName(categoryName, month, year, true);

    } catch (feError) {
      console.warn("Could not auto-update fixed expense:", feError);
      // We don't fail the request if this part fails, it's a bonus feature
    }

    return NextResponse.json({ success: true, transaction: result.data });

  } catch (error) {
    console.error('[API] Webhook Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
