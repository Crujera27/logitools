# 🤖 Sistema de Moderación Automática con IA

## Descripción General

Este sistema implementa moderación automática avanzada utilizando **Llama Guard 3** de Meta, un modelo especializado en clasificación de contenido seguro/inseguro. El sistema analiza mensajes en tiempo real y aplica sanciones automáticas basadas en el contenido detectado.

## Características Principales

### 🧠 Análisis Contextual Inteligente
- **Historial de mensajes**: El sistema recopila los últimos 5 mensajes del usuario para proporcionar contexto completo al AI
- **Ventana temporal**: Mensajes dentro de los últimos 5 minutos son considerados para el análisis
- **Análisis multicanal**: El contexto incluye información del canal donde se envió cada mensaje

### 🛡️ Categorización Avanzada de Contenido
El sistema utiliza la taxonomía MLCommons de 13 categorías de peligros:

- **S1 - Crímenes Violentos**: Contenido que promueve violencia → **Ban automático**
- **S2 - Crímenes No Violentos**: Fraude, estafas, hacking → **Warn grave**
- **S3 - Crímenes Sexuales**: Acoso sexual, contenido inapropiado → **Ban automático**
- **S4 - Explotación Infantil**: Cualquier contenido relacionado → **Ban automático**
- **S5 - Difamación**: Información falsa dañina → **Warn grave**
- **S6 - Consejos Especializados**: Consejos médicos/legales peligrosos → **Warn medio**
- **S7 - Privacidad**: Compartir información personal → **Warn grave**
- **S8 - Propiedad Intelectual**: Violación de derechos → **Warn medio**
- **S9 - Armas Indiscriminadas**: Contenido sobre armas peligrosas → **Ban automático**
- **S10 - Discurso de Odio**: Discriminación por características personales → **Warn grave**
- **S11 - Autolesión**: Contenido sobre suicidio o autolesión → **Warn grave**
- **S12 - Contenido Sexual**: Material erótico → **Warn medio**
- **S13 - Elecciones**: Desinformación electoral → **Warn medio**

### 📋 Niveles de Sanción Automática

1. **warn_mild** (Leve): Violaciones menores de las reglas
2. **warn_middle** (Medio): Violaciones moderadas
3. **warn_severe** (Grave): Violaciones serias
4. **ban**: Violaciones extremas que requieren expulsión inmediata

### 📨 Notificaciones Transparentes
- **Notificación obligatoria**: Todos los usuarios sancionados reciben un DM explicando que la sanción fue aplicada automáticamente por IA
- **Información contextual**: Se incluye el canal donde ocurrió la infracción y la razón específica
- **Proceso de apelación**: Se proporciona información sobre cómo apelar decisiones automáticas

## Configuración

### 🔧 Configuración del Servidor Ollama

1. **Instalar Ollama** en tu servidor:
   ```bash
   curl -fsSL https://ollama.com/install.sh | sh
   ```

2. **Descargar Llama Guard 3**:
   ```bash
   ollama pull llama-guard3:8b  # Versión completa (recomendada)
   # o
   ollama pull llama-guard3:1b  # Versión ligera (más rápida)
   ```

3. **Configurar el archivo configuration.toml**:
   ```toml
   [ai]
   enabled=true
   assistant_name="LogikkGuard"
   ollama_host="http://tu-servidor-ollama:11434"  # Cambiar por tu URL
   ollama_model="llama-guard3:8b"
   ```

### 🗄️ Configuración de Base de Datos

Ejecuta el script SQL proporcionado (`database_ai_moderation.sql`) para crear las tablas necesarias:

```sql
-- Ejecutar en tu base de datos MySQL
source database_ai_moderation.sql;
```

### ⚙️ Configuración de Reglas

Edita el archivo `config/prompts/automod.txt` para personalizar las reglas específicas de tu servidor.

## Uso

### 🎛️ Comandos de Administración

#### `/aimod toggle <enabled>`
Activa o desactiva el sistema de moderación por IA
```
/aimod toggle enabled:true   # Activar
/aimod toggle enabled:false  # Desactivar
```

#### `/aimod status`
Muestra el estado actual del sistema y estadísticas de las últimas 24 horas

#### `/aimod stats [days]`
Muestra estadísticas detalladas del período especificado (por defecto: 7 días)

#### `/aimod logs [user] [limit]`
Muestra los logs recientes de moderación por IA, opcionalmente filtrados por usuario

### 🛠️ Funcionalidades de Bypass

- **Administradores**: Tienen bypass automático por permisos
- **Roles especiales**: Se pueden configurar roles con bypass en la base de datos
- **Configuración flexible**: Sistema de allowlist para dominios y patrones seguros

## Monitoreo y Logs

### 📊 Métricas Disponibles
- Total de análisis realizados
- Número de sanciones aplicadas por tipo
- Usuarios únicos analizados
- Distribución por categorías de Llama Guard 3
- Tendencias temporales

### 📝 Logs Detallados
Cada decisión de la IA se registra con:
- Usuario y contenido del mensaje
- Decisión de la IA y categoría detectada
- Sanción aplicada (si corresponde)
- Contexto de mensajes previos
- Timestamp de la acción

## Personalización

### 🎯 Ajuste de Sensibilidad
Puedes modificar el mapeo de categorías a sanciones editando la función `mapGuardCategoryToPunishment()` en `messageCreate.js`.

### 📝 Personalización de Mensajes
Los mensajes de DM enviados a usuarios sancionados se pueden personalizar en la función `sendAutomatedPunishmentDM()`.

### 🔄 Configuración de Contexto
- `AI_CONTEXT_MESSAGES`: Número de mensajes a incluir en el contexto (por defecto: 5)
- `AI_CONTEXT_TIME_WINDOW`: Ventana temporal para el contexto (por defecto: 5 minutos)

## Consideraciones de Rendimiento

- **Latencia**: Cada análisis de IA toma 1-3 segundos dependiendo del modelo y servidor
- **Recursos**: Llama Guard 3-8B requiere al menos 8GB de RAM
- **Versión ligera**: Llama Guard 3-1B es más rápida pero menos precisa
- **Cache**: El sistema implementa cache para patrones y configuraciones

## Solución de Problemas

### ❌ Errores Comunes

1. **"AI moderation response was empty"**: Verificar conectividad con servidor Ollama
2. **"Failed to apply automated punishment"**: Revisar permisos del bot y configuración de base de datos
3. **"Error in AI moderation"**: Comprobar logs del servidor Ollama

### 🔍 Debug
Activar logs detallados editando el nivel de logging en la configuración del bot.

## Seguridad y Privacidad

- **Almacenamiento de mensajes**: Solo se almacenan logs para análisis, no mensajes completos
- **Retención de datos**: Configurar políticas de eliminación según normativas
- **Transparencia**: Usuarios son notificados sobre el uso de IA para moderación
- **Apelaciones**: Sistema claro para disputar decisiones automáticas

## Roadmap Futuro

- [ ] Interfaz web para gestión de configuraciones
- [ ] Sistema de machine learning para mejorar precisión
- [ ] Integración con otros modelos de IA
- [ ] Análisis de imágenes y archivos adjuntos
- [ ] Dashboard de métricas en tiempo real
- [ ] API para integraciones externas

## Contribuciones

Para contribuir al sistema de moderación por IA, por favor:

1. Revisar los logs de falsos positivos/negativos
2. Proponer mejoras en el mapeo de categorías
3. Sugerir nuevas métricas de monitoreo
4. Reportar bugs y problemas de rendimiento

## Soporte

Para soporte técnico con el sistema de moderación por IA:
- Revisar los logs del sistema (`/aimod logs`)
- Verificar el estado del servicio (`/aimod status`)
- Comprobar la configuración del servidor Ollama
- Contactar al equipo de desarrollo con información detallada del problema
