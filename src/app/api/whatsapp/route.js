import { NextResponse } from 'next/server';
import { TransactionService } from '@/lib/transaction-service';
import { parseTransaction } from '@/lib/voice-parser';
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';

// OpenAI initialized lazily inside handler to prevent build errors
// const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Twilio credentials (if using Twilio SDK to send replies)
// const client = require('twilio')(accountSid, authToken); 

async function sendTwilioReply(to, body) {
    // Implementation depends on using Twilio SDK or TwiML response.
    // For Webhook, we can often just return TwiML.
    // But for async, we might use the SDK.
    // Minimal placeholder:
    console.log(`[WhatsApp] Sending reply to ${to}: ${body}`);
}

export async function POST(req) {
    try {
        const formData = await req.formData();
        const Body = formData.get('Body'); // Text message
        const From = formData.get('From');
        const NumMedia = formData.get('NumMedia');
        const MediaUrl0 = formData.get('MediaUrl0');
        const MediaContentType0 = formData.get('MediaContentType0');

        if (parseInt(NumMedia) > 0 && MediaContentType0.includes('audio')) {
            // Handle Audio
            // Twilio media requires Auth usually if "Enforce Basic Auth" is on. Assuming public or Auth handled.

            // 1. Download
            const audioRes = await fetch(MediaUrl0);
            const buffer = await audioRes.arrayBuffer();

            // 2. Transcribe
            const tempDir = path.join(process.cwd(), 'tmp');
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
            const tempFilePath = path.join(tempDir, `wa_${Date.now()}.ogg`);
            fs.writeFileSync(tempFilePath, Buffer.from(buffer));

            const openai = new OpenAI({
                apiKey: process.env.OPENAI_API_KEY,
            });

            const transcription = await openai.audio.transcriptions.create({
                file: fs.createReadStream(tempFilePath),
                model: "whisper-1",
                language: "es",
            });

            const text = transcription.text;

            // 3. Parse and Save
            const parsed = parseTransaction(text);
            if (!parsed) {
                await sendTwilioReply(From, "No pude entender el gasto.");
            } else {
                const result = await TransactionService.createTransaction(parsed);
                if (result.success) {
                    await sendTwilioReply(From, `✅ Gasto: ${result.data.amount} en ${result.data.category.name}`);
                } else {
                    await sendTwilioReply(From, `Error: ${result.error}`);
                }
            }

            fs.unlinkSync(tempFilePath);

        } else if (Body) {
            // Handle Text
            const parsed = parseTransaction(Body);
            if (parsed) {
                const result = await TransactionService.createTransaction(parsed);
                if (result.success) {
                    await sendTwilioReply(From, `✅ Gasto: ${result.data.amount} en ${result.data.category.name}`);
                }
            }
        }

        // Return TwiML or OK
        return new NextResponse('<Response></Response>', {
            headers: { 'Content-Type': 'text/xml' }
        });

    } catch (error) {
        console.error("WhatsApp Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
