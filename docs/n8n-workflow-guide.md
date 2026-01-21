# Guía de Implementación n8n - Michaucha

Esta guía detalla cómo configurar n8n para enviar gastos a Michaucha.

## 1. Configuración de Michaucha

Asegúrate de agregar la siguiente variable a tu archivo `.env` local en Michaucha:

```env
N8N_WEBHOOK_SECRET=tu_secreto_super_seguro_123
```

*(Recuerda reiniciar tu servidor Next.js después de cambiar el .env)*

## 2. Flujo en n8n

Tu flujo en n8n debería verse así:

1.  **Webhook / Telegram Trigger / WhatsApp Trigger**: Recibe el mensaje del usuario.
2.  **OpenAI (ChatGPT)**: Procesa el texto para extraer datos estructurados.
3.  **HTTP Request**: Envía los datos a Michaucha.

### Paso A: Nodo OpenAI (ChatGPT)

Configura el nodo para que actúe como un extractor de datos JSON.

*   **Model**: GPT-4o o GPT-3.5-turbo
*   **System Message (Prompt)**:

```text
Eres un asistente financiero inteligente para la app "Michaucha".
Tu trabajo es extraer información de gastos de mensajes de texto informales.

Analiza el mensaje del usuario y extrae los siguientes datos en formato JSON estricto:

- "amount": El monto del gasto (número entero, sin puntos ni signos de moneda). Si no encuentras monto, devuelve null.
- "description": Una descripción breve y clara del gasto (ej: "Almuerzo", "Uber a casa").
- "category": Clasifica el gasto en UNA de las siguientes categorías exactas:
    - "Comida"
    - "Transporte"
    - "Servicios"
    - "Salud"
    - "Ocio"
    - "Supermercado"
    - "Otros"
    (Si no encaja claro, usa "Otros" o inventa una categoría corta y lógica de 1 palabra).
- "paymentMethod": Si el usuario menciona "tarjeta", "visa", "débito", asume "VISA" o "DEBIT". Si no dice nada, asume "CASH".
- "date": Si el usuario dice "ayer", calcula la fecha ISO. Si no, usa null (el sistema usará hoy).

Ejemplo Respuesta JSON:
{
  "amount": 5000,
  "description": "Hamburguesa con papas",
  "category": "Comida",
  "paymentMethod": "CASH",
  "date": null
}

Solo responde con el JSON. Nada más.
```

### Paso B: Nodo HTTP Request

Este nodo enviará los datos a tu aplicación Michaucha.

*   **Method**: POST
*   **URL**: `https://tu-dominio-o-ngrok.com/api/webhooks/n8n`
    *   *Nota: Si estás probando localmente, usa un túnel como ngrok.*
*   **Authentication**: None (usaremos Header).
*   **Headers**:
    *   Name: `x-n8n-secret`
    *   Value: `tu_secreto_super_seguro_123` (Igual al de tu .env)
*   **Body Content Type**: JSON
*   **Body Parameters**:
    *   `amount`: `{{ $json.amount }}`
    *   `description`: `{{ $json.description }}`
    *   `category`: `{{ $json.category }}`
    *   `paymentMethod`: `{{ $json.paymentMethod }}`
    *   `date`: `{{ $json.date }}`

## 3. Prueba

Envía un mensaje como: *"Gaste 10 lucas en bencina"*
El sistema debería crear una transacción de 10000, categoría Transporte, descripción Bencina.
