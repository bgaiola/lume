import { type LegalDocument } from './legal-doc';

import { COMPANY, formattedAddress } from '@/lib/company';


/**
 * Contrato de encargado del tratamiento, exigido por el artículo 28.3 del
 * Reglamento (UE) 2016/679 siempre que un proveedor accede a datos
 * personales de los que su cliente es responsable.
 *
 * En asistencia remota esto no es opcional: durante una sesión el técnico ve
 * la pantalla del cliente, con lo que hay acceso a datos personales por
 * cuenta de este. Sin este documento firmado, el cliente empresa incumple el
 * RGPD por contratar el servicio.
 */
export const encargadoDoc: LegalDocument = {
  slug: 'encargado-tratamiento',
  shortTitle: 'Encargado del tratamiento',
  title: 'Contrato de encargado del tratamiento',
  intro:
    'Acuerdo exigido por el artículo 28 del RGPD que regula el acceso a datos personales de tus clientes cuando prestamos el servicio. Se acepta junto con las condiciones de contratación.',
  sections: [
    {
      title: 'Partes y objeto',
      blocks: [
        `Este contrato se celebra entre el Cliente que contrata ${COMPANY.productName}, que actúa como Responsable del tratamiento, y ${COMPANY.legalName}, con NIF ${COMPANY.taxId} y domicilio en ${formattedAddress()}, que actúa como Encargado del tratamiento.`,
        'Su objeto es regular el acceso del Encargado a los datos personales de los que el Responsable es titular, cuando dicho acceso resulte necesario para prestar el servicio de asistencia remota.',
        'Este contrato se acepta de forma simultánea a las Condiciones generales de contratación y tiene la misma vigencia que estas. Si el Responsable necesita un ejemplar firmado en documento aparte, puede solicitarlo en ' +
          COMPANY.privacyEmail +
          '.',
      ],
    },
    {
      title: 'Alcance del tratamiento',
      blocks: [
        {
          type: 'table',
          head: ['Elemento', 'Detalle'],
          rows: [
            [
              'Naturaleza y finalidad',
              'Alojamiento de las cuentas y del historial de sesiones, establecimiento de la conexión remota y, durante la sesión, visualización y control del equipo asistido con el fin exclusivo de prestar soporte técnico.',
            ],
            [
              'Tipo de datos',
              'Datos identificativos y de contacto de los usuarios técnicos, metadatos técnicos del equipo asistido y, de forma incidental y no persistente, cualquier dato personal que se muestre en la pantalla compartida durante la sesión.',
            ],
            [
              'Categorías de interesados',
              'Empleados y colaboradores del Responsable, y personas cuyos datos aparezcan en los sistemas del equipo asistido durante la sesión.',
            ],
            [
              'Duración',
              'La vigencia del contrato de servicio, más los plazos de conservación indicados en la Política de privacidad.',
            ],
          ],
        },
        {
          type: 'note',
          text: 'El flujo de pantalla viaja cifrado extremo a extremo entre los dos participantes. El Encargado no lo graba ni lo almacena, y su infraestructura de retransmisión solo maneja paquetes cifrados que no puede descifrar. El acceso a los datos que se muestran en pantalla se produce únicamente en el dispositivo del técnico y solo mientras dura la sesión autorizada.',
        },
      ],
    },
    {
      title: 'Obligaciones del Encargado',
      blocks: [
        'El Encargado se obliga a:',
        {
          type: 'ordered',
          items: [
            'Tratar los datos personales únicamente siguiendo instrucciones documentadas del Responsable, incluidas las relativas a transferencias internacionales, salvo obligación legal, en cuyo caso lo informará previamente salvo prohibición legal.',
            'No utilizar los datos para finalidad propia ni comunicarlos a terceros, ni siquiera para su conservación, salvo autorización expresa del Responsable o previsión legal.',
            'Garantizar que las personas autorizadas para tratar los datos se han comprometido a respetar la confidencialidad, con un deber que subsiste tras el fin de la relación.',
            'Aplicar las medidas técnicas y organizativas apropiadas exigidas por el artículo 32 del RGPD, descritas en la Política de privacidad y actualizadas conforme a la evolución del estado de la técnica.',
            'Asistir al Responsable, teniendo en cuenta la naturaleza del tratamiento y mediante medidas apropiadas, para que pueda atender las solicitudes de ejercicio de derechos de los interesados.',
            'Ayudar al Responsable a cumplir sus obligaciones de seguridad, notificación de violaciones, evaluación de impacto y consulta previa, conforme a los artículos 32 a 36 del RGPD.',
            'Notificar al Responsable, sin dilación indebida y en un plazo máximo de 48 horas desde que tenga conocimiento, cualquier violación de la seguridad de los datos, indicando la naturaleza del incidente, las categorías y el número aproximado de interesados afectados, las consecuencias probables y las medidas adoptadas.',
            'Poner a disposición del Responsable la información necesaria para demostrar el cumplimiento de estas obligaciones y permitir auditorías en los términos previstos más abajo.',
          ],
        },
      ],
    },
    {
      title: 'Obligaciones del Responsable',
      blocks: [
        'El Responsable se obliga a:',
        {
          type: 'ordered',
          items: [
            'Disponer de una base jurídica válida para el tratamiento y haber informado debidamente a los interesados, incluida la comunicación de que se emplea un proveedor de asistencia remota.',
            'Obtener el consentimiento de la persona que usa el equipo asistido antes de iniciar cada sesión, y velar por que esta pueda finalizarla en cualquier momento.',
            'Evitar mostrar durante la sesión datos que no sean necesarios para resolver la incidencia, en aplicación del principio de minimización.',
            'Velar por el cumplimiento previo y durante todo el tratamiento de la normativa de protección de datos, y por la exactitud de las instrucciones impartidas al Encargado.',
          ],
        },
      ],
    },
    {
      title: 'Subencargados',
      blocks: [
        'El Responsable autoriza de forma general al Encargado a recurrir a los siguientes subencargados, necesarios para prestar el servicio:',
        {
          type: 'table',
          head: ['Subencargado', 'Función', 'Ubicación del tratamiento'],
          rows: [
            [
              'Cloudflare, Inc.',
              'Red de distribución, protección frente a ataques y retransmisión de las conexiones de vídeo.',
              'Unión Europea y Estados Unidos, con cláusulas contractuales tipo.',
            ],
            [
              'Resend, Inc.',
              'Envío de correos transaccionales.',
              'Unión Europea y Estados Unidos, con cláusulas contractuales tipo.',
            ],
            [
              'Proveedor de alojamiento de la aplicación y la base de datos',
              'Ejecución del servicio y almacenamiento de cuentas e historial.',
              'Unión Europea.',
            ],
          ],
        },
        'El Encargado informará al Responsable de cualquier alta o sustitución de subencargados con al menos treinta días de antelación. Durante ese plazo el Responsable podrá oponerse por motivos razonables y, si la objeción no puede resolverse, resolver el contrato sin penalización y con devolución de la parte proporcional no consumida.',
        'El Encargado impondrá a todo subencargado, mediante contrato, las mismas obligaciones de protección de datos que asume en el presente documento, y responderá frente al Responsable del incumplimiento de aquel.',
      ],
    },
    {
      title: 'Transferencias internacionales',
      blocks: [
        'Cuando un subencargado trate datos fuera del Espacio Económico Europeo, la transferencia se amparará en una decisión de adecuación de la Comisión Europea o en las cláusulas contractuales tipo aprobadas por esta, complementadas con las medidas técnicas adicionales que resulten necesarias tras la correspondiente evaluación de impacto de la transferencia.',
      ],
    },
    {
      title: 'Auditoría',
      blocks: [
        'El Responsable podrá verificar el cumplimiento de este contrato una vez al año, previa notificación con treinta días de antelación, mediante un cuestionario de seguridad o, si resulta insuficiente y de forma motivada, mediante una auditoría realizada por un tercero independiente sujeto a confidencialidad.',
        'La auditoría se realizará en horario laboral, sin interrumpir la actividad del Encargado y a costa del Responsable, salvo que se detecten incumplimientos relevantes, en cuyo caso los costes serán asumidos por el Encargado.',
      ],
    },
    {
      title: 'Devolución y supresión de los datos',
      blocks: [
        'Al finalizar la prestación del servicio, el Encargado, a elección del Responsable, devolverá los datos personales o los suprimirá, junto con las copias existentes, salvo que la normativa exija su conservación.',
        'El Responsable dispone de 30 días desde la baja para solicitar la exportación de sus datos. Transcurrido ese plazo sin solicitud, se procederá a su supresión segura, y el Encargado podrá conservar únicamente los datos bloqueados que exija la normativa fiscal y mercantil.',
      ],
    },
    {
      title: 'Responsabilidad',
      blocks: [
        'Cada parte responde de los daños que cause por el incumplimiento de las obligaciones que le impone el RGPD y este contrato, en los términos del artículo 82 del Reglamento.',
        'Los límites de responsabilidad pactados en las Condiciones generales de contratación se aplican también a este contrato, salvo en aquello que la normativa de protección de datos no permita limitar.',
      ],
    },
  ],
};
