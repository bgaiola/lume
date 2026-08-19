import { ArrowLeft } from 'lucide-react';
import { Fragment, useEffect, type ReactNode } from 'react';

import { LumeMark } from '../lume-mark';

import { COMPANY } from '@/lib/company';


/**
 * Bloques con los que se componen los documentos legales.
 *
 * Los textos se declaran como datos (no como JSX suelto) para que el día que
 * entren en juego varios idiomas baste con traducir el array, y para que el
 * renderizado tipográfico sea idéntico en los cinco documentos.
 */
export type LegalBlock =
  | string
  | { type: 'list'; items: ReactNode[] }
  | { type: 'ordered'; items: ReactNode[] }
  | { type: 'table'; head: string[]; rows: ReactNode[][] }
  | { type: 'note'; text: ReactNode }
  | { type: 'raw'; node: ReactNode };

export interface LegalSection {
  title: string;
  blocks: LegalBlock[];
}

export interface LegalDocument {
  /** Segmento de URL, sin barra inicial. */
  slug: string;
  /** Título largo, cabecera del documento. */
  title: string;
  /** Etiqueta corta para el pie de página y la navegación. */
  shortTitle: string;
  /** Frase de una línea bajo el título. */
  intro: string;
  sections: LegalSection[];
}

export function LegalDocPage({ doc }: { doc: LegalDocument }): JSX.Element {
  // Sin router no hay quien fije el título, y las cinco páginas heredarían el
  // de la landing. Importa para la pestaña del navegador y para el buscador.
  useEffect(() => {
    const previous = document.title;
    document.title = `${doc.title} · ${COMPANY.productName}`;
    return () => {
      document.title = previous;
    };
  }, [doc.title]);

  return (
    <div className="min-h-screen bg-surface-deep text-ink-primary">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-5">
          <a href="/" className="flex items-center gap-2.5">
            <LumeMark size={28} />
            <span className="font-display text-lg italic">Lume</span>
          </a>
          <a
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-ink-tertiary transition-colors hover:text-ink-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            Volver al inicio
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12 lg:py-16">
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-lime">
          Información legal
        </p>
        <h1 className="mt-3 font-display text-3xl italic leading-tight sm:text-4xl">{doc.title}</h1>
        <p className="mt-4 text-sm leading-relaxed text-ink-secondary">{doc.intro}</p>
        <p className="mt-2 font-mono text-[11px] text-ink-tertiary">
          Última actualización: {COMPANY.lastUpdated}
        </p>

        <div className="mt-10 space-y-10">
          {doc.sections.map((section, i) => (
            <section key={section.title} className="scroll-mt-24" id={`s${i + 1}`}>
              <h2 className="font-display text-xl italic leading-snug text-ink-primary sm:text-2xl">
                {i + 1}. {section.title}
              </h2>
              <div className="mt-4 space-y-4">
                {section.blocks.map((block, j) => (
                  <Fragment key={j}>{renderBlock(block)}</Fragment>
                ))}
              </div>
            </section>
          ))}
        </div>

        <LegalNav current={doc.slug} />
      </main>
    </div>
  );
}

function renderBlock(block: LegalBlock): ReactNode {
  if (typeof block === 'string') {
    return <p className="text-sm leading-relaxed text-ink-secondary">{block}</p>;
  }

  if (block.type === 'raw') {
    return block.node;
  }

  if (block.type === 'note') {
    return (
      <div className="rounded-xl border border-line bg-surface-base px-5 py-4">
        <p className="text-sm leading-relaxed text-ink-secondary">{block.text}</p>
      </div>
    );
  }

  if (block.type === 'list') {
    return (
      <ul className="space-y-2 pl-1">
        {block.items.map((item, i) => (
          <li key={i} className="flex gap-3 text-sm leading-relaxed text-ink-secondary">
            <span aria-hidden className="mt-[0.55rem] h-1 w-1 shrink-0 rounded-full bg-lime" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    );
  }

  if (block.type === 'ordered') {
    return (
      <ol className="space-y-2 pl-1">
        {block.items.map((item, i) => (
          <li key={i} className="flex gap-3 text-sm leading-relaxed text-ink-secondary">
            <span aria-hidden className="font-mono text-xs text-lime">{i + 1}.</span>
            <span>{item}</span>
          </li>
        ))}
      </ol>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-line">
      <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
        <thead>
          <tr className="bg-surface-base">
            {block.head.map((h) => (
              <th
                key={h}
                className="border-b border-line px-4 py-3 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-tertiary"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row, i) => (
            <tr key={i} className="align-top">
              {row.map((cell, j) => (
                <td
                  key={j}
                  className="border-b border-line/60 px-4 py-3 leading-relaxed text-ink-secondary"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Enlaces cruzados entre los documentos legales, al pie de cada uno. */
export const LEGAL_LINKS: { slug: string; label: string }[] = [
  { slug: 'aviso-legal', label: 'Aviso legal' },
  { slug: 'privacidad', label: 'Política de privacidad' },
  { slug: 'cookies', label: 'Política de cookies' },
  { slug: 'condiciones', label: 'Condiciones de contratación' },
  { slug: 'encargado-tratamiento', label: 'Encargado del tratamiento' },
];

function LegalNav({ current }: { current: string }): JSX.Element {
  return (
    <nav className="mt-16 border-t border-line pt-8">
      <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink-tertiary">
        Otros documentos
      </p>
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
        {LEGAL_LINKS.filter((l) => l.slug !== current).map((l) => (
          <a
            key={l.slug}
            href={`/${l.slug}`}
            className="text-sm text-ink-secondary transition-colors hover:text-lime"
          >
            {l.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
