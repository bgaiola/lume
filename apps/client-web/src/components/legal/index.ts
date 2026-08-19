import { avisoLegalDoc } from './aviso-legal';
import { condicionesDoc } from './condiciones';
import { cookiesDoc } from './cookies';
import { encargadoDoc } from './encargado-tratamiento';
import { type LegalDocument } from './legal-doc';
import { privacidadDoc } from './privacidad';

export { LegalDocPage, LEGAL_LINKS, type LegalDocument } from './legal-doc';

/** Todos los documentos legales, indexados por el segmento de URL. */
export const LEGAL_DOCS: Record<string, LegalDocument> = {
  [avisoLegalDoc.slug]: avisoLegalDoc,
  [privacidadDoc.slug]: privacidadDoc,
  [cookiesDoc.slug]: cookiesDoc,
  [condicionesDoc.slug]: condicionesDoc,
  [encargadoDoc.slug]: encargadoDoc,
};

/**
 * Resuelve una ruta a un documento legal.
 *
 * Se llama antes de interpretar la ruta como código de sesión, de forma que
 * `/privacidad` abre la política y no una sesión inexistente.
 */
export function resolveLegalDoc(pathname: string): LegalDocument | null {
  const slug = pathname.split('/').filter(Boolean)[0]?.toLowerCase();
  if (!slug) {
    return null;
  }
  return LEGAL_DOCS[slug] ?? null;
}
