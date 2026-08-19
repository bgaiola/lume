/**
 * Gestión del consentimiento de cookies.
 *
 * Estado actual: el sitio solo usa almacenamiento técnico necesario, que el
 * artículo 22.2 de la LSSI exime de consentimiento previo. Por eso
 * `NON_ESSENTIAL_CATEGORIES` está vacío y el aviso no se muestra: pedir
 * permiso para algo que no instalamos sería engañoso.
 *
 * Para activar analítica el día que haga falta:
 *   1. Añade la categoría a `NON_ESSENTIAL_CATEGORIES`.
 *   2. Declara la cookie concreta en la tabla de `components/legal/cookies.tsx`.
 *   3. Envuelve la carga del script en `hasConsent('analytics')`.
 * El aviso aparecerá solo con eso, y no se cargará nada hasta que el visitante
 * acepte esa categoría.
 */

export type ConsentCategory = 'analytics' | 'marketing';

export interface ConsentCategoryInfo {
  id: ConsentCategory;
  label: string;
  description: string;
}

/** Categorías no necesarias realmente en uso. Vacío mientras no haya ninguna. */
export const NON_ESSENTIAL_CATEGORIES: ConsentCategoryInfo[] = [];

export type ConsentState = Partial<Record<ConsentCategory, boolean>>;

const STORAGE_KEY = 'lume-cookie-consent';
/** El consentimiento caduca a los 12 meses, según la guía de la AEPD. */
const MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;

interface StoredConsent {
  decidedAt: number;
  categories: ConsentState;
}

function read(): StoredConsent | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as StoredConsent;
    if (typeof parsed?.decidedAt !== 'number') {
      return null;
    }
    if (Date.now() - parsed.decidedAt > MAX_AGE_MS) {
      return null;
    }
    return parsed;
  } catch {
    // Navegador con almacenamiento bloqueado o dato corrupto: tratamos el
    // consentimiento como no otorgado, que es la opción segura.
    return null;
  }
}

/** true solo si el visitante aceptó explícitamente esa categoría. */
export function hasConsent(category: ConsentCategory): boolean {
  return read()?.categories[category] === true;
}

/** Decisión ya tomada y todavía vigente. */
export function hasDecided(): boolean {
  return read() !== null;
}

export function saveConsent(categories: ConsentState): void {
  try {
    const payload: StoredConsent = { decidedAt: Date.now(), categories };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Si no podemos guardar, el aviso volverá a mostrarse en la próxima
    // visita. Preferible a fallar la carga de la página.
  }
}

/** Borra la decisión guardada para que el visitante pueda volver a elegir. */
export function resetConsent(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Sin almacenamiento no hay nada que borrar.
  }
}

/** Lee la decisión actual, o null si aún no se ha tomado o ha caducado. */
export function currentConsent(): ConsentState | null {
  return read()?.categories ?? null;
}
