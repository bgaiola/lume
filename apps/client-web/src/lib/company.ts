/**
 * Datos identificativos de la empresa que comercializa Lume en España.
 *
 * Fuente única de verdad para el aviso legal, la política de privacidad,
 * las condiciones de contratación, el pie de página y las facturas.
 * Cualquier cambio societario se toca aquí y solo aquí.
 *
 * Obligatorio por el artículo 10 de la Ley 34/2002 (LSSI-CE): estos datos
 * deben estar accesibles de forma permanente, fácil y gratuita.
 */
export const COMPANY = {
  /** Razón social inscrita. */
  legalName: 'Ardis Software, S.L.',
  /** Marca comercial con la que opera de cara al mercado. */
  tradeName: 'ProSolid3D',
  /** Nombre del producto comercializado. */
  productName: 'Lume',
  taxId: 'B97139976',
  address: {
    street: 'Avenida Barcelona 92, núm. 3, oficina B',
    postalCode: '46900',
    city: 'Torrent',
    province: 'Valencia',
    country: 'España',
  },
  email: 'info@prosolid3d.com',
  privacyEmail: 'info@prosolid3d.com',
  supportEmail: 'info@prosolid3d.com',
  website: 'https://prosolid3d.com',
  productWebsite: 'https://lumeapp.es',
  /**
   * Datos registrales del Registro Mercantil de Valencia.
   * PENDIENTE: rellenar con tomo, folio, hoja e inscripción reales antes
   * de publicar. Hasta entonces el aviso legal los omite en lugar de
   * inventarlos, porque un dato registral falso es infracción de la LSSI.
   */
  registry: null as null | {
    office: string;
    volume: string;
    folio: string;
    sheet: string;
    entry: string;
  },
  /** Fecha de la última revisión de los textos legales. */
  lastUpdated: '19 de agosto de 2026',
} as const;

/** Dirección postal en una línea, para pies de página y facturas. */
export function formattedAddress(): string {
  const { street, postalCode, city, province, country } = COMPANY.address;
  return `${street}, ${postalCode} ${city} (${province}), ${country}`;
}
