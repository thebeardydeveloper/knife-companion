# Splash Screen — Pending Logo

La configuración en app.json ya está lista (fondo #F5F2EE, resizeMode contain).

## Assets que necesitás generar con el logo nuevo:

| Archivo | Tamaño | Uso |
|---------|--------|-----|
| `assets/images/icon.png` | 1024×1024 px | Ícono de app (iOS + Android) |
| `assets/images/adaptive-icon.png` | 1024×1024 px | Ícono adaptable Android (solo el foreground, sin fondo) |
| `assets/images/splash-icon.png` | 1284×2778 px | Splash screen (el logo centrado en fondo #F5F2EE) |
| `assets/images/favicon.png` | 48×48 px | Web favicon |
| `assets/images/notification-icon.png` | 96×96 px | Ícono de notificación Android (blanco sobre transparente) |

## Herramienta recomendada
Podés generar todos estos assets desde un único PNG de 1024×1024 con:
  npx expo-image-utils icon ./logo.png

O usar https://icon.kitchen para preview en ambas plataformas.

## Colores de marca
- Fondo splash / ícono adaptable background: #F5F2EE
- Acento principal: #C4822A
