# Trabajo de integración sobre requerimientos de otros integrantes

Responsable de ejecución de estas integraciones: Ingrid. Fecha: 19 de septiembre de 2026.

Este archivo separa el alcance originalmente asignado de los cambios necesarios para cerrar RF-11, RF-13 y RF-14. No representa mensajes enviados al equipo ni trabajo ya implementado. Todos los elementos parten como **Planificado** y deben actualizarse con evidencia al ejecutarlos.

## Registro de alcance

| ID | Integrante / RF original | Situación observada | Trabajo que se asume | Evidencia de cierre requerida | Estado |
| --- | --- | --- | --- | --- | --- |
| INT-01 | Joel / RF-01 | JWT valida firma/expiración; middleware no verifica si la cuenta fue desactivada. UI distingue principalmente admin/cliente | Comprobar cuenta activa en peticiones, navegación y rutas por tres roles; ajustar inicio/perfil del trabajador para evitar endpoints de cliente | Token anterior a baja rechazado; rutas directas y menús correctos para los tres roles | Planificado |
| INT-02 | Joel / RF-02 | El historial ya consulta pagos y atenciones | Conectar consulta de comprobante y estado financiero, conservando el contrato o adaptando todos sus consumidores | Cliente ve únicamente sus operaciones y abre su comprobante | Planificado |
| INT-03 | Joel / RF-15 | Reclamos referencian pagos/atenciones/pedidos | Preservar IDs y acceso al registro histórico ante reversión/cancelación; adaptar consultas solo si cambia un contrato | Reclamo previo sigue enlazando al pago original tras reversión | Planificado |
| INT-04 | Fatima / RF-12 | Pedido puede pasar a pagado con cambio manual de estado; cancelación devuelve stock | Pago confirma estado mediante transacción; retirar atajo manual; integrar reversión/cancelación y conservar stock/entrega | No hay pedido pagado sin cobro válido; reintentos no duplican cobro ni reposición de stock | Planificado |
| INT-05 | Erick / RF-06 y RF-09 | Cancelación borra atención e historial; reprogramación/asignación necesitan convivir con bajas y avance | Conservar atención cancelada e historial; validar estado bajo bloqueo; resolver asignaciones al reprogramar y bloquear cambios una vez iniciada; permitir reasignación previa a baja | No se borran referencias; sin cruces tras reprogramar; baja con asignaciones tiene solución desde la app | Planificado |
| INT-06 | Mego / RF-10 | Se crea atención programada e historial inicial, pero no hay módulo del ciclo de atención | Implementar avance mínimo, tiempos reales, historial y consulta por cliente/administrador; trabajadores operan solo asignaciones propias | Programar → iniciar → finalizar actualiza historial/reserva y alimenta productividad | Planificado |
| INT-07 | Mego / RF-03 | Registro de vehículos es mínimo; reporte requiere tipo de vehículo consistente | Verificar tipo existente; completar captura/edición mínima si falta, conservar históricos sin clasificar | Registro/edición alimenta reporte por tipo; históricos nulos se muestran sin inventar clasificación | Planificado |
| INT-08 | Fatima / RF-04 y RF-07 | Reserva conserva precio de servicio y programación valida documentos | Reutilizar precios históricos y validación documental; adaptar únicamente precisión monetaria o acceso requerido por el ciclo de atención | Cambiar catálogo no altera cobro histórico; documento requerido sin validar impide programación/inicio por atajos nuevos | Planificado |
| INT-09 | Transversal / PostgreSQL | No hay esquema/migraciones versionadas en los repositorios revisados | Verificar esquema, documentar baseline y agregar migraciones compatibles y datos de prueba para el alcance asumido | Instalación de prueba y actualización desde baseline verificadas, con recuperación documentada | Planificado |

## Límites y decisiones concretas

- Completar estas integraciones dentro de las entregas de Ingrid; la coordinación sirve para informar y mantener compatibilidad, no para posponer el cierre funcional.
- Reutilizar RF-05/RF-06/RF-09 existentes. Reprogramación debe revalidar trabajadores al nuevo horario o devolver la reserva a un estado que exija reasignación explícita, sin conservar una confirmación inválida. Elegir una única política en la etapa de contratos y cubrirla con prueba de cruce.
- RF-10 se completa en la parte necesaria para atenciones, tiempos e historial. No se declara terminado RF-08 de evidencias, ni funcionalidades ajenas que no sean necesarias para los tres RF de Ingrid.
- La validación de documentos RF-07 se conserva; no se reemplaza por un checkbox en frontend ni se crea una segunda implementación de carga de PDF.
- Los cambios en pagos, stock y cancelaciones se entregan juntos en backend y frontend. Un registro de devolución manual representa una operación efectuada; no simula una devolución bancaria automática.
- Si al implementar aparece otra dependencia que impide cerrar el flujo, añadir una fila con caso concreto, alcance mínimo, prueba y archivos; resolverla antes de dar por cerrado el RF afectado.

## Archivos previsiblemente afectados

Backend: `internal/middleware/auth.go`, módulos `clientes`, `pedidos`, `reservas`, `vehiculos`, nuevo módulo `atenciones`, migraciones y registro de rutas en `cmd/api/main.go`. Revisar consumidores de importes en `servicios`/`productos` si el cambio de precisión afecta sus contratos.

Frontend: `src/context/AuthContext.tsx`, `src/components/layout/ResponsiveLayout.tsx`, `src/app/_layout.tsx`, `src/app/index.tsx`, perfil, historial, pedidos administrativos, reservas y vehículos; servicios/tipos correspondientes. No duplicar interfaces existentes para el mismo caso de uso.

## Plantilla de actualización al implementar

Por cada ID, registrar:

```text
ID:
Estado: En implementación | Implementado sin verificar | Verificado
Comportamiento anterior:
Comportamiento final:
Archivos frontend:
Archivos backend:
Migración y efecto sobre datos existentes:
Contrato HTTP afectado y compatibilidad:
Pruebas ejecutadas y resultado:
Commit frontend / backend:
Limitaciones comprobadas, si existen:
```

No marcar `Verificado` sin pruebas. No registrar como completado un requisito completo de otro integrante por haber resuelto solamente su integración.
