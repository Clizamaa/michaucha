import { NextResponse } from 'next/server';
import { TransactionService } from '@/lib/transaction-service';
import { parseTransaction } from '@/lib/voice-parser';
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';

// Initialize OpenAI
// Initialize OpenAI lazily
// const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

async function sendTelegramMessage(chatId, text) {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text }),
    });
}

export async function POST(req) {
    try {
        const update = await req.json();

        if (!update.message) {
            return NextResponse.json({ ok: true });
        }

        const chatId = update.message.chat.id;
        const voice = update.message.voice;

        if (!voice) {
            // If it's text, we could also parse it!
            if (update.message.text) {
                const parsed = parseTransaction(update.message.text);
                if (parsed) {
                    const result = await TransactionService.createTransaction(parsed);
                    if (result.success) {
                        await sendTelegramMessage(chatId, `✅ Gasto guardado: $${result.data.amount} en ${result.data.category.name}`);
                    } else {
                        await sendTelegramMessage(chatId, `❌ Error al guardar: ${result.error}`);
                    }
                    return NextResponse.json({ ok: true });
                }
                await sendTelegramMessage(chatId, "No entendí ese gasto. Intenta: 'Almuerzo 5000'");
                return NextResponse.json({ ok: true });
            }
            return NextResponse.json({ ok: true });
        }

        // Handle Voice
        // 1. Get File Path
        const fileRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/getFile?file_id=${voice.file_id}`);
        const fileData = await fileRes.json();
        const filePath = fileData.result.file_path;

        // 2. Download File
        const fileUrl = `https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${filePath}`;
        const audioRes = await fetch(fileUrl);
        const buffer = await audioRes.arrayBuffer();

        // 3. Save temp file (OpenAI needs a file stream or path usually)
        const tempDir = path.join(process.cwd(), 'tmp');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
        const tempFilePath = path.join(tempDir, `voice_${voice.file_id}.ogg`);
        fs.writeFileSync(tempFilePath, Buffer.from(buffer));

        // 4. Transcribe with Whisper
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        const transcription = await openai.audio.transcriptions.create({
            file: fs.createReadStream(tempFilePath),
            model: "whisper-1",
            language: "es",
        });

        const text = transcription.text;
        await sendTelegramMessage(chatId, `🗣 Recibido: "${text}"`);

        // 5. Parse and Save
        const parsed = parseTransaction(text);
        if (!parsed) {
            await sendTelegramMessage(chatId, "❌ No pude detectar un gasto en ese audio.");
        } else {
            const result = await TransactionService.createTransaction(parsed);
            if (result.success) {
                await sendTelegramMessage(chatId, `✅ Registrado: $${result.data.amount} - ${result.data.category.name} (${parsed.paymentMethod})`);
            } else {
                await sendTelegramMessage(chatId, `❌ Error guardando: ${result.error}`);
            }
        }

        // Cleanup
        fs.unlinkSync(tempFilePath);

        return NextResponse.json({ ok: true });

    } catch (error) {
        console.error("Telegram Webhook Error:", error);
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
}
