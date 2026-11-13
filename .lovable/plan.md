# TGVideo

## Objetivo
Crear una aplicación en español para explorar y reproducir películas y series de tus canales de Telegram, con perfiles e historial sincronizados entre dispositivos.

## 1. Biblioteca y diseño
- Sustituir la pantalla inicial por la biblioteca de TGVideo: contenido destacado, «Seguir viendo», películas, series y búsqueda.
- Diseño cinematográfico oscuro, con acentos verdes, carátulas grandes y navegación clara. En móvil, barra inferior y carruseles táctiles; en ordenador, navegación superior.
- Vistas de detalle con sinopsis, reparto, clasificación por edad, temporadas, episodios y estado visto/no visto.
- Navegación con flechas, Enter y Escape para televisión, con foco visible y desplazamiento automático.
- Skins configurables mediante `skin.json` y `skin.css`, con presentación en carruseles o cuadrícula.

## 2. Telegram y organización del catálogo
- Conectar una cuenta de Telegram mediante teléfono, código y contraseña de verificación en dos pasos cuando corresponda.
- Reconocer canales dedicados `Nombre:Grupo::Categoría::tgstorage` y canales macro `Grupo::Categoría::tgstorage`.
- Tratar «Sección:» como carpeta o serie virtual, nunca como género. Agrupar mensajes sin ese campo en «(Sin sección)».
- Leer los campos del caption y ofrecer un formulario de subida que respete el límite de 1024 unidades UTF-16: recortar únicamente la sinopsis, sin alterar la cabecera. Si la cabecera sola supera el límite, impedir el envío y avisar.
- Consultar TMDB cuando exista un identificador, guardar resultados en caché y mantener disponibles los datos del caption si el servicio falla.

## 3. Cuentas, perfiles e historial
- Activar Lovable Cloud para cuentas, perfiles, caché e historial entre dispositivos.
- Permitir varios perfiles por cuenta, avatar, límites TP/+7/+12/+16/+18 y PIN opcional de cuatro dígitos.
- Proteger el PIN mediante verificación segura, sin guardar su valor legible ni permitir eludir el control parental cambiando de perfil.
- Guardar posición y duración por perfil, canal y mensaje; marcar como completado cuando la reproducción supere el 90%, o por acción manual.
- Permitir reanudar, marcar como visto y devolver a no visto, con acceso restringido a los datos de cada cuenta.

## 4. Reproducción
- Integrar ArtPlayer y comprobar primero la reproducción real de un archivo compatible procedente de Telegram.
- Descargar por bloques con MTProto y preparar la reproducción progresiva con MediaSource cuando el formato lo permita.
- Añadir selección de audio y subtítulos solo cuando las pistas puedan extraerse y reproducirse; soporte SRT y ASS con un renderizador compatible.
- Ofrecer apertura externa en VLC/Infuse/Nova cuando el dispositivo y una dirección accesible al reproductor lo permitan.
- Mostrar errores claros para formatos o codecs incompatibles, sin presentar controles simulados como funcionales.

## 5. Android y Android TV
- Preparar Capacitor y la configuración para móvil y televisión, conservando la navegación con mando.
- Añadir un flujo de GitHub Actions para generar el APK y publicar un archivo descargable en Releases.
- Habilitar «Descargar App para Android / TV» cuando exista un release real; no utilizar una dirección de repositorio inventada.
- Documentar la generación local con Android Studio y los requisitos de firma para un APK distribuible.

## Detalles técnicos y compatibilidad
- Conservar TanStack Start, React y Tailwind del proyecto existente. La primera pantalla estará en `/`; las demás secciones tendrán páginas propias.
- Aislar GramJS y las bibliotecas de reproducción del renderizado del servidor, y mantener credenciales privadas fuera del código público.
- La especificación propone alojamiento estático en Vercel. La aplicación inicial se construirá para el alojamiento de Lovable; un despliegue independiente en Vercel requerirá validar su configuración y no se dará por resuelto automáticamente.
- Descargar bloques de un MKV no basta para reproducirlo con MediaSource: puede requerir demultiplexado, remultiplexado o conversión externa. El soporte universal de MKV, DTS y Dolby no se puede garantizar en un navegador.
- Un enlace `vlc://` por sí solo no transmite una sesión MTProto al reproductor externo. La integración necesitará una fuente que ese reproductor pueda abrir y se validará en un dispositivo real.
- Para servicios reales harán falta las credenciales de la aplicación Telegram, una cuenta con acceso a los canales y una clave de TMDB. Se solicitarán mediante los mecanismos seguros correspondientes; nunca en el código ni como texto del chat.
- La distribución Android requiere un repositorio de GitHub, configuración de firma y una compilación verificada. La web no genera el APK por sí misma.

## Verificación y entrega
- Añadir pruebas concretas para nombres de canales, agrupación por sección, longitud UTF-16 del caption, límites parentales y umbral de finalización superior al 90%.
- Comprobar búsqueda, detalles, conexión, perfiles y reanudación con datos reales cuando estén disponibles las credenciales.
- Revisar ordenador y móvil de 390 × 844, y probar el manejo por teclado; la APK y los reproductores externos necesitan comprobación adicional en Android/TV.
- Mantener una lista de tareas y señalar explícitamente lo que quede pendiente de credenciales, servicios externos o dispositivos, sin confundir una biblioteca de muestra con la conexión real.