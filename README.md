# CMP_mobile

para ejecutar este proyecto es necesario tener AndroidStudio instalado y configured. ademas debes tener nodejs y pnpm instalados.

npm run android

## Generar APK (desde la nube)

El APK se compila en la nube con EAS usando el perfil `preview` de `eas.json`, que apunta al Backend desplegado en Azure (`EXPO_PUBLIC_API_URL`).

```bash
npx eas-cli@latest build --platform android --profile preview
```



## Generar APK (compilar local)

El APK se compila en el PC usando el perfil `preview` de `eas.json`, que apunta al Backend desplegado en Azure (`EXPO_PUBLIC_API_URL`).

```bash
eas build --platform android --profile preview --local --output ~/Descargas/cmp-preview.apk
```

- La primera vez pide iniciar sesión en Expo (`npx eas-cli@latest login`).
- EAS compila los archivos del proyecto: haz commit de los cambios (incluidos `package.json` y `pnpm-lock.yaml`) antes de generar el APK.
- Al terminar entrega un enlace y un código QR para descargar e instalar el APK en el teléfono.
- Si se agregó una librería con código nativo (p. ej. `expo-blur`), hay que generar un APK nuevo: los APK anteriores no la incluyen.
