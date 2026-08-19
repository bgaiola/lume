import { type LegalDocument } from './legal-doc';

import { COMPANY } from '@/lib/company';


/**
 * Política de cookies. Cubre el artículo 22.2 de la LSSI-CE y la Guía sobre
 * el uso de cookies de la Agencia Española de Protección de Datos.
 *
 * El texto describe el estado real del producto: no hay cookies de analítica
 * ni de publicidad, solo almacenamiento local estrictamente necesario y las
 * cookies técnicas que fija el proveedor de red. Si algún día se añade
 * analítica, hay que declararla aquí y activarla en `cookie-consent.tsx`.
 */
export const cookiesDoc: LegalDocument = {
  slug: 'cookies',
  shortTitle: 'Cookies',
  title: 'Política de cookies',
  intro:
    'Qué guardamos en tu navegador, para qué sirve y cómo puedes borrarlo. Hoy no usamos cookies de analítica ni de publicidad.',
  sections: [
    {
      title: 'Qué es una cookie',
      blocks: [
        'Una cookie es un pequeño fichero que un sitio web guarda en tu navegador para recordar información entre visitas. Bajo la misma normativa entran también otras tecnologías de almacenamiento en el dispositivo, como el almacenamiento local del navegador, que es lo que usamos nosotros.',
        `Esta política forma parte del Aviso legal de ${COMPANY.legalName} y complementa la Política de privacidad.`,
      ],
    },
    {
      title: 'Qué usamos en este sitio',
      blocks: [
        'Solo empleamos almacenamiento estrictamente necesario para que el servicio funcione. Conforme al artículo 22.2 de la LSSI, este tipo de almacenamiento está exento de consentimiento previo, aunque tenemos el deber de informarte de su existencia:',
        {
          type: 'table',
          head: ['Nombre', 'Tipo', 'Finalidad', 'Duración'],
          rows: [
            [
              'lume-auth',
              'Almacenamiento local, propio, técnico',
              'Guarda el testigo de sesión del técnico para que no tenga que volver a identificarse en cada recarga del panel. No se usa en la página del cliente final.',
              'Hasta cerrar sesión o borrar los datos del navegador.',
            ],
            [
              'lume-cookie-consent',
              'Almacenamiento local, propio, técnico',
              'Recuerda tu decisión sobre cookies para no volver a preguntártela.',
              '12 meses.',
            ],
            [
              '__cf_bm y similares',
              'Cookie de tercero, técnica',
              'Cookies de seguridad que fija Cloudflare, nuestro proveedor de red, para distinguir el tráfico humano del automatizado y proteger el servicio frente a ataques.',
              'Hasta 30 minutos.',
            ],
          ],
        },
        {
          type: 'note',
          text: 'No utilizamos cookies de analítica, de perfilado, de publicidad ni de redes sociales. No cedemos datos de navegación a terceros con fines publicitarios y no elaboramos perfiles de comportamiento.',
        },
      ],
    },
    {
      title: 'Consentimiento',
      blocks: [
        'Como en este momento solo usamos almacenamiento técnico necesario, no necesitamos pedirte consentimiento para instalarlo. Si en el futuro incorporamos cookies de analítica o de cualquier otra finalidad no necesaria, te mostraremos un aviso previo con la posibilidad de aceptarlas, rechazarlas o configurarlas por categorías, y no se instalarán hasta que nos des tu permiso.',
        'Tu decisión quedará registrada y podrás cambiarla en cualquier momento desde esta misma página o borrando los datos del sitio en tu navegador.',
      ],
    },
    {
      title: 'Cómo borrar o bloquear el almacenamiento',
      blocks: [
        'Puedes eliminar en cualquier momento lo que hayamos guardado, y configurar tu navegador para bloquearlo. Ten en cuenta que si bloqueas el almacenamiento técnico tendrás que identificarte de nuevo cada vez que abras el panel:',
        {
          type: 'list',
          items: [
            'Google Chrome: Ajustes, Privacidad y seguridad, Cookies y otros datos de sitios.',
            'Mozilla Firefox: Ajustes, Privacidad y seguridad, Cookies y datos del sitio.',
            'Safari: Preferencias, Privacidad, Gestionar datos de sitios web.',
            'Microsoft Edge: Configuración, Cookies y permisos del sitio.',
          ],
        },
      ],
    },
    {
      title: 'Actualizaciones',
      blocks: [
        `Revisamos esta política cada vez que cambia la tecnología que usamos. Si tienes dudas sobre el almacenamiento que emplea el sitio, escríbenos a ${COMPANY.privacyEmail}.`,
      ],
    },
  ],
};
