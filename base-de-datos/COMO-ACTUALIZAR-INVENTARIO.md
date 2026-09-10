# 📦 Cómo actualizar el inventario de la tienda (Love & Sex)

**Frecuencia:** cada 1-2 semanas, cuando Alfred trae stock nuevo.
**Última actualización de este proceso:** 2026-08-19

---

## 1. El único archivo que importa

`base-de-datos/inventario-maestro-lovesex.xlsx` — **un solo archivo, sin fecha en el nombre**. Alfred lo edita a mano cada vez. Nunca crear una copia nueva con fecha — se sobrescribe el mismo archivo siempre.

Todo lo demás en esta carpeta (`archivo/`) es legado, no se toca ni se usa para actualizar.

## 2. Dónde vive el stock real de la tienda

`data/productos.json` (raíz del repo) — **este es el archivo que la tienda usa en producción**. El Excel es solo la fuente que Alfred edita; hay que trasladar los cambios a este JSON a mano (no hay sincronización automática).

## 3. Mapeo de columnas Excel → campos JSON

| Columna Excel | Campo JSON | Notas |
|---|---|---|
| `SKU` | `sku` | Clave para emparejar filas — ver sección 5 sobre mismatches |
| `Nombre actual` | `nombre` | |
| `Estado` | — | Si dice algo distinto de "Activo", preguntarle a Alfred qué significa (no visto aún) |
| `Stock` | `stock` | Puede venir como texto ("1 caja") — **siempre preguntar a Alfred qué significa antes de asumir un número** |
| `Notas` | — | Contexto libre, leer si no está vacío |

**Campos que el Excel NO trae y que NO se deben tocar sin instrucción explícita:** `precio_base`, `precio_promo`, `descripcion`, `beneficio`, `ficha`, `imagen`, `galeria`, `categoria`. Alfred ha sido explícito: la tarea normal es **solo stock**, nada de frontend/backend/otros campos — si el Excel implica un cambio a otro campo, preguntar primero (pasó una vez con una recategorización que en realidad ya estaba bien).

## 4. Cómo se derivan `stock_nota` y `stock_estado` (regla ya confirmada por Alfred, no inventar otra)

```
stock > 0  →  stock_nota: "Disponible"   · stock_estado: "disponible"
stock == 0 →  stock_nota: "No disponible" · stock_estado: "agotado"
```

El campo `disponible` **nunca se toca** — se queda en `true` siempre (es un campo de catálogo/activo, no de existencias).

## 5. Antes de aplicar cambios: comparar SKU por SKU

1. Cargar `data/productos.json` y el Excel.
2. Comparar el set de SKUs de ambos lados.
3. **Si un SKU del Excel no existe en el JSON (o viceversa):** no asumir que es un producto nuevo o eliminado. Puede ser un error de captura en el Excel (typo, número de talla cambiado). Comparar el **nombre del producto**, no solo el SKU — si el nombre es obviamente el mismo producto con otra talla/número, preguntarle a Alfred cuál es el correcto antes de tocar nada. (Pasó con `dp-lancer24` vs `dp-lancer26` y `dp-suction26` vs `dp-suction 22` — ambos eran errores de captura en el Excel, no productos nuevos.)
4. Solo actualizar los SKUs donde el número de stock realmente cambió — no reescribir los que ya coinciden.

## 6. Aplicar y verificar

```bash
node -e "
const fs = require('fs');
const data = require('./data/productos.json');
const updates = { 'sku-ejemplo': 5 /* ... */ };
data.productos.forEach(p => {
  if (updates.hasOwnProperty(p.sku)) {
    p.stock = updates[p.sku];
    p.stock_nota = p.stock > 0 ? 'Disponible' : 'No disponible';
    p.stock_estado = p.stock > 0 ? 'disponible' : 'agotado';
  }
});
fs.writeFileSync('./data/productos.json', JSON.stringify(data, null, 2) + '\n');
"
node -e "require('./data/productos.json'); console.log('JSON valido')"
git diff --stat   # confirmar que SOLO data/productos.json cambió
```

## 7. Publicar

```bash
git add data/productos.json
git commit -m "Actualiza stock de N productos según inventario maestro <fecha>"
git push origin main
```

Netlify está conectado directo al repo — el deploy es **automático** en cuanto se hace push a `main`, no requiere ningún paso manual en Netlify. Tarda 1-2 minutos.

**Verificación rápida post-deploy** (opcional pero recomendable):
```
GET https://love-and-sex.netlify.app/api/productos
```
Buscar 1-2 SKUs que se hayan actualizado y confirmar que el stock ya se refleja.

## 8. Cosas que ya se decidieron, no hay que volver a preguntar

- El repo es **público** — por eso `.xlsx`, `.bak` y datos comerciales crudos están en `.gitignore`, a propósito. No intentar meterlos al repo.
- Formato del archivo maestro: **Excel**, decisión ya tomada (2026-08-19) — no ofrecer CSV de nuevo salvo que Alfred lo pida.
- Un solo archivo activo, sin fechas en el nombre — si aparece un archivo con fecha en el nombre, es señal de que alguien no siguió este proceso; consolidar de nuevo a un solo archivo.

---
*Claude Code · IA-Crópolis · creado 2026-08-19 tras la primera actualización real de inventario*
