# Acceso a las lecciones de Espacio Esencial

Las lecciones y el Cuarto Repaso se publican cifrados con una clave común del mes. La portada pública conserva el índice y las direcciones habituales. `acceso.html` abre ese índice con la sesión del dispositivo activada desde Skool.

La clave y los enlaces que incluyen acceso se publican exclusivamente dentro del curso privado «Un Curso de Milagros · Grupo de estudio» en Skool. El curso permite entrar a Premium y a las personas a quienes se ha conservado acceso individual.

## Para las personas del grupo

1. Abrir el curso en Skool y entrar en «Acceso del mes».
2. Pulsar el enlace para entrar a las lecciones. El dispositivo recordará el acceso.
3. Como alternativa, abrir cualquier lección e introducir la clave del mes con «Recordar en este dispositivo».
4. Al renovar la clave, volver a abrir el enlace vigente desde Skool.

Los enlaces diarios incluyen la misma credencial de acceso del mes, aplicada a la página de cada lección. Son enlaces compartidos del grupo, no enlaces personales ni enlaces que caduquen a medianoche. El fragmento de acceso se retira de la barra de direcciones al abrir la página. La clave original no se guarda en el navegador; se guarda su valor derivado durante un máximo de 31 días. La renovación requiere recifrar las páginas.

## Publicar una lección nueva

Preparar su HTML fuera del repositorio público. Conservar el diseño, los textos y los enlaces de audio verificados. Reunir las páginas cifradas vigentes, `index.html`, `ucdm-access.json` y la nueva lección en una carpeta de trabajo. Facilitar `EE_ACCESS_PASSWORD` mediante el entorno, con la clave que figura en Skool, y ejecutar:

```sh
node tools/build-access.mjs --input carpeta_actual --output carpeta_siguiente --period AAAA-MM
```

Mientras el periodo sea el mismo, la herramienta reutiliza la sal pública y la clave actual para que funcionen los enlaces ya distribuidos y el acceso recordado. Publicar las páginas cifradas que cambien, `acceso.html`, `index.html` y `ucdm-access.json`. Mantener el archivo `assets/ucdm-access.js`. No publicar el HTML original, contraseñas, claves derivadas, enlaces con credenciales ni archivos privados de trabajo.

## Renovar la clave del mes

1. Recuperar las páginas cifradas vigentes y los metadatos públicos.
2. Generar una nueva clave aleatoria de al menos 16 caracteres. Guardarla en el apartado privado del mes en Skool.
3. Facilitar la clave anterior mediante `EE_PREVIOUS_PASSWORD` y la nueva mediante `EE_ACCESS_PASSWORD`, en el entorno.
4. Ejecutar el mismo comando con el periodo nuevo. La herramienta descifra las páginas anteriores y las vuelve a cifrar con la clave nueva y una sal nueva.
5. Publicar en un solo cambio las páginas, `acceso.html`, `index.html` y `ucdm-access.json`. Preparar un enlace de acceso con el formato `URL#staticrypt_pwd=VALOR_DERIVADO&remember_me`, manteniendo ese valor fuera del repositorio público.
6. Actualizar el apartado privado de Skool con la nueva clave y los enlaces vigentes. Comprobar que la clave anterior falla y la nueva abre dos lecciones.

La herramienta de cifrado está preparada; no hay una renovación programada que se ejecute sola.

## Alcance de la protección

StatiCrypt cifra el contenido con AES-256 y verifica su integridad con HMAC-SHA256. La clave se deriva mediante las rondas PBKDF2 de StatiCrypt 3. El motor procede de la prueba `prueba-acceso-167.html` y conserva su licencia MIT.

La clave o un enlace de acceso pueden compartirse entre personas. Este sistema no comprueba quién mantiene una suscripción de Skool. Cambiar la clave limita el acceso a las versiones nuevas para quien no reciba la nueva credencial. Los contenidos y enlaces de audio que se publicaron anteriormente en abierto siguen pudiendo recuperarse del historial público de GitHub; cifrarlos ahora no borra ese historial. Los enlaces externos a los textos oficiales siguen perteneciendo a sus editores.

El antiguo prototipo redirige ahora a la lección 167 protegida. Las rutas de talleres y sus recursos se mantienen independientes.
