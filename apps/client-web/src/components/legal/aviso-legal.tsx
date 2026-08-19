import { type LegalDocument } from './legal-doc';

import { COMPANY, formattedAddress } from '@/lib/company';


/**
 * Aviso legal. Cumple el artículo 10 de la Ley 34/2002, de 11 de julio,
 * de Servicios de la Sociedad de la Información y de Comercio Electrónico
 * (LSSI-CE), que obliga a publicar los datos identificativos del prestador.
 */
export const avisoLegalDoc: LegalDocument = {
  slug: 'aviso-legal',
  shortTitle: 'Aviso legal',
  title: 'Aviso legal',
  intro:
    'Datos identificativos del titular de este sitio web y condiciones de uso, conforme al artículo 10 de la Ley 34/2002 de Servicios de la Sociedad de la Información y de Comercio Electrónico.',
  sections: [
    {
      title: 'Titular del sitio web',
      blocks: [
        `En cumplimiento del deber de información recogido en el artículo 10 de la Ley 34/2002, se facilitan a continuación los datos identificativos del titular de este sitio web y del servicio ${COMPANY.productName}.`,
        {
          type: 'table',
          head: ['Dato', 'Información'],
          rows: [
            ['Denominación social', COMPANY.legalName],
            ['Nombre comercial', COMPANY.tradeName],
            ['NIF / CIF', COMPANY.taxId],
            ['Domicilio social', formattedAddress()],
            ['Correo electrónico', COMPANY.email],
            ['Sitio web corporativo', COMPANY.website],
            ['Sitio web del servicio', COMPANY.productWebsite],
            [
              'Actividad',
              'Desarrollo, licencia y soporte de software para la industria del mueble y la carpintería, y prestación de servicios de asistencia remota.',
            ],
            ...(COMPANY.registry
              ? [
                  [
                    'Datos registrales',
                    `Inscrita en el ${COMPANY.registry.office}, tomo ${COMPANY.registry.volume}, folio ${COMPANY.registry.folio}, hoja ${COMPANY.registry.sheet}, inscripción ${COMPANY.registry.entry}.`,
                  ],
                ]
              : []),
          ],
        },
        `En adelante, ${COMPANY.legalName} se denominará "el Titular" y el conjunto de páginas y servicios accesibles desde ${COMPANY.productWebsite} se denominará "el Sitio Web".`,
      ],
    },
    {
      title: 'Objeto',
      blocks: [
        `El presente aviso legal regula el acceso, la navegación y el uso del Sitio Web, así como las responsabilidades derivadas de dicho uso. ${COMPANY.productName} es una herramienta de asistencia remota que permite a un técnico visualizar y, previa autorización expresa del usuario asistido, controlar la pantalla de un equipo con fines de soporte.`,
        'El acceso al Sitio Web es gratuito, salvo el coste de la conexión a través de la red de telecomunicaciones facilitada por el proveedor de acceso contratado por cada usuario. La contratación de los planes de pago se rige además por las Condiciones generales de contratación.',
        'La navegación por el Sitio Web atribuye la condición de usuario e implica la aceptación plena y sin reservas de todas las cláusulas de este aviso legal en la versión publicada en el momento del acceso.',
      ],
    },
    {
      title: 'Condiciones de uso',
      blocks: [
        'El usuario se compromete a hacer un uso diligente del Sitio Web y del servicio, conforme a la ley, a la buena fe y al orden público. En particular, queda prohibido:',
        {
          type: 'list',
          items: [
            'Utilizar el servicio para acceder a equipos ajenos sin el consentimiento libre, informado y verificable de la persona que los usa o de su titular.',
            'Emplear el servicio para cometer fraude, suplantación de identidad, estafas de falso soporte técnico o cualquier otra conducta tipificada como delito.',
            'Introducir o difundir virus, código malicioso o cualquier elemento que pueda dañar los sistemas del Titular o de terceros.',
            'Intentar acceder a áreas restringidas, eludir medidas de seguridad, realizar ingeniería inversa sobre el servicio o sobrecargar deliberadamente la infraestructura.',
            'Reproducir, distribuir, transformar o comunicar públicamente los contenidos del Sitio Web sin autorización escrita del Titular.',
          ],
        },
        'El Titular podrá suspender o cancelar de forma inmediata, sin derecho a devolución, el acceso de cualquier usuario que incumpla lo anterior, y colaborará con las autoridades competentes cuando exista requerimiento legal.',
      ],
    },
    {
      title: 'Propiedad intelectual e industrial',
      blocks: [
        `Todos los derechos de propiedad intelectual e industrial sobre el Sitio Web, su código, diseño, estructura de navegación, bases de datos, marcas, logotipos y demás contenidos corresponden al Titular o a terceros que han autorizado su uso, y están protegidos por el Real Decreto Legislativo 1/1996, por el que se aprueba el Texto Refundido de la Ley de Propiedad Intelectual, y por la normativa de marcas aplicable.`,
        'Queda expresamente prohibida la reproducción total o parcial, la explotación, la distribución y la modificación de dichos contenidos sin autorización expresa y por escrito del Titular. El acceso al Sitio Web no otorga al usuario ningún derecho de propiedad sobre los mismos.',
        `Determinados componentes de ${COMPANY.productName} se publican bajo licencias de software libre. En ese caso, prevalecen los términos de la licencia correspondiente, que se indican en el propio repositorio de código.`,
      ],
    },
    {
      title: 'Exclusión de responsabilidad',
      blocks: [
        'El Titular pone los medios técnicos y organizativos razonables para que el Sitio Web funcione correctamente, pero no garantiza la ausencia total de errores ni la disponibilidad ininterrumpida del servicio. En particular, no responde de:',
        {
          type: 'list',
          items: [
            'Interrupciones, retrasos o fallos causados por la red del usuario, por su equipo, por su navegador o por proveedores de telecomunicaciones ajenos al Titular.',
            'Daños derivados de un uso indebido del servicio por parte del usuario o de terceros a los que este haya facilitado un enlace o un código de sesión.',
            'Las acciones que un técnico realice sobre el equipo del usuario asistido durante una sesión autorizada por este. La autorización y la supervisión de la sesión corresponden al usuario asistido, que puede finalizarla en cualquier momento.',
            'Los contenidos de sitios web de terceros enlazados desde el Sitio Web, cuya finalidad es meramente informativa y sobre los que el Titular no ejerce control alguno.',
          ],
        },
        'Nada de lo anterior excluye la responsabilidad del Titular en los supuestos en que la normativa imperativa no permita dicha exclusión, en especial frente a consumidores y usuarios.',
      ],
    },
    {
      title: 'Enlaces',
      blocks: [
        'El Sitio Web puede contener enlaces a páginas de terceros. El Titular no asume responsabilidad alguna sobre la información, los contenidos o los servicios que en ellas se ofrezcan, ni sobre sus políticas de privacidad.',
        `El establecimiento de un enlace hacia el Sitio Web desde una página ajena no implica relación alguna entre el Titular y el propietario de esa página, ni la aceptación o supervisión de sus contenidos. Cualquier enlace que sugiera tal vínculo deberá retirarse a requerimiento del Titular en ${COMPANY.email}.`,
      ],
    },
    {
      title: 'Protección de datos',
      blocks: [
        'El tratamiento de los datos personales recogidos a través del Sitio Web se rige por la Política de privacidad y por la Política de cookies, que forman parte integrante de este aviso legal.',
      ],
    },
    {
      title: 'Modificaciones',
      blocks: [
        'El Titular se reserva el derecho de modificar en cualquier momento la presentación, la configuración y los contenidos del Sitio Web, así como el presente aviso legal, para adaptarlo a novedades legislativas o a cambios en el servicio. Las modificaciones surtirán efecto desde su publicación, indicándose siempre la fecha de última actualización.',
      ],
    },
    {
      title: 'Legislación aplicable y jurisdicción',
      blocks: [
        'Este aviso legal se rige por la legislación española. Para la resolución de cualquier controversia derivada del acceso o uso del Sitio Web, las partes se someten a los juzgados y tribunales del domicilio del Titular, salvo que el usuario tenga la condición de consumidor, en cuyo caso serán competentes los del domicilio del consumidor conforme a la normativa aplicable.',
        `Para cualquier consulta relativa a este aviso legal puede escribir a ${COMPANY.email}.`,
      ],
    },
  ],
};
