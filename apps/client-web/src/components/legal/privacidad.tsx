import { type LegalDocument } from './legal-doc';

import { COMPANY, formattedAddress } from '@/lib/company';


/**
 * Política de privacidad. Cubre los artículos 13 y 14 del Reglamento (UE)
 * 2016/679 (RGPD) y la Ley Orgánica 3/2018 (LOPDGDD).
 *
 * El contenido describe el tratamiento real del producto: autenticación por
 * enlace mágico, metadatos de sesión y flujo de medios cifrado extremo a
 * extremo que el Titular no puede descifrar. Si el producto empieza a grabar
 * sesiones o a añadir analítica, este documento debe actualizarse antes.
 */
export const privacidadDoc: LegalDocument = {
  slug: 'privacidad',
  shortTitle: 'Privacidad',
  title: 'Política de privacidad',
  intro:
    'Cómo tratamos tus datos personales cuando usas Lume, con qué finalidad, durante cuánto tiempo y qué derechos tienes sobre ellos.',
  sections: [
    {
      title: 'Responsable del tratamiento',
      blocks: [
        {
          type: 'table',
          head: ['Dato', 'Información'],
          rows: [
            ['Responsable', `${COMPANY.legalName} (${COMPANY.tradeName})`],
            ['NIF / CIF', COMPANY.taxId],
            ['Domicilio', formattedAddress()],
            ['Correo de contacto en materia de protección de datos', COMPANY.privacyEmail],
          ],
        },
        'No estamos obligados a designar un Delegado de Protección de Datos conforme al artículo 37 del RGPD, ya que nuestra actividad principal no consiste en el tratamiento a gran escala de datos sensibles ni en la observación habitual y sistemática de interesados. Puede dirigir cualquier consulta sobre privacidad al correo indicado arriba.',
      ],
    },
    {
      title: 'Qué datos tratamos',
      blocks: [
        'Tratamos únicamente los datos necesarios para prestar el servicio. Los agrupamos según el papel que desempeñes:',
        {
          type: 'table',
          head: ['Perfil', 'Datos tratados'],
          rows: [
            [
              'Técnico con cuenta',
              'Correo electrónico, nombre si lo facilitas, organización a la que perteneces, fecha de alta, historial de sesiones creadas, dirección IP y datos técnicos de conexión.',
            ],
            [
              'Usuario asistido (cliente final)',
              'Nombre que se muestra en la sesión si se indica, código de sesión, marca temporal de inicio y fin, y metadatos técnicos del equipo (sistema operativo, navegador, resolución de pantalla, número de monitores).',
            ],
            [
              'Cliente que contrata un plan',
              'Datos de facturación: denominación o nombre, NIF o CIF, dirección fiscal, correo de facturación e histórico de facturas emitidas.',
            ],
            [
              'Cualquier visitante',
              'Datos de navegación estrictamente necesarios para que el sitio funcione y registros de seguridad del servidor.',
            ],
          ],
        },
        {
          type: 'note',
          text: 'El contenido de la pantalla compartida durante una sesión viaja cifrado extremo a extremo entre los dos participantes mediante DTLS-SRTP. Cuando la conexión directa no es posible, los paquetes pasan por un servidor de retransmisión TURN que solo ve tráfico cifrado y no puede descifrarlo. No grabamos ni almacenamos el contenido de las sesiones.',
        },
        'No tratamos categorías especiales de datos (salud, ideología, biometría y similares). Si en el transcurso de una sesión de soporte se muestran en pantalla datos de ese tipo, el responsable de esa información sigue siendo el titular del equipo asistido y nosotros actuamos como encargado del tratamiento en los términos descritos en el documento de Encargado del tratamiento.',
      ],
    },
    {
      title: 'Para qué usamos tus datos y con qué base legal',
      blocks: [
        {
          type: 'table',
          head: ['Finalidad', 'Base jurídica (RGPD)', 'Conservación'],
          rows: [
            [
              'Crear y mantener tu cuenta, y autenticarte mediante enlace de acceso enviado por correo.',
              'Ejecución de un contrato (art. 6.1.b).',
              'Mientras la cuenta esté activa y 12 meses tras su baja.',
            ],
            [
              'Establecer y gestionar sesiones de asistencia remota entre el técnico y el usuario asistido.',
              'Ejecución de un contrato (art. 6.1.b) para el técnico y consentimiento expreso (art. 6.1.a) para el usuario asistido, que autoriza cada sesión de forma manual.',
              'Los metadatos de la sesión se conservan 24 meses para el historial y la trazabilidad.',
            ],
            [
              'Emitir facturas, cobrar los planes de pago y cumplir obligaciones contables y fiscales.',
              'Obligación legal (art. 6.1.c).',
              '6 años desde la emisión, conforme al artículo 30 del Código de Comercio, y 4 años a efectos tributarios.',
            ],
            [
              'Garantizar la seguridad del servicio, prevenir el abuso y el fraude, y diagnosticar incidencias.',
              'Interés legítimo (art. 6.1.f) en proteger la infraestructura y a los usuarios.',
              'Registros de seguridad: 12 meses.',
            ],
            [
              'Atender consultas de soporte que nos envías por correo.',
              'Ejecución de un contrato o interés legítimo (art. 6.1.b y 6.1.f).',
              '24 meses desde la última comunicación.',
            ],
            [
              'Enviarte novedades del producto y comunicaciones comerciales.',
              'Consentimiento (art. 6.1.a) o interés legítimo respecto de clientes con relación contractual previa, conforme al artículo 21.2 de la LSSI.',
              'Hasta que retires el consentimiento o te des de baja.',
            ],
          ],
        },
        'Transcurridos los plazos indicados, los datos se bloquean y quedan a disposición exclusiva de jueces, tribunales y administraciones competentes durante el plazo de prescripción de las acciones legales, y después se suprimen de forma segura.',
      ],
    },
    {
      title: 'Quién puede acceder a tus datos',
      blocks: [
        'No vendemos ni cedemos tus datos personales. Solo acceden a ellos los proveedores que necesitamos para prestar el servicio, que actúan como encargados del tratamiento y con los que tenemos firmado el contrato exigido por el artículo 28 del RGPD:',
        {
          type: 'table',
          head: ['Proveedor', 'Servicio prestado', 'Ubicación'],
          rows: [
            [
              'Cloudflare, Inc.',
              'Red de distribución, protección frente a ataques y servidores de retransmisión TURN para las conexiones de vídeo.',
              'Unión Europea y Estados Unidos, con cláusulas contractuales tipo.',
            ],
            [
              'Resend, Inc.',
              'Envío de los correos transaccionales, incluido el enlace de acceso a la cuenta.',
              'Unión Europea y Estados Unidos, con cláusulas contractuales tipo.',
            ],
            [
              'Proveedor de alojamiento de la aplicación y la base de datos',
              'Ejecución de la aplicación y almacenamiento de los datos de cuenta y de sesión.',
              'Unión Europea.',
            ],
          ],
        },
        'Además, podremos comunicar datos a las administraciones públicas, jueces y tribunales cuando exista una obligación legal, y a nuestra asesoría fiscal y contable para el cumplimiento de las obligaciones tributarias.',
        'Cuando un proveedor esté ubicado fuera del Espacio Económico Europeo, la transferencia se ampara en las cláusulas contractuales tipo aprobadas por la Comisión Europea o en una decisión de adecuación, junto con las medidas complementarias que resulten necesarias.',
      ],
    },
    {
      title: 'Tus derechos',
      blocks: [
        'Puedes ejercer en cualquier momento y de forma gratuita los siguientes derechos:',
        {
          type: 'list',
          items: [
            'Acceso: saber qué datos tuyos tratamos y obtener una copia.',
            'Rectificación: corregir los datos inexactos o incompletos.',
            'Supresión: pedir que borremos tus datos cuando ya no sean necesarios.',
            'Oposición: oponerte a un tratamiento basado en nuestro interés legítimo.',
            'Limitación: pedir que conservemos los datos sin usarlos mientras se resuelve una reclamación.',
            'Portabilidad: recibir tus datos en un formato estructurado y de uso común, o pedir que los enviemos a otro responsable.',
            'Retirar el consentimiento en cualquier momento, sin que ello afecte a la licitud del tratamiento previo.',
          ],
        },
        `Para ejercerlos, escribe a ${COMPANY.privacyEmail} indicando el derecho que ejerces y adjuntando un documento que acredite tu identidad. Responderemos en el plazo máximo de un mes, ampliable a dos meses en casos complejos.`,
        'Si consideras que no hemos atendido correctamente tu solicitud, puedes presentar una reclamación ante la Agencia Española de Protección de Datos (C/ Jorge Juan 6, 28001 Madrid, www.aepd.es), que es la autoridad de control competente.',
      ],
    },
    {
      title: 'Seguridad de la información',
      blocks: [
        'Aplicamos medidas técnicas y organizativas apropiadas al riesgo, conforme al artículo 32 del RGPD. Entre otras:',
        {
          type: 'list',
          items: [
            'Cifrado en tránsito mediante TLS en toda la web y la API, y DTLS-SRTP en el flujo de pantalla.',
            'Autenticación sin contraseña mediante enlaces de un solo uso y de vigencia limitada, y tokens de sesión de corta duración.',
            'Códigos de sesión aleatorios, de un solo uso y con caducidad, que dejan de ser válidos al terminar la sesión.',
            'Control de acceso por organización, de forma que un técnico solo accede a las sesiones de la suya.',
            'Registro de accesos y de operaciones relevantes para poder auditar quién hizo qué y cuándo.',
            'Copias de seguridad periódicas de la base de datos con verificación de restauración.',
          ],
        },
        `Si se produjese una violación de seguridad que suponga un riesgo para tus derechos y libertades, te lo comunicaremos sin dilación indebida y lo notificaremos a la Agencia Española de Protección de Datos en el plazo de 72 horas previsto en el artículo 33 del RGPD.`,
      ],
    },
    {
      title: 'Menores de edad',
      blocks: [
        'El servicio está dirigido a profesionales y empresas. No está destinado a menores de 14 años y no recogemos deliberadamente datos de menores de esa edad. Si detectamos que hemos tratado datos de un menor sin el consentimiento de quien ejerza su patria potestad o tutela, los suprimiremos de inmediato.',
      ],
    },
    {
      title: 'Cambios en esta política',
      blocks: [
        'Podemos actualizar esta política para reflejar cambios legales o nuevas funcionalidades del servicio. Publicaremos siempre la fecha de la última actualización y, cuando el cambio sea sustancial, te avisaremos por correo electrónico o mediante un aviso destacado en la aplicación antes de que entre en vigor.',
      ],
    },
  ],
};
