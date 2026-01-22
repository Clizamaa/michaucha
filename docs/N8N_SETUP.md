# Guía de configuración de n8n para Michaucha

Esta guía explica cómo configurar el flujo de trabajo en n8n para procesar mensajes de Telegram y comunicarse con la API de Michaucha.

## 1. Estructura del Flujo (Workflow)

El flujo debe tener la siguiente lógica general:

1.  **Telegram Trigger**: Recibe el mensaje de texto o audio (transcrito).
2.  **AI Agent / LLM Chain**: Analiza la intención del usuario.
3.  **HTTP Request**: Envía los datos estructurados al Webhook de Michaucha.

## 2. Configuración del Nodo AI (LLM)

El LLM debe estar configurado para devolver un objeto JSON estructurado.

### Prompt del Sistema (System Prompt)

Copia y pega esto en tu nodo de Agente o Chain de n8n:

```text
Eres un asistente de finanzas personales para la aplicación "Michaucha".
Tu objetivo es analizar el mensaje del usuario y extraer información estructurada.

Hay dos tipos de intenciones posibles:
1. 'transaction': El usuario gastó dinero o realizó una compra. Requiere un monto.
2. 'status_update': El usuario quiere marcar un gasto fijo como "Pagado" o "Pendiente" sin necesariamente especificar un monto nuevo, o explícitamente dice "Ya pagué el arriendo".

LISTA DE GASTOS FIJOS CONOCIDOS:
- Arriendo
- Almuerzos
- Locomocion
- Luz
- Celular
- Internet
- Tio Felix
- Seguro Auto
- Aseo

REGLAS:
- Si el usuario dice "Pagué el arriendo" y NO menciona un monto diferente al habitual, asume 'status_update' con isPaid: true.
- Si el usuario dice "Gaste 5000 en comida", es 'transaction'.
- Si el usuario dice "Marca la luz como pendiente", es 'status_update' con isPaid: false.
- Normaliza los nombres de categorías a la lista de gastos fijos si aplica, o usa una categoría general (Almuerzo, Supermercado, Farmacia, etc).
- Si es domingo o lunes y dice "ayer", calcula la fecha correcta.

Salida JSON esperada:
{
  "mode": "transaction" | "status_update",
  "amount": number | null,
  "category": string, // Nombre normalizado
  "fixedExpenseName": string | null, // Si coincide con un gasto fijo
  "description": string,
  "isPaid": boolean | null, // Solo para status_update
  "paymentMethod": "CASH" | "VISA" | "DEBIT"
}
```

### Esquema de Salida (Structured Output)

Si usas un nodo de "Structured Output Parser" o "LangChain", usa este esquema Zod o JSON:

```json
{
  "type": "object",
  "properties": {
    "mode": {
      "type": "string",
      "enum": ["transaction", "status_update"],
      "description": "transaction si hay un gasto de dinero, status_update si solo se cambia el estado de un pago fijo"
    },
    "amount": {
      "type": "number",
      "description": "El monto gastado. Null si es solo actualización de estado."
    },
    "category": {
      "type": "string",
      "description": "Categoría del gasto"
    },
    "description": {
      "type": "string",
      "description": "Descripción corta"
    },
    "isPaid": {
      "type": "boolean",
      "description": "True si se pagó, False si se marca como pendiente. Null si es una transacción normal."
    },
    "fixedExpenseName": {
      "type": "string",
      "description": "Nombre exacto del gasto fijo si aplica (ej: Arriendo, Luz)"
    },
    "paymentMethod": {
      "type": "string",
      "enum": ["CASH", "VISA", "DEBIT"],
      "default": "CASH"
    }
  }
}
```

## 3. Configuración del Trigger HTTP (Webhook Node)

Este es el nodo final que envía los datos a tu app Next.js.

*   **Método**: POST
*   **URL**: `https://tu-dominio-o-ngrok/api/webhooks/n8n`
*   **Authentication**: Generic Credential Type -> Header Auth
    *   Name: `x-n8n-secret`
    *   Value: (Tu secreto configurado en .env `N8N_WEBHOOK_SECRET`)

### Body Parameters (JSON)

Mapea la salida del nodo AI a estos campos:

```json
{
  "mode": "{{ $json.mode }}",
  "amount": {{ $json.amount }},
  "category": "{{ $json.category }}",
  "description": "{{ $json.description }}",
  "fixedExpenseName": "{{ $json.fixedExpenseName }}",
  "isPaid": {{ $json.isPaid }},
  "paymentMethod": "{{ $json.paymentMethod }}",
  "date": "{{ new Date().toISOString() }}"
}
```

## Pruebas

1.  **Transacción**: "Me compré un café por 3000" -> Crea gasto, mode='transaction'.
2.  **Gasto Fijo**: "Ya pagué la luz" -> mode='status_update', fixedExpenseName='Luz', isPaid=true.
3.  **Corrección**: "El arriendo todavía no lo pago" -> mode='status_update', fixedExpenseName='Arriendo', isPaid=false.
