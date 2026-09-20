# Plan de cierre de RF-11, RF-13 y RF-14

Estado: planificación; funcionalidades aún no implementadas en esta entrega.

Base revisada: frontend `ab47b86`, backend `96d4cca`, rama `ingrid` en ambos. Objetivo: entregar los tres requerimientos operativos de extremo a extremo reutilizando `fatima`, incluyendo las integraciones indispensables con otros módulos. No dejar los flujos bloqueados a la espera de otro integrante.

Configuración: [CONFIGURACION_LOCAL.md](CONFIGURACION_LOCAL.md). Trabajo sobre otros requerimientos: [INTEGRACIONES_OTROS_REQUERIMIENTOS.md](INTEGRACIONES_OTROS_REQUERIMIENTOS.md).

## Decisiones de alcance

- Mantener React Native/Expo Router y el backend modular Go con Chi y SQL existente. No migrar de framework, introducir ORM, microservicios o una arquitectura nueva.
- RF-11 contempla registro de cobros manuales completos en PEN y comprobante interno consultable. Métodos iniciales propuestos: efectivo, Yape, Plin, transferencia y tarjeta como registro de una operación externa. El cliente no confirma su propio pago. Sin pasarela, cuotas, pagos parciales ni facturación tributaria: no son exigidos por los RF entregados.
- Incluir reversión completa de un cobro con motivo, responsable y constancia de devolución manual cuando corresponda. El sistema no realiza transferencias bancarias; refleja la operación confirmada por el administrador. Nunca borrar un pago.
- RF-13 incluye registrar, editar, dar de baja, consultar asignaciones y medir rendimiento. La baja conserva historial y debe impedir acceso incluso con una sesión anterior.
- RF-14 cubre todos los indicadores solicitados. Exportar Excel/PDF es una ampliación opcional, no parte del cierre exigido. El comprobante interno podrá consultarse desde la app sin depender de un PDF o de R2.
- Completar el avance mínimo de atenciones necesario para producir datos reales de productividad y servicios realizados. RF-08 evidencias y el resto del alcance de otros integrantes no se asumen completos por esta integración.
- Estados y cambios de tablas de este documento son propuestas que se contrastarán con el esquema real. Resolver discrepancias en la etapa de contratos, sin dejar decisiones de integridad para el final.

## Inventario y reutilización

| Existe | Se conserva y amplía |
| --- | --- |
| `internal/modules/trabajadores/{handler,service,repository,models}.go` | Alta, listado, disponibilidad; agregar edición, baja, consultas y rendimiento |
| `src/app/admin-trabajadores.tsx` | Formulario y listado existente; agregar detalle, edición, baja y métricas |
| `src/services/reservas.service.ts` | Extraer únicamente `trabajadoresService`, actualizando sus consumidores; conservar APIs de reservas |
| `internal/modules/reservas` | Programación, validación documental, horarios y asignaciones; integrar ciclo de atención, bajas y cancelaciones |
| `internal/modules/pedidos` | Creación, detalle, stock y transiciones; el pago deja de ser un cambio manual de estado |
| `internal/modules/clientes` y `src/app/historial.tsx` | Historial existente de pagos y atenciones; conectar comprobante y datos nuevos sin duplicar la pantalla |
| `AuthContext`, `AuthGate`, `ResponsiveLayout` y `src/app/index.tsx` | Autenticación e interfaz existentes; distinguir los tres roles explícitamente |
| `api.ts`, `Screen`, `Card`, `Button`, `Input`, `Badge`, tema y diálogos | Cliente HTTP y componentes compartidos; usarlos en pantallas nuevas |
| Tablas referenciadas: `usuarios`, `trabajadores`, `atenciones`, `asignaciones_trabajadores`, `historial_estados_atencion`, `pagos`, `reservas`, `reserva_servicios`, `pedidos`, `detalle_pedido` | Verificar estructura real y ampliar mediante migraciones; no crear entidades paralelas |

No hay módulos propios de pagos ni reportes. No hay migraciones ni pruebas automatizadas encontradas en la base revisada. Las asignaciones actuales son por atención, no por servicio individual; las métricas deben expresar esa granularidad.

## Etapa 0. Contratos y base verificable

1. Conservar las dos ramas `ingrid`. No reinstalar ni arrancar ahora; hacerlo cuando comience la implementación.
2. Obtener el esquema de desarrollo: columnas, tipos monetarios, enums, claves, restricciones, índices y relaciones. Documentar baseline y migraciones en el backend. Preferir una base o rama Neon de desarrollo para pruebas.
3. Preparar migraciones incrementales y un procedimiento reproducible para una base vacía de pruebas. No recrear tablas existentes ni ejecutar cambios destructivos sobre la base compartida. Validar tanto instalación de prueba como actualización desde baseline; indicar recuperación si una migración no es reversible.
4. Definir contratos HTTP: DTO, roles, propiedad del recurso, sede, estados, errores, paginación y filtros. Conservar `/api/v1` y el formato de respuesta/error existente.
5. Fijar moneda PEN, dinero exacto y zona de negocio `America/Lima`; almacenar instantes con zona y convertir los límites de días al consultar. No depender de la zona local de Windows o del servidor. Usar carga explícita de zona con datos disponibles en el binario si hace falta.
6. Preparar datos de prueba: administrador, cliente, trabajadores activo/inactivo, servicios, vehículo con tipo, reserva, atención y pedido. Sin contraseñas reales ni datos personales del entorno compartido.

Salida: esquema verificado, contratos documentados, datos reproducibles y criterios monetarios/temporales resueltos. Las verificaciones de ejecución se harán entonces, no se dan por aprobadas en este plan.

## Etapa 1. RF-13: trabajadores y operación real

### Administración y sesión

- Reutilizar registro, listado y disponibilidad. Agregar edición de nombre, apellido, teléfono y datos laborales; validar correo/DNI únicos si se permite cambiarlos. No editar roles desde el formulario de trabajador.
- Baja lógica: actualizar `usuarios.activo`, `trabajadores.fecha_cese` y disponibilidad en una transacción, conservando referencias e historial.
- Si tiene asignaciones futuras o en curso, mostrar cuáles impiden la baja. Proporcionar acceso a la reasignación existente, con validación de disponibilidad; no dejar atenciones sin personal. Una atención en ejecución debe cerrarse antes de dar de baja al trabajador.
- Comprobar usuario activo en peticiones autenticadas, además de la firma JWT; el login actual comprueba activo, pero el middleware actual no revalida esa condición. Evitar acceso con tokens anteriores a la baja.
- Navegación con lista explícita de roles permitidos y validación de rutas directas. Agregar `isTrabajador` al contexto si simplifica los consumidores. Inicio, perfil y menú del trabajador no deben llamar endpoints exclusivos de cliente.

### Asignaciones y rendimiento

- Vista propia: asignaciones del trabajador autenticado, por fecha/estado, con placa, servicios, horario y estado. El ID del trabajador se obtiene del token.
- Vista administrativa: asignaciones e historial del trabajador seleccionado. Filtrar por sede cuando aplique; la sede procede de la identidad autenticada, no de un parámetro confiado al cliente.
- Implementar transición mínima `programada → en_proceso → finalizada`, adaptando nombres a los enums verificados. Administrador y trabajador asignado pueden operar según permisos; cliente consulta únicamente sus atenciones.
- Cada transición valida estado previo, guarda responsable/hora/historial y tiempos reales en una transacción. Finalizar actualiza la reserva a completada. Dos peticiones concurrentes no duplican el evento de cierre.
- Mantener la validación documental existente antes de programar/iniciar servicios que la requieren. Congelar asignaciones cuando empieza la atención para que la productividad histórica no cambie por reasignaciones posteriores.
- Rendimiento: atenciones finalizadas en las que participó, servicios incluidos en esas atenciones y duración real promedio de atención. Etiquetar como participación en equipo, no como horas individuales ni servicios ejecutados individualmente, porque el modelo no registra ese detalle.
- Reutilizar estas consultas de rendimiento en RF-14; no mantener dos fórmulas distintas.

Salida: administrador registra/edita/da de baja; trabajador entra a su vista, consulta e inicia/finaliza trabajo autorizado; el rendimiento refleja las finalizaciones reales.

## Etapa 2. RF-11: pagos y comprobante interno

### Modelo y reglas

- Nuevo módulo `internal/modules/pagos` siguiendo `handler → service → repository`; enlazarlo mediante `RegisterRoutes` en `cmd/api/main.go`.
- Extender la tabla `pagos` existente tras inspección. Un pago referencia exactamente una atención o un pedido, nunca ambos ni ninguno. Preservar los campos consumidos por el historial y los reclamos.
- Dinero: PostgreSQL `NUMERIC` con escala verificada y céntimos `int64` en lógica Go, o decimal exacto consistente. Leer los precios guardados en `reserva_servicios`/`detalle_pedido`, sin recalcular con el catálogo actual. Adaptar los puntos monetarios de pedidos/reservas que hoy usan `float64`; evitar conversiones imprecisas en el camino de cobro. Mantener compatibilidad de DTO existentes y documentar la representación de DTO nuevos.
- El servidor calcula importe y saldo. La pantalla muestra el cálculo; no acepta un monto enviado por el cliente como fuente de verdad. Cobro total único vigente por operación. Una atención se cobra finalizada; un pedido se cobra registrado antes de prepararse.
- Separar estado financiero de estado operativo. Una atención finalizada puede estar pendiente de pago; un pedido en preparación continúa pagado aunque su estado operativo ya no sea `pagado`.
- Registrar moneda, método, referencia externa cuando aplique, responsable y fecha. Generar identificador único de comprobante con restricción de unicidad; no usar `MAX + 1` sin control de concurrencia.
- Idempotencia persistida: misma clave y petición devuelve el resultado previo; misma clave con datos distintos devuelve conflicto. Bloqueo de la operación, pago y cambio de estado dentro de la misma transacción; una restricción evita dos cobros vigentes aunque lleguen claves diferentes.
- Comprobante consultable con número, operación, cliente, detalle y total congelados al cobrar. Los cambios posteriores de catálogo o perfil no alteran el documento histórico. Acceso del administrador de la sede o del cliente propietario.

### Integraciones y reversión

- Retirar la posibilidad de marcar `pagado` mediante el endpoint genérico de pedidos. El flujo de pagos actualiza ese estado y valida transiciones en la misma transacción; conservar stock y entrega existentes.
- Antes de anular/cancelar una operación cobrada, exigir el flujo administrativo de reversión completa, con motivo y confirmación de devolución manual cuando corresponda. Registro inmutable del movimiento; nunca ocultarlo borrando el pago original.
- Reversión de pedido: antes de preparación puede volver a pendiente de cobro o cancelarse según la acción solicitada; si ya está preparándose, la reversión se integra con cancelación y devolución de stock una sola vez. Un pedido entregado requiere el flujo de reclamo existente; no permitir cancelarlo por un atajo que reponga stock sin devolución física.
- Reversión de cobro de atención finalizada: conserva la atención y vuelve a dejar su importe pendiente para corrección de cobro; el nuevo pago recibe otro comprobante. La corrección no modifica productividad. Registrar explícitamente el motivo.
- Ajustar cancelación de reservas: hoy borra atención, asignaciones e historial. Conservar la atención cancelada y su historial; proteger pagos/evidencias y bloquear modificaciones de atenciones en curso/finalizadas. Validar bajo bloqueo el estado real, no solo antes de abrir la transacción.
- Mostrar pago y comprobante en el historial del cliente, reutilizando RF-02. Mantener referencias para reclamos RF-15.

Salida: cobrar atención/pedido, consultar comprobante, registrar corrección permitida y ver historial sin desajustes entre pago, pedido, stock e indicadores.

## Etapa 3. RF-14: reportes e indicadores

Nuevo módulo `internal/modules/reportes` y pantalla `admin-reportes.tsx`. Consultas SQL agregadas en servidor, filtros por rango y sede autorizada, validación de límites y estados vacíos. Empezar por cifras/tablas verificables; añadir gráficos simples reutilizando dependencias existentes si resultan suficientes.

| Reporte | Fuente y definición |
| --- | --- |
| Ingresos | Cobros confirmados por fecha de cobro; mostrar ingresos brutos, reversiones por fecha de reversión e ingreso neto. Separar servicios/productos y métodos. No usar reservas estimadas como ingreso |
| Servicios | Cantidades de servicios de atenciones finalizadas, por servicio y fecha de finalización; valor operativo separado del ingreso cobrado |
| Ventas | Pedidos y unidades vendidas, montos cobrados y reversiones; distinguir registrado, cobrado, entregado y cancelado |
| Reservas | Reservas por fecha programada y estado; cancelaciones y tasa de cancelación con denominador visible |
| Productividad | Misma consulta/regla de RF-13; excluir programadas y canceladas, contar participación una vez por trabajador/atención |
| Demanda | Reservas solicitadas por día/franja y servicio, mostrando canceladas por separado. Documentar que la base actual conserva fecha programada vigente, no todas las fechas históricas reprogramadas |
| Tipos de vehículo | Atenciones finalizadas agrupadas por tipo; distinguir cantidad de atenciones y vehículos únicos |

- Si el registro mínimo de vehículos no permite capturar tipo, completar campo, validación y edición mínima. Los históricos sin tipo se muestran como `Sin clasificar`; no inventar datos.
- Evitar multiplicar ingresos al unir pagos con varios servicios y trabajadores: agregar por operación antes de cruzar dimensiones, o usar consultas independientes.
- No sumar participaciones de trabajadores para calcular atenciones totales del negocio. Duración faltante se reporta como no disponible, no como cero.
- Caso temporal obligatorio: cobro en un mes y reversión en otro. El mes original conserva su cobro; la reversión afecta el período en que ocurrió.
- Agregar índices de filtros y joins comprobando planes de consulta y volumen de prueba. No introducir caché, materializaciones o un almacén analítico sin necesidad medida.

Salida: todos los reportes solicitados disponibles y reconciliados con operaciones y movimientos de prueba.

## Organización de archivos propuesta

```text
CarwashInmariBackend/
  migrations/                       # baseline documentado y cambios incrementales
  internal/modules/trabajadores/    # ampliar lo existente
  internal/modules/atenciones/      # ciclo mínimo e historial compartido
  internal/modules/pagos/           # registro, reversión y comprobante
  internal/modules/reportes/        # filtros y consultas agregadas
  internal/modules/pedidos/         # integración de cobro/cancelación
  internal/modules/reservas/        # integridad de asignaciones y cancelación
  internal/middleware/auth.go       # vigencia efectiva de la cuenta
  cmd/api/main.go                   # conectar rutas y verificar configuración/BD

CarwashInmariFrontend/src/
  app/admin-trabajadores.tsx        # ampliar
  app/mis-asignaciones.tsx          # crear
  app/admin-pagos.tsx               # crear
  app/comprobante/[id].tsx          # crear
  app/admin-reportes.tsx            # crear
  services/trabajadores.service.ts  # extraer y ampliar
  services/atenciones.service.ts    # crear
  services/pagos.service.ts         # crear
  services/reportes.service.ts      # crear
  types/                           # tipos de cada módulo; reexports compatibles
```

Crear componentes o hooks específicos cuando separen una responsabilidad real, no por cada bloque de JSX. Mantener rutas existentes y actualizar todos los imports al extraer servicios. Usar las pantallas de reservas/historial para mostrar el avance al administrador y cliente sin crear otra navegación paralela.

## Criterios de clean code

- Handler: HTTP, decodificación y respuesta. Service: reglas del caso de uso y autorización contextual. Repository: SQL y persistencia. No SQL en handlers ni reglas de dinero/estados en componentes React.
- Un solo dueño por regla: pagos gobierna cobros; pedidos gobierna stock/transiciones de pedido; atenciones gobierna avance; trabajadores gobierna personal; reportes lee y agrega. Usar interfaces pequeñas y colaboradores que compartan la transacción cuando una operación cruza módulos; evitar dependencias circulares y commits internos independientes.
- Revalidar invariantes dentro de la transacción: estado, usuario activo, asignaciones y cobro vigente. Mantener orden de bloqueos consistente.
- Funciones con nombres de negocio, entradas tipadas y errores existentes. Sin nuevos `any`, SQL concatenado con entrada del usuario ni secretos en código/logs.
- Reutilizar cliente HTTP, tema, estados de carga/error/vacío y componentes. Pantallas coordinan interacción; no acumulan todas las consultas y cálculos de negocio.
- Tipos nuevos por módulo con reexports desde `src/types/index.ts` si preservan compatibilidad. Evitar refactorizar módulos completos ajenos solo para uniformarlos.
- Rutas protegidas en frontend para experiencia de usuario y controles independientes en backend por rol, propiedad, sede y estado de cuenta.
- Cada entrega incluye integración backend/frontend, migración si corresponde, pruebas relevantes y documentación; no dejar botones simulados o endpoints sin conectar.

## Validación y cierre

Las pruebas se ejecutarán durante implementación en un entorno de prueba, no sobre los datos compartidos del negocio.

1. RF-13: duplicados de correo/DNI, edición, baja con asignaciones, reasignación válida, token previo a la baja, acceso de otro trabajador, transición concurrente, productividad de equipo.
2. RF-11: importe exacto, cambio de precio posterior a reserva/pedido, doble toque, reintento con misma clave, dos claves concurrentes, fallo intermedio con rollback, comprobante estable, reversión duplicada y cancelación con stock restituido una vez.
3. RF-14: dataset con totales esperados calculados manualmente; límites de fecha Lima, período sin datos, reversión en otro mes, atención con dos servicios y dos trabajadores, vehículo sin tipo. Verificar que no se multipliquen ingresos.
4. Permisos: cliente solo sus pagos/atenciones, trabajador solo sus asignaciones, administrador solo datos autorizados; probar URL directa y petición HTTP, no únicamente menú oculto.
5. Regresión integrada: reserva con documento requerido no se programa sin validación; reservas y pedidos siguen funcionando; historial y reclamos conservan enlaces; stock no cambia al consultar/cobrar; navegación móvil y web funciona para los tres roles.
6. Ejecutar `go test ./...`, `go vet ./...` y comprobación TypeScript `npx tsc --noEmit`; configurar lint reproducible si el script actual necesita configuración. Añadir pruebas de integración PostgreSQL para transacciones/concurrencia y pruebas de interfaz para flujos críticos, con las herramientas mínimas necesarias.
7. Actualizar el registro de integraciones con archivos definitivos, migraciones, pruebas y commits. Ninguna integración necesaria se da por cerrada solo porque fue descrita.

### Secuencia de entregas

1. Contratos, baseline, migraciones y datos de prueba.
2. Personal, baja efectiva y navegación por rol.
3. Asignaciones, avance de atención y rendimiento de RF-13.
4. Pagos, comprobante e integración con pedidos/historial.
5. Reversiones y cancelaciones consistentes.
6. Reportes completos con reconciliación de datos.
7. Pruebas integradas, revisión de cambios y documentación de cierre.

Se considera terminado cuando los tres RF pueden demostrarse con datos reales de prueba, los caminos de error mantienen la integridad y todas las integraciones indispensables del archivo aparte están implementadas y verificadas. La disponibilidad de credenciales/esquema es un prerrequisito de ejecución; el trabajo funcional de otros integrantes incluido aquí no se deja como dependencia externa.
