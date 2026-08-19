import { type LegalDocument } from './legal-doc';

import { COMPANY, formattedAddress } from '@/lib/company';


/**
 * Condiciones generales de contratación. Cubre el Real Decreto Legislativo
 * 1/2007 (texto refundido de la Ley General para la Defensa de los
 * Consumidores y Usuarios), la Ley 7/1998 sobre condiciones generales de la
 * contratación y los artículos 23 y siguientes de la LSSI-CE sobre
 * contratación por vía electrónica.
 *
 * Los importes deben coincidir con los del bloque de precios de la landing.
 * Si cambian allí, hay que cambiarlos aquí en la misma entrega.
 */
export const condicionesDoc: LegalDocument = {
  slug: 'condiciones',
  shortTitle: 'Condiciones',
  title: 'Condiciones generales de contratación',
  intro:
    'Términos que regulan la contratación de los planes de Lume: qué incluye cada plan, cómo se paga, cómo se cancela y qué responsabilidad asume cada parte.',
  sections: [
    {
      title: 'Partes y objeto',
      blocks: [
        `Estas condiciones regulan la contratación de los planes de pago del servicio ${COMPANY.productName}, prestado por ${COMPANY.legalName}, con NIF ${COMPANY.taxId} y domicilio en ${formattedAddress()}, en adelante "el Proveedor".`,
        'La otra parte, en adelante "el Cliente", es la persona física o jurídica que contrata el servicio a través del sitio web. Cuando el Cliente actúa con un propósito ajeno a su actividad empresarial o profesional, tiene además la condición de consumidor y le resultan de aplicación las cláusulas específicas que se indican expresamente.',
        'La contratación implica la aceptación plena de estas condiciones, del Aviso legal, de la Política de privacidad y del contrato de Encargado del tratamiento, que forman un único acuerdo. El Cliente debe leerlas y aceptarlas antes de completar el pedido, y podrá descargarlas o imprimirlas en ese momento.',
      ],
    },
    {
      title: 'Descripción del servicio',
      blocks: [
        `${COMPANY.productName} es una herramienta de asistencia remota que permite a un técnico ver y, previa autorización expresa de la persona asistida, controlar la pantalla de otro equipo. Se presta en modalidad de software como servicio, accesible desde el navegador y desde aplicaciones de escritorio para macOS, Windows y Linux.`,
        'El Proveedor podrá mejorar, modificar o sustituir funcionalidades del servicio para adaptarlo a la evolución técnica. Si una modificación redujera de forma sustancial las prestaciones contratadas, se comunicará al Cliente con al menos treinta días de antelación y este podrá resolver el contrato sin penalización, con devolución de la parte proporcional no consumida.',
        'Las funcionalidades identificadas en el sitio web como "próximamente" no forman parte del objeto contratado hasta que se anuncien como disponibles, y su falta de disponibilidad no da derecho a reclamación.',
      ],
    },
    {
      title: 'Alta, cuenta y credenciales',
      blocks: [
        'Para contratar es necesario crear una cuenta facilitando una dirección de correo electrónico válida. El acceso se realiza mediante un enlace de un solo uso enviado a esa dirección, sin contraseña.',
        'El Cliente es responsable de la veracidad de los datos facilitados, de mantener actualizada su dirección de correo y de la custodia del acceso a su buzón. Cualquier uso del servicio realizado desde su cuenta se presume autorizado por él, salvo que haya comunicado previamente al Proveedor un uso no autorizado.',
        'El Cliente debe ser mayor de edad y tener capacidad legal suficiente para contratar.',
      ],
    },
    {
      title: 'Precios, impuestos y facturación',
      blocks: [
        'Los planes vigentes y sus importes son los siguientes:',
        {
          type: 'table',
          head: ['Plan', 'Precio', 'Alcance'],
          rows: [
            ['Free', '0 euros', 'Un técnico y un máximo de 5 sesiones al mes.'],
            [
              'Pro',
              '9 euros por usuario y mes',
              'Sesiones ilimitadas, grabación, multimonitor, transferencia de archivos e historial.',
            ],
            [
              'Team',
              '19 euros por usuario y mes',
              'Todo lo del plan Pro, más funcionalidades de equipo y asistencia con inteligencia artificial según se vayan liberando.',
            ],
          ],
        },
        'Los precios indicados se expresan sin incluir impuestos. A la facturación se añadirá el Impuesto sobre el Valor Añadido al tipo general vigente en España, actualmente el 21 por ciento. En operaciones intracomunitarias con clientes empresarios o profesionales que aporten un número de operador intracomunitario válido, se aplicará la inversión del sujeto pasivo y la factura se emitirá sin IVA.',
        'El importe total, con impuestos y con el desglose completo, se muestra siempre antes de confirmar el pedido. El Cliente recibirá la confirmación de la contratación y la factura correspondiente en su dirección de correo electrónico.',
        'El pago se realiza por adelantado, mediante los medios habilitados en la pasarela de pago. El Proveedor no almacena datos completos de tarjeta: el tratamiento lo realiza directamente el proveedor de pago, que cumple el estándar PCI DSS.',
        'El Proveedor podrá actualizar sus tarifas comunicándolo con al menos treinta días de antelación. El nuevo precio se aplicará a partir de la siguiente renovación y el Cliente podrá cancelar antes de esa fecha si no lo acepta.',
      ],
    },
    {
      title: 'Duración, renovación y cancelación',
      blocks: [
        'La suscripción se contrata por periodos mensuales o anuales, según elija el Cliente, y se renueva automáticamente por periodos iguales salvo cancelación.',
        'El Cliente puede cancelar la renovación en cualquier momento desde su panel o escribiendo a ' +
          COMPANY.supportEmail +
          '. La cancelación surte efecto al final del periodo ya pagado, durante el cual el servicio sigue disponible con normalidad. No se prorratean los periodos ya iniciados, salvo en los supuestos de desistimiento o de modificación sustancial del servicio previstos en estas condiciones.',
        'Tras la baja, los datos de la cuenta se conservan durante 30 días para permitir su recuperación y después se suprimen conforme a la Política de privacidad. El Cliente puede solicitar la exportación de su historial de sesiones antes de que transcurra ese plazo.',
      ],
    },
    {
      title: 'Derecho de desistimiento',
      blocks: [
        'Esta cláusula se aplica únicamente al Cliente que tiene la condición de consumidor.',
        'El consumidor dispone de 14 días naturales desde la contratación para desistir del contrato sin necesidad de justificación y sin penalización, conforme al artículo 102 del Real Decreto Legislativo 1/2007.',
        `Para ejercerlo basta con comunicarlo de forma inequívoca a ${COMPANY.supportEmail}, indicando el nombre, la fecha de contratación y el correo de la cuenta. El reembolso se realizará por el mismo medio de pago empleado, en un plazo máximo de 14 días naturales desde la recepción de la comunicación.`,
        {
          type: 'note',
          text: 'Importante: si solicitas que el servicio empiece a prestarse de inmediato, dentro del plazo de desistimiento, y así lo aceptas expresamente al contratar, perderás el derecho de desistimiento una vez el servicio se haya ejecutado por completo, y si desistes antes deberás abonar la parte del servicio ya prestada, en proporción al total contratado.',
        },
      ],
    },
    {
      title: 'Uso aceptable',
      blocks: [
        'El acceso remoto a equipos ajenos es una herramienta especialmente sensible. El Cliente se obliga a:',
        {
          type: 'ordered',
          items: [
            'Obtener, antes de cada sesión, el consentimiento libre e informado de la persona que usa el equipo asistido, y a identificarse ante ella con su nombre y el de su empresa.',
            'No emplear el servicio para acceder a equipos sin autorización, ni para estafas de falso soporte técnico, suplantación de identidad, extorsión o cualquier otra actividad ilícita.',
            'No usar el servicio para vulnerar derechos de terceros, distribuir código malicioso ni eludir medidas de protección de sistemas ajenos.',
            'No revender, sublicenciar ni compartir credenciales con terceros ajenos a los usuarios contratados, ni superar el número de usuarios del plan mediante cuentas compartidas.',
            'No realizar pruebas de carga, análisis de vulnerabilidades ni ingeniería inversa sobre la infraestructura del Proveedor sin autorización previa y por escrito.',
          ],
        },
        'El incumplimiento de esta cláusula faculta al Proveedor para suspender el servicio de forma inmediata y resolver el contrato sin derecho a devolución, sin perjuicio de las acciones legales que correspondan y del deber de colaboración con las autoridades.',
      ],
    },
    {
      title: 'Disponibilidad y soporte',
      blocks: [
        'El Proveedor prestará el servicio con la diligencia propia de un profesional, empleando medios técnicos razonables para mantener una disponibilidad elevada. La prestación se configura como una obligación de medios y no de resultado, salvo que se haya suscrito un acuerdo de nivel de servicio específico y por escrito.',
        'Podrán realizarse paradas de mantenimiento programadas, que se anunciarán con antelación y se procurará ejecutar en horario de baja actividad. Las paradas por causas de fuerza mayor, ataques informáticos o fallos de proveedores de terceros no generan derecho a indemnización.',
        `El soporte se presta por correo electrónico en ${COMPANY.supportEmail}, en español, inglés y portugués, en horario laboral de lunes a viernes. Los planes superiores pueden incluir tiempos de respuesta preferentes según se indique en el sitio web.`,
      ],
    },
    {
      title: 'Licencia de uso y propiedad intelectual',
      blocks: [
        'El Proveedor concede al Cliente una licencia de uso no exclusiva, intransferible, revocable y limitada a la vigencia del contrato y al número de usuarios contratados, con la única finalidad de utilizar el servicio conforme a estas condiciones.',
        'La licencia no supone cesión de derecho alguno de propiedad intelectual o industrial. El Proveedor conserva la titularidad del software, de la marca y de toda la documentación asociada.',
        'Los datos y contenidos que el Cliente introduzca en el servicio siguen siendo de su titularidad. El Proveedor solo los trata para prestar el servicio y en los términos del contrato de Encargado del tratamiento.',
      ],
    },
    {
      title: 'Responsabilidad',
      blocks: [
        'El Proveedor responde de los daños directos causados por incumplimiento doloso o por negligencia grave. Salvo en los supuestos en que la ley no lo permita, la responsabilidad total acumulada del Proveedor queda limitada al importe efectivamente abonado por el Cliente en los doce meses anteriores al hecho que la origine.',
        'El Proveedor no responde del lucro cesante, de la pérdida de oportunidades de negocio ni de los daños indirectos. Tampoco responde de las actuaciones realizadas por el técnico sobre el equipo asistido durante una sesión, que son responsabilidad de quien las ejecuta y de quien las autoriza.',
        'Estas limitaciones no se aplican frente a consumidores en aquello en que la normativa de defensa de consumidores y usuarios lo impida, ni en caso de dolo, daños personales o cualquier otro supuesto de responsabilidad no excluible legalmente.',
      ],
    },
    {
      title: 'Protección de datos',
      blocks: [
        'El tratamiento de los datos personales del Cliente se rige por la Política de privacidad.',
        'Cuando durante la prestación del servicio el Proveedor acceda a datos personales de los que el Cliente sea responsable, ambas partes quedan vinculadas por el contrato de Encargado del tratamiento publicado en este mismo sitio, que se acepta junto con estas condiciones y que cumple lo exigido por el artículo 28 del Reglamento (UE) 2016/679.',
      ],
    },
    {
      title: 'Modificación de las condiciones',
      blocks: [
        'El Proveedor podrá modificar estas condiciones por motivos legales, técnicos u organizativos. Los cambios sustanciales se comunicarán al Cliente con al menos treinta días de antelación. Si el Cliente no los acepta, podrá resolver el contrato antes de su entrada en vigor con devolución de la parte proporcional no consumida.',
        'A cada contratación se le aplica la versión de las condiciones vigente en el momento de realizarla.',
      ],
    },
    {
      title: 'Ley aplicable, reclamaciones y resolución de litigios',
      blocks: [
        'Estas condiciones se rigen por la legislación española.',
        `El Cliente puede dirigir cualquier reclamación a ${COMPANY.supportEmail}. El Proveedor acusará recibo y responderá en el plazo máximo de un mes.`,
        'Conforme al Reglamento (UE) 524/2013, el consumidor residente en la Unión Europea puede acudir a la plataforma europea de resolución de litigios en línea disponible en ec.europa.eu/consumers/odr.',
        'Para la resolución de controversias, las partes se someten a los juzgados y tribunales del domicilio del Proveedor. Cuando el Cliente sea consumidor, serán competentes los juzgados y tribunales de su propio domicilio.',
      ],
    },
  ],
};
