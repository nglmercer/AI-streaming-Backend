# Characters API - Ejemplos de Uso

## Endpoints Disponibles

### 1. GET /characters
Obtiene todos los personajes disponibles.

```bash
curl http://localhost:12393/characters
```

**Respuesta:**
```json
{
  "success": true,
  "data": ["mili", "luna", "exact"],
  "count": 3
}
```

### 2. GET /characters/:name
Obtiene la configuración de un personaje específico.

```bash
curl http://localhost:12393/characters/mili
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "name": "mili",
    "config": {
      "name": "Mili",
      "personality": "...",
      "background": "..."
    }
  }
}
```

### 3. GET /characters/:name/prompt
Genera el prompt completo para un personaje.

```bash
curl "http://localhost:12393/characters/mili/prompt?humanName=Juan"
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "character": "mili",
    "humanName": "Juan",
    "prompt": "Generated prompt text..."
  }
}
```

### 4. POST /characters
Crea un nuevo personaje.

```bash
curl -X POST http://localhost:12393/characters \
  -H "Content-Type: application/json" \
  -d '{
    "name": "alex",
    "config": {
      "name": "Alex",
      "personality": "Friendly and helpful AI assistant",
      "background": "Tech enthusiast with a passion for coding",
      "speaking_style": "Casual and informative",
      "interests": ["programming", "technology", "problem-solving"]
    }
  }'
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Character \"alex\" created successfully",
  "data": {
    "name": "alex",
    "config": { ... },
    "path": "/path/to/alex.json"
  }
}
```

### 5. PUT /characters/:name
Actualiza completamente un personaje existente.

```bash
curl -X PUT http://localhost:12393/characters/alex \
  -H "Content-Type: application/json" \
  -d '{
    "config": {
      "name": "Alex Updated",
      "personality": "Very friendly and extremely helpful",
      "background": "Senior developer with 10+ years experience",
      "speaking_style": "Professional yet approachable",
      "interests": ["advanced programming", "AI", "mentoring"]
    }
  }'
```

### 6. PATCH /characters/:name
Actualiza parcialmente un personaje.

```bash
curl -X PATCH http://localhost:12393/characters/alex \
  -H "Content-Type: application/json" \
  -d '{
    "personality": "Super friendly and always ready to help",
    "new_field": "This is a new field"
  }'
```

### 7. DELETE /characters/:name
Elimina un personaje.

```bash
curl -X DELETE http://localhost:12393/characters/alex
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Character \"alex\" deleted successfully"
}
```

### 8. GET /characters/prompts/all
Obtiene todos los prompts generados.

```bash
curl "http://localhost:12393/characters/prompts/all?humanName=Maria"
```

### 9. POST /characters/prompts/multiple
Obtiene prompts para múltiples personajes.

```bash
curl -X POST http://localhost:12393/characters/prompts/multiple \
  -H "Content-Type: application/json" \
  -d '{
    "characters": ["mili", "luna"],
    "humanName": "Carlos"
  }'
```

## Estructura de un Personaje

Un archivo de personaje debe tener esta estructura básica:

```json
{
  "name": "Nombre del Personaje",
  "personality": "Descripción de la personalidad",
  "background": "Historia/contexto del personaje",
  "speaking_style": "Estilo de comunicación",
  "interests": ["interés1", "interés2"],
  "special_abilities": "Habilidades especiales (opcional)",
  "catchphrase": "Frase característica (opcional)"
}
```

## Manejo de Errores

Todos los endpoints devuelven errores en formato JSON:

```json
{
  "success": false,
  "error": "Descripción del error",
  "available": ["lista", "de", "personajes"] // cuando aplique
}
```

## Códigos de Estado HTTP

- `200` - Éxito
- `201` - Creado exitosamente
- `400` - Error en la petición
- `404` - Personaje no encontrado
- `409` - Conflicto (personaje ya existe)
- `500` - Error interno del servidor