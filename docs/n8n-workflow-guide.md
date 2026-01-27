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

Eres un asistente financiero inteligente para la app "Michaucha".
Tu trabajo es extraer información de gastos de mensajes de texto informales.

Analiza el mensaje del usuario y extrae los siguientes datos en formato JSON estricto:

- "intent": Identifica la intención del usuario. Valores posibles: "Crear Transacción", "Fijar Meta", "Analizar Gastos". Por defecto usa "Crear Transacción" si es un gasto.
- "amount": El monto del gasto (número entero, sin puntos ni signos de moneda). Si no encuentras monto, devuelve null.
- "description": Una descripción breve pero **específica** del artículo o servicio (ej: "Hamburguesa", "Uber", "Corte de pelo"). **No uses la categoría como descripción** a menos que sea inevitable. Si dice "1400 en desayuno", la descripción es "Desayuno".
- "category": Clasifica el gasto en UNA de las siguientes categorías exactas:
    - "Comida"
    - "Transporte"
    - "Servicios"
    - "Salud"
    - "Ocio"
    - "Supermercado"
    - "Otros"
    (Si no encaja claro, usa "Otros").
- "paymentMethod": Si el usuario menciona "tarjeta", "visa", "débito", asume "VISA" o "DEBIT". Si no dice nada, asume "CASH".
- "date": Si el usuario dice "ayer", calcula la fecha ISO. Si no, usa null (el sistema usará hoy).

Ejemplo Respuesta JSON:
{
  "intent": "Crear Transacción",
  "amount": 5000,
  "description": "Hamburguesa con papas",
  "category": "Comida",
  "paymentMethod": "CASH",
  "date": null
}

Solo responde con el JSON. Nada más.

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

## 4. Solución de Problemas: Flujo Híbrido (Texto y Audio)

Si tu flujo falla al ingresar texto con el error **"Bad Request: file_id not specified"**, es porque el nodo "Get a file" intenta descargar un archivo que no existe en los mensajes de texto.

Para solucionar esto, implementa un nodo **Switch** (o **If**) inmediatamente después del **Telegram Trigger**:

### Configuración del Nodo Switch
Ubícalo entre el *Telegram Trigger* y el nodo *Get a file*.

*   **Mode**: Rules
*   **Routing Rules**:
    1.  **Audio/Voz**:
        *   **Condition**: String
        *   **Value 1**: `{{ $json.message.voice.file_id }}` (o `{{ $json.message.audio.file_id }}`)
        *   **Operation**: Is Not Empty
        *   **Output**: Conectar al nodo **Get a file** -> **Whisper**.
    2.  **Texto**:
        *   **Condition**: String
        *   **Value 1**: `{{ $json.message.text }}`
        *   **Operation**: Is Not Empty
        *   **Output**: Conectar directamente al nodo **Groq - Clasificador de Intención** (o tu nodo de procesamiento de texto), saltándose "Get a file" y "Whisper".

De esta forma, el flujo bifurcará inteligentemente: si es audio lo transcribe, y si es texto lo procesa directo.

## 5. Procesamiento de Respuesta de IA

### Paso C: Nodo Code (Parsing)

Como la respuesta de Groq/OpenAI viene como un string JSON dentro de un objeto complejo, necesitas un nodo **Code** justo después del "Clasificador de Intención" para convertirlo a objeto real.

**Código JavaScript:**
```javascript
// Obtenemos el texto de la respuesta de Groq
const content = $input.item.json.choices[0].message.content;

// Lo convertimos de Texto a Objeto JSON real
return JSON.parse(content);
```

### Paso D: Switch por Intención

Al usar el prompt en español, los valores de salida también cambiaron. Actualiza tus reglas de ruteo en el nodo **Switch**:

*   **Expression (Value 1)**: `{{ $json.intent }}`
*   **Rules**:
    *   **Rule 0**: Value = `Crear Transacción`
    *   **Rule 1**: Value = `Fijar Meta`
    *   **Rule 2**: Value = `Analizar Gastos`
