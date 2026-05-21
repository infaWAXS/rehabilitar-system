# RehabilitAR — Especificación de Diseño

## Tipografía

| Uso | Fuente | Proveedor |
|-----|--------|-----------|
| Principal | **Poppins** | Google Fonts |

### Pesos disponibles
| Peso | Nombre | Variable CSS |
|------|--------|--------------|
| 300 | Light | `--font-weight-light` |
| 400 | Regular | `--font-weight-regular` |
| 500 | Medium | `--font-weight-medium` |
| 600 | SemiBold | `--font-weight-semibold` |
| 700 | Bold | `--font-weight-bold` |

### Import de Google Fonts
```css
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
```

---

## Paleta de colores

Extraída del degradado teal → verde del logo RehabilitAR.

### Colores primarios (teal)
| Token CSS | Hex | Uso |
|-----------|-----|-----|
| `--color-primario` | `#1AABAB` | Botones, links, íconos activos |
| `--color-primario-oscuro` | `#0D8A8A` | Hover, estados activos |
| `--color-primario-suave` | `#D4F1F1` | Fondos de énfasis suave, badges |

### Colores secundarios (verde)
| Token CSS | Hex | Uso |
|-----------|-----|-----|
| `--color-secundario` | `#4DC24D` | Confirmaciones, éxito, CTAs alternativos |
| `--color-secundario-oscuro` | `#38A838` | Hover del secundario |
| `--color-secundario-suave` | `#D9F5D9` | Fondos de alerta de éxito |

### Color de acento
| Token CSS | Hex | Uso |
|-----------|-----|-----|
| `--color-acento` | `#7ED321` | Verde lima, pies del logo, detalles |

### Fondos
| Token CSS | Hex | Uso |
|-----------|-----|-----|
| `--color-fondo` | `#F0FBFB` | Fondo general de la app |
| `--color-fondo-sidebar` | `#0D3535` | Sidebar / menú lateral |
| `--color-fondo-sidebar-hover` | `#1A5050` | Hover de ítems del sidebar |
| `--color-fondo-card` | `#FFFFFF` | Tarjetas, modales, paneles |

### Texto
| Token CSS | Hex | Uso |
|-----------|-----|-----|
| `--color-texto` | `#1A2E2E` | Texto principal |
| `--color-texto-suave` | `#4A6868` | Texto secundario, placeholders |
| `--color-texto-claro` | `#FFFFFF` | Texto sobre fondos oscuros |

### Bordes
| Token CSS | Hex | Uso |
|-----------|-----|-----|
| `--color-borde` | `#C8E8E8` | Bordes de inputs, cards |

### Estados del sistema
| Token CSS | Hex | Uso |
|-----------|-----|-----|
| `--color-error` | `#D9534F` | Errores, alertas destructivas |
| `--color-exito` | `#4DC24D` | Mensajes de éxito |
| `--color-advertencia` | `#F0AD4E` | Advertencias |

---

## Archivo de implementación

Todos estos tokens están implementados en:
```
frontend/src/assets/styles/variables.css
```
