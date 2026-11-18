# TGVideo

- [x] Biblioteca cinematográfica, búsqueda, detalles y navegación móvil/teclado.
- [x] Cuentas, perfiles e historial manual con Lovable Cloud.
- [x] Parser tgstorage y editor de captions; 14 pruebas concretas.
- [x] Skins en carruseles y cuadrícula.
- [x] ArtPlayer para fuentes HTTPS compatibles; sin streaming Telegram aún.
- [ ] Validar cuentas e historial: no existe ningún usuario registrado; requiere iniciar sesión en la vista previa.
- [ ] Conexión real Telegram: credenciales guardadas; falta iniciar sesión TGVideo y una cuenta Telegram con acceso a canales para validar transporte autenticado sin revelar secretos al navegador.
- [ ] Enriquecimiento TMDB: requiere conexión/clave del servicio.
- [ ] Streaming MKV, audio/ASS y reproductores externos: requiere fuente real y comprobación de codecs/dispositivos.
- [ ] PIN y control parental protegido entre perfiles: requiere una cuenta real para comprobar bloqueo, cambio de perfil y recuperación sin eludir restricciones. No se ofrece una seguridad simulada.
- [x] Preparación del proceso Android/TV y GitHub Actions.
- [ ] Compilación y distribución Android: requiere URL publicada, repositorio, firma y dispositivo de prueba.
- [x] Búsqueda y captions comprobados en navegador, carátulas cargadas; pruebas y compilación correctas.

## Conexión real
- [x] Conectar Telegram con API ID/HASH, teléfono, código y 2FA (sesión en el dispositivo)
- [x] Escanear canales ::tgstorage y construir películas/series con episodios
- [x] Clave TMDB con carátulas, sinopsis y reparto (caché local)
- [x] Reproducir desde Telegram con progreso y reanudación sincronizados
- [ ] Probar con cuenta y canales reales (necesita las credenciales del usuario)
- [ ] Streaming progresivo sin descarga completa (los archivos grandes se descargan antes de reproducir)
- [ ] PIN parental de 4 dígitos
