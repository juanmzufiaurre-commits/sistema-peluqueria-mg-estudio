# MG Estudio — Turnos, mini-CRM y panel

Sistema de reservas para la peluquería/barbería MG Estudio: wizard de reserva mobile-first, panel de administración, avisos por WhatsApp y métricas.

**Stack:** Next.js 16 (App Router, Cache Components) · TypeScript estricto · Tailwind 4 · Prisma 7 + PostgreSQL (Supabase) · Supabase Auth · Cloudinary · Zod · Vitest.

## Desarrollo local

```bash
npm install            # también corre `prisma generate`
cp .env.example .env   # y completar los valores
npm run db:migrate     # aplica las migraciones a la base
npm run db:seed        # servicios, profesionales y horario inicial
npm run dev
```

Comandos útiles: `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`.

## Variables de entorno

| Variable | Para qué |
|---|---|
| `DATABASE_URL` | Supabase → Transaction pooler (puerto 6543, `?pgbouncer=true`). La usa la app |
| `DIRECT_URL` | Supabase → Session pooler (puerto 5432). Solo para migraciones y seed |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Auth (login del panel) |
| `ADMIN_EMAILS` | Emails (separados por coma) con acceso a `/admin` |
| `CRON_SECRET` | Protege `/api/cron/*` (`Authorization: Bearer …`) |
| `NEXT_PUBLIC_SITE_URL` | URL pública del sitio (enlaces de WhatsApp) |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Fotos de referencia |
| `WHATSAPP_GATEWAY_URL`, `_INSTANCE`, `_TOKEN` | Opcional: envío automático (Evolution API). Sin esto se usan enlaces `wa.me` |

## Despliegue en Vercel

1. Subir el repo a GitHub e importarlo en Vercel (framework: Next.js, sin cambiar comandos).
2. Cargar las variables de entorno de la tabla (`DIRECT_URL` no hace falta en Vercel).
3. Deploy. Después, poner `NEXT_PUBLIC_SITE_URL` con la URL real y redeployar.
4. En GitHub → Settings → Secrets and variables → Actions, crear `APP_URL` (la URL de Vercel, sin `/` final) y `CRON_SECRET` (el mismo valor). El workflow `.github/workflows/reminders.yml` dispara los avisos.
5. Supabase → Authentication: crear el usuario admin y desactivar el registro público.

Las migraciones **no** corren en el build: se aplican a mano con `npm run db:migrate` (con `.env` local apuntando a la base de producción).

## Fotos (Cloudinary)

1. Crear una cuenta gratuita en cloudinary.com y copiar, desde el *Dashboard*, el **Cloud name**, la **API Key** y el **API Secret**.
2. Cargarlos como `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` y `CLOUDINARY_API_SECRET` (en `.env` y en Vercel).
3. Las fotos se comprimen a WebP (máx. 1080p) en el navegador y se suben directo a Cloudinary con una firma del servidor. En la base solo se guardan `secure_url` y `public_id`.
   - `mg-estudio/reference/`: fotos de referencia que sube el cliente al reservar (endpoint público con límite de uso).
   - `mg-estudio/results/`: fotos del resultado que sube el local desde la ficha del turno (solo admin).
4. El servidor solo acepta fotos de su propia cuenta y carpeta; no se pueden asociar URLs ajenas.

## Estructura

```
prisma/                 esquema, migraciones (incluye restricción anti doble-booking) y seed
src/app/(public)/       home + wizard, /turno/[token] (cancelar/reprogramar)
src/app/admin/          panel: agenda, servicios, configuración, login
src/app/api/            cron de avisos y firma de subida a Cloudinary
src/actions/            Server Actions ({ success, data?, error? })
src/server/services/    lógica de negocio (disponibilidad, reservas, avisos, métricas)
src/lib/                utilidades puras (fechas en America/Argentina/Buenos_Aires, teléfono E.164, etc.)
```

## Reglas de negocio clave

- Un turno ocupa `inicio → inicio + duración + margen`. La base rechaza solapamientos por profesional (`EXCLUDE` en PostgreSQL), así que dos reservas simultáneas nunca chocan.
- Cada turno guarda su propio nombre, precio y duración (snapshot). Un servicio se puede dar de baja (`isActive`, reversible) o eliminar definitivamente: en ese caso los turnos existentes se conservan, con las métricas intactas, pero sin vínculo al catálogo (`serviceId` en `NULL`).
- El token de cancelación se entrega una sola vez; en la base solo está su hash.
