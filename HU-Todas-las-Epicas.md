# Pestaña 1
# 1-Gestión de usuarios y autenticación
## ID: Registrar usuario
Título: Como usuario no registrado quiero registrarme en el sistema para acceder a sus
funcionalidades
Reglas de negocio:
- Debe ser mayor de edad
- El email debe ser único
- La contraseña debe tener al menos 6 dígitos
- El ingreso del DNI es obligatorio
- Se requiere doble autenticación vía mail

Criterios de aceptación:
Escenario 1: Registro exitoso
Dado un email “pepe@gmail.com” que no se encuentra registrado en el sistema, contraseña “abc123”, tiene 45 años y tiene su DNI correspondiente.
Cuando ingresa nombre “Pepe”, apellido “Martinez”, email “pepe@gmail.com”, contraseña “abc123”, adjunta la foto del DNI y presiona “registrar”
Entonces el sistema autentifica los datos y envía un correo al email ingresado, espera respuesta, registra el usuario y redirige al inicio

Escenario 2: Registro exitoso sin apto físico
Dado que el email “pepe@gmail.com” no está registrado en el sistema, la contraseña "abc123" tiene 6 caracteres, el DNI "12345678" corresponde a una persona de 25 años, y no se adjunta apto físico
Cuando el usuario ingresa nombre "Pepe", apellido "Martínez", email “pepe@gmail.com”, contraseña "abc123",adjunta fotos del DNI sin adjuntar apto físico, y presiona "Registrar"
Entonces el sistema espera respuesta de validación DNI, envía email de 2FA ,espera respuesta de confirmación, activa la cuenta sin permisos hasta adjuntar apto físico, registra al usuario y redirige al inicio.

Escenario 3: Registro exitoso con apto físico
Dado que el email “pepe@gmail.com” no está registrado en el sistema, la contraseña "abc123" tiene 6 caracteres, el DNI "12345678" corresponde a una persona de 25 años, y  se adjunta apto físico.
Cuando el usuario ingresa nombre "Pepe", apellido "Martínez", email “pepe@gmail.com”, contraseña "abc123", adjunta fotos del DNI y apto físico, y presiona "Registrar"
Entonces el sistema espera respuesta de validación del DNI, envía email de 2FA,espera respuesta de confirmación, activa la cuenta con el apto físico en estado "pendiente de aprobación", registra al usuario y redirige al inicio.

Escenario 4: Registro fallido por mail existente.
Dado un email “pepe@gmail.com” que ya se encuentra registrado en el sistema, contraseña “pepe123”, tiene 19 años y tiene el DNI correspondiente
Cuando ingresa nombre “Pepe”, apellido “Martinez”, email “pepe@gmail.com”, contraseña “pepe123”, adjunta fotos del DNI y presiona “registrar”
Entonces el sistema informa al usuario que el mail ya se encuentra registrado

Escenario 5: Registro fallido por contraseña menor a 6 dígitos
Dado un email “pepe@gmail.com” no se encuentra registrado en el sistema, contraseña “1234”, tiene 70 años y tiene el DNI correspondiente
Cuando ingresa nombre “pepe”, apellido “Martinez”, email “pepe@gmail.com”, contraseña “1234”, se pudo validar su DNI  y presiona “registrar”
Entonces el sistema informa al usuario que la contraseña debe ser mayor a 6 dígitos

Escenario 6: Registro fallido por error en la validación de DNI
Dado que el mail “pepe@gmail.com”, no se encuentra registrado, que la contraseña es “123456”, tiene 70 años y el DNICuando ingresa nombre “Pepe”, apellido “Martinez”, email “pepe@gmail.com”, contraseña “123456”, adjunta fotos del  DNI  y presiona “registrar”
Entonces el sistema muestra el error correspondiente.

Escenario 7: Registro fallido por error en la doble autenticacion
Dado que el email “pepe@gmail.com” no está registrado en el sistema, la contraseña "abc123" tiene 6 caracteres, el DNI "12345678" corresponde a una persona de 25 años, y  se adjunta apto físico.
Cuando el usuario ingresa nombre "Pepe", apellido "Martínez", email “pepe@gmail.com”, contraseña "abc123", adjunta fotos del DNI y apto físico, y presiona "Registrar"
Entonces el sistema espera respuesta de validación del DNI, envía email de 2FA,espera respuesta de confirmación, informa que el registro fallo por error en doble autenticacion.

## ID: Iniciar sesión
Título: Como usuario registrado quiero iniciar sesion al sistema para acceder a las funcionalidades

Reglas de negocio:

Criterios de aceptación:

Escenario 1: Inicio exitoso
Dado que el usuario con email “abc@gmail.com” se encuentra registrado en el sistema, su contraseña es “123456” y la cuenta no está suspendida
Cuando el usuario ingresa el email “abc@gmail.com” y la contraseña “123456” y presiona “Iniciar sesión”
Entonces el sistema reinicia el contador, verifica los datos y le da acceso al usuario al sistema

Escenario 2: Inicio fallido por mail inexistente
Dado que el email “abc@gmail.com” no se encuentra registrado en el sistema
Cuando el usuario ingresa el email “abc@gmail.com” y la contraseña “123456” y presiona “Iniciar sesión”
Entonces el sistema retorna un error por email incorrecto

Escenario 3: Inicio fallido por menos de 3 intentos fallidos de contraseña
Dado que el email “abc@gmail.com” se encuentra registrado en el sistema, su contraseña no es “123456”, el número de intento es 2 o menor y la cuenta no está suspendida
Cuando el usuario ingresa el email “abc@gmail.com” y la contraseña “123456” y presiona “Iniciar sesión”
Entonces el sistema retorna un error por contraseña incorrecta y aumenta en uno el conteo de inicios fallidos

Escenario 4: inicio fallido por 3 intentos fallidos de contraseña
Dado que el email “abc@gmail.com” se encuentra registrado en el sistema, su contraseña no es “123456”, es el tercer intento y la cuenta no está suspendida
Cuando el usuario ingresa el email “abc@gmail.com” y la contraseña “123456” y presiona “Iniciar sesión”
Entonces el sistema retorna un error por contraseña incorrecta y envía un mail para recuperar la contraseña y reinicia el contador

Escenario 5: inicio fallido por cuenta suspendida
Dado que el email “oscar@hotmail.com” se encuentra registrado en el sistema, su contraseña es “oscarPerez” y la cuenta está suspendida.Cuando ingresa “oscar@hotmail.com”  y la contraseña “oscarPerez” y presiona “Iniciar sesión”Entonces el sistema informa que no se puede iniciar sesion porque la cuenta se encuentra suspendida.

## ID: Cerrar sesión
Título: Como usuario registrado quiero cerrar la sesión para salir del sistema
Reglas de negocio:

Criterios de aceptación:
Escenario 1: cierre exitoso
Dado que el usuario con email “123@gmail.com” tiene sesión iniciada
Cuando el usuario selecciona la opción “Cerrar sesión” y presiona “confirmar“
Entonces el sistema cierra la sesión del usuario y redirige a la pantalla de inicio.

Escenario 2: cierre fallido por CANCELACION DE LA OPERACION
Dado que el usuario con email “123@gmail.com” tiene sesión iniciada
Cuando el usuario selecciona la opción “Cerrar sesión” y presiona “Cancelar”
Entonces el sistema cancela la operación / rechaza la operación

## ID: Recuperar contraseña
Título: Como usuario registrado quiero recuperar la contraseña para poder acceder a mi cuenta
Regla de negocio:

Criterios de aceptación:
Escenario 1: Recuperación exitosa
Dado que el email “abc@gmail.com” se encuentra registrado en el sistema.
Cuando el usuario ingresa el email “abc@gmail.com” y presiona “Recuperar contraseña”
Entonces el sistema manda un link al mail ingresado.

Escenario 2: Recuperación fallida por mail invalido
Dado que el email “abc@gmail.com” no se encuentra registrado en el sistema
Cuando el usuario ingresa el email “abc@gmail.com y presiona “Recuperar contraseña”
Entonces el sistema informa que el mail no se encuentra registrado.

## ID: Restablecer contraseña
Título: Como usuario o empleado registrado quiero restablecer la contraseña para poder acceder a mi cuenta
Reglas de negocio:
La contraseña debe tener al menos 6 dígitos
Criterios de aceptación:
Escenario 1: Restablecimiento exitosoDado una contraseña “abcdefg”.Cuando ingresa “abcdefg”, “abcdefg” y presiona “Restablecer”
Entonces el sistema registra la nueva contraseña y redirige a la página de iniciar sesión.

Escenario 2: Restablecimiento fallido por contraseña menor a 6 dígitos
Dado una contraseña “hola1”Cuando ingresa “hola1”,“hola1” y presiona “Restablecer”Entonces el sistema informa al usuario que la contraseña debe ser mayor a 6 dígitos

Escenario 3: Restablecimiento fallido por discrepanciaDado una contraseña “helloWord”Cuando ingresa “helloWord”, helloword” y presiona “Restablecer”Entonces el sistema informa que ambas contraseñas deben coincidir
## ID: Cambiar contraseña
Título: como usuario autenticado quiero cambiar la contraseña para mayor seguridad
Reglas de negocio
La contraseña debe tener al menos 6 dígitos
Criterios de aceptación:
Escenario 1: Cambio exitosoDado una contraseña “abcdefg”.Cuando ingresa “abcdefg”, “abcdefg” y presiona “Confirmar”
Entonces el sistema registra la nueva contraseña y redirige a la página de iniciar sesión.

Escenario 2: Cambio fallido por contraseña menor a 6 dígitos
Dado una contraseña “hola1”Cuando ingresa “hola1”,“hola1” y presiona “Confirmar”Entonces el sistema informa al usuario que la contraseña debe ser mayor a 6 dígitos

Escenario 3: Cambio fallido por discrepanciaDado una contraseña “helloWord”Cuando ingresa “helloWord”, helloword” y presiona “Confirmar”Entonces el sistema informa que ambas contraseñas deben coincidir

Escenario 4: Cambio fallido por cancelación
Dado una contraseña “abc12345”Cuando ingresa “abc12345”, “abc12345” y presiona “Cancelar”
Entonces el sistema cancela la operación.

## ID: Subir DNI
Título: Como usuario no registrado quiero subir mi DNI para poder registrar en el sistema

Reglas de negocio:

Criterios de aceptación:
Escenario 1: validación exitosa
Dado que el servidor de validación está disponible y el DNI adjuntado existe en la base de datos y corresponde a una persona mayor de edad,
Cuando el usuario adjunta la foto del DNI y presiona "Validar",
Entonces el sistema actualiza el estado del DNI a "verificado" y habilita el paso siguiente del registro.

Escenario 2: Validación fallida por datos inconsistente
Dado que el servidor de validación está disponible y el DNI adjuntado no existe en la base de datos,
Cuando el usuario adjunta la foto del DNI y presiona "Validar" ,
Entonces el sistema informa que no se reconoció el DNI ingresado.

Escenario 3: Validación fallida por usuario menor de edad
Dado que el servidor de validación está disponible y el DNI adjuntado corresponde a una persona menor de edad,
Cuando el usuario adjunta la foto del DNI y presiona "Validar",
Entonces el sistema informa que el usuario debe ser mayor de edad para registrarse.

Escenario 4: Validación fallida por fallo de conexión
Dado que el servidor de validación está disponible y el DNI adjuntado corresponde a una persona menor de edad,
Cuando el usuario adjunta la foto del DNI y presiona "Validar" ,
Entonces el sistema informa que el usuario debe ser mayor de edad para registrarse.
## ID: Eliminar cuenta Admin

Título: Como administrador quiero eliminar la cuenta de cualquier usuario para dar de baja permanentemente su acceso al sistema.
Reglas de negocio:

Criterios de Aceptación:

Escenario 1: Eliminación exitosa de recepcionista
Dado el empleado con email "recep@rehabilitar.com" tiene una cuenta activa con rol Recepcionista,
Cuando el administrador selecciona al empleado "recep@rehabilitar.com", presiona "Eliminar cuenta" y “confirmar”,
Entonces el sistema elimina la cuenta del empleado y registra la acción en el historial del sistema.

Escenario 2: Eliminación exitosa de profesor sin clases activas
Dado el empleado con email "prof@rehabilitar.com" tiene una cuenta activa con rol Profesor
Cuando el administrador selecciona al empleado "prof@rehabilitar.com", presiona "Eliminar cuenta" y “confirmar”,
Entonces el sistema elimina la cuenta del profesor y registra la acción en el historial del sistema.

Escenario 3: Eliminación exitosa de profesor con clases activas
Dado el empleado con email "prof@rehabilitar.com" tiene una cuenta activa con rol Profesor y tienes clases activas,
Cuando el administrador selecciona al empleado "prof@rehabilitar.com", presiona "Eliminar cuenta" y “confirmar”,
Entonces el sistema elimina la cuenta del profesor, lo desvincula de todas sus clases activas y registra la acción en el historial del sistema.

Escenario 4: Eliminación exitosa de administrador
Dado el empleado con email "admin2@rehabilitar.com" tiene una cuenta activa con rol Administrador,
Cuando el administrador selecciona al empleado "admin2@rehabilitar.com", presiona "Eliminar cuenta" y “confirmar”,
Entonces el sistema elimina la cuenta del administrador y registra la acción en el historial del sistema.

Escenario 5: Eliminación exitosa de cliente
Dado que el cliente con email "cliente@gmail.com" tiene una cuenta activa
Cuando el administrador selecciona al cliente "cliente@gmail.com", presiona "Eliminar cuenta" y “confirmar”,
Entonces el sistema elimina la cuenta y registra la acción en el historial del sistema.

Escenario 6: Eliminación fallida por cancelación
Dado que el administrador está autenticado y el empleado con email "recep@rehabilitar.com" tiene una cuenta activa
Cuando el administrador selecciona al empleado "recep@rehabilitar.com", presiona "Eliminar cuenta" y cancela la confirmación
Entonces el sistema cancela la operación.
## ID: Eliminar cuenta usuario

Título: Como usuario autenticado quiero eliminar mi propia cuenta para dar de baja mi acceso al sistema.
Reglas de negocio:

Criterios de Aceptación:
Escenario 1: Eliminación de cuenta exitosa.
Dado que el usuario con email "123@gmail.com" tiene sesión activa
Cuando el usuario selecciona "Eliminar cuenta" y presiona "Confirmar"
Entonces el sistema hace la baja de la cuenta junto con todos sus datos, cierra la sesión y redirige al usuario a la pantalla de inicio.

Escenario 2: Eliminación de cuenta fallida por cancelación.
Dado que el usuario con email "123@gmail.com" tiene sesión activa
Cuando el usuario selecciona "Eliminar cuenta" y presiona "Cancelar"
Entonces el sistema cancela la operación.

## ID: Ver perfil
Título: como usuario registrado quiero ver mi perfil para visualizar mis datos

Reglas de negocio:

Criterios de aceptación:
Escenario 1: visualización exitoso
Dado que el con mail “usuario1@gmail.com” usuario está autenticado,
Cuando el usuario con mail “usuario1@gmail.com” selecciona la opción "Mi perfil" ,
Entonces el sistema abre el panel del perfil del usuario

## ID: Editar perfil
Título: como usuario autenticado quiero editar mi perfil para actualizar mis datosReglas de negocio:

Criterios de aceptación:
Escenario 1: edición exitoso
Dado que el usuario está autenticado,
Cuando el usuario modifica sus datos con valores válidos y presiona "Guardar",
Entonces el sistema actualiza los datos del perfil y muestra un mensaje de confirmación.

Escenario 2: Edición fallida por campo obligatorio vacío
Escenario 3: edición cancelada
Dado que el usuario está autenticado,
Cuando el usuario modifica algún dato y presiona "Cancelar",
Entonces el sistema descarta los cambios y mantiene los datos anteriores del perfil.

## ID: Buscar empleado
Título: como usuario registrado quiero buscar empleados para ver su información
Reglas de negocio:

Criterios de aceptación:
Escenario 1: búsqueda exitoso
Dado que el usuario está autenticado y existe un empleado con nombre "Carlos" registrado en el sistema,
Cuando el usuario ingresa "Carlos" en el campo de búsqueda y presiona "Buscar",
Entonces el sistema muestra el listado de empleados cuyo nombre coincide con el criterio ingresado.
Escenario 2: búsqueda fallida
Dado que el usuario está autenticado y no existe ningún empleado con nombre "XYZ" en el sistema,
Cuando el usuario ingresa "XYZ" en el campo de búsqueda y presiona "Buscar",
Entonces el sistema informa que no se encontraron empleados con ese nombre.

## ID: Filtrar empleado
Título: como usuario registrado quiero filtrar empleados por especialidades para saber
Reglas de negocio:

Criterios de aceptación:
Escenario 1: filtrado exitoso
Dado que el usuario está autenticado un un "Tren superior" en el filtro y presiona "Aplicar",
Entonces el sistema muestra el listado de empleados que coinciden con el filtro aplicado.

Escenario 2: filtrado fallido
Dado que el usuario está autenticado y no existen empleados que coincidan con el filtro seleccionado,
Cuando el usuario aplica el filtro y presiona "Aplicar",
Entonces el sistema informa que no se encontraron empleados con ese criterio de filtrado.

Escenario 3: Limpiar filtros
Dado que la vista de empleados tiene filtros aplicados y el sistema muestra resultados filtrados,
Cuando el usuario presiona “limpiar filtros”,
Entonces el sistema elimina los filtros aplicados y muestra la lista completa de empleados.

## ID: Crear cuenta
Título:Como administrador quiero registrar la cuenta de un usuario para que pueda acceder a las funcionalidades correspondientes a su rol.
Reglas de negocio
El email debe ser único
Se debe asignar al menos una especialidad a los profesores
Criterios de aceptación
Escenario 1: Registro exitoso de recepcionistaDado el email "recep@rehabilitar.com" no está registrado en el sistema, y el rol seleccionado es "Recepcionista",Cuando el administrador ingresa nombre "Laura", apellido "Gómez", email "recep@rehabilitar.com", contraseña “pass1234”, selecciona rol "Recepcionista" y presiona "Registrar empleado",Entonces el sistema crea la cuenta con rol Recepcionista, envía las credenciales de acceso al email, y registra la acción en el historial del sistema.

Escenario 2: Registro exitoso de profesor
Dado el email "prof@rehabilitar.com" no está registrado en el sistema, y el rol seleccionado es "Profesor"
Cuando el administrador ingresa nombre "Carlos", apellido "Ruiz", email "prof@rehabilitar.com", contraseña “pass1234”, selecciona rol "Profesor", elige de la lista la especialidad "Tren superior" y presiona "Registrar empleado"
Entonces el sistema crea la cuenta con rol Profesor, envía las credenciales de acceso al email y registra la acción en el historial del sistema.

Escenario 3: Registro exitoso de usuario
Dado que el email "usuario@rehabilitar.com" no está registrado en el sistema, el rol seleccionado es "Usuario", y la contraseña “pass1234” tiene 6 caracteres,
Cuando el administrador, selecciona rol "Usuario", ingresa nombre "Carlos", apellido "Ruiz", email "usuario@rehabilitar.com", contraseña “pass1234”, y presiona "Registrar cuenta"
Entonces el sistema registra la cuenta con rol Usuario y con apto físico en estado “Pendiente”, envía las credenciales de acceso al email y registra la acción en el historial del sistema.

Escenario 4: Registro exitoso de administrador
Dado el email "admin2@rehabilitar.com" no está registrado en el sistema, y el rol seleccionado es "Administrador"
Cuando el administrador ingresa nombre "Carlos", apellido "Ruiz", email "admin2@rehabilitar.com", contraseña “pass1234”, selecciona rol "Administrador" y presiona "Registrar cuenta"
Entonces el sistema crea la cuenta con rol Administrador, envía las credenciales de acceso al email y registra la acción en el historial del sistema.

Escenario 5: Registro fallido por mail existente
Dado el email "recep@rehabilitar.com" ya está registrado en el sistema
Cuando el administrador ingresa los datos del nuevo empleado usando el email "recep@rehabilitar.com" y presiona "Registrar empleado"
Entonces el sistema informa que el email ya se encuentra registrado y no crea la cuenta.

Escenario 6: Registro fallido de profesor por no asignar especialidad
Dado el email "prof2@rehabilitar.com" no está registrado, y el rol seleccionado es "Profesor"
Cuando el administrador ingresa los datos del profesor pero no elige ninguna especialidad de la lista y presiona "Registrar empleado"
Entonces el sistema informa que un profesor debe tener una especialidad asignada.
Escenario 7: Registro fallido por contraseña menor a 6 dígitos.
Dado el email "usuario@rehabilitar.com" no está registrado en el sistema, y la contraseña “pass” tiene menos de 6 caracteres,
Cuando el administrador ingresa nombre "Carlos", apellido "Ruiz", email "usuario@rehabilitar.com", contraseña “pass”, selecciona un rol, y presiona "Registrar cuenta"
Entonces el sistema informa que la contraseña debe tener más de 6 dígitos.

## ID: Adjuntar apto físico
Título:como usuario registrado quiero adjuntar apto físico para poder acceder a las actividades
Reglas de negocio:

Criterios de aceptación:
Escenario 1: Adjuntar apto físico exitoso
Dado el usuario con email "cliente@gmail.com" y no tiene apto físico vigente.
Cuando el cliente adjunta el archivo "apto_fisico.pdf" y presiona "Enviar certificado"
Entonces el sistema registra el apto físico como "pendiente de aprobación".
Escenario 2: Adjuntar apto físico fallido por no seleccionar archivoDado el usuario con email "cliente@gmail.com" y no tiene apto físico vigenteCuando el cliente presiona "Enviar certificado" sin haber seleccionado ningún archivoEntonces el sistema informa que se debe adjuntar un archivo antes de enviar.
Escenario 3: Renovación exitosa de apto físicoDado que el cliente tiene sesión iniciada y su apto físico tiene estado "rechazado" o "vencido"
Cuando el cliente adjunta un nuevo archivo y presiona "Enviar certificado"
Entonces el sistema registra el nuevo apto físico en estado "pendiente de aprobación" y reemplaza el anterior.
## ID: Verificar apto físico
Título: como administrador quiero verificar el apto físico de los clientes para saber si están en condición de realizar las actividades
Reglas de negocio:

Criterios de aceptación:
Escenario 1: verificación aprobadaDado que hay una lista de apto físico sin verificar, un apto físico válido del usuario con email “pepe@gmail.com”Cuando selecciona “Aptos físicos pendientes", visualiza el apto físico del usuario con email “pepe@gmail.com” y presiona “Aprobar”.
Entonces el sistema registra y notifica al usuario la aprobación del apto físico

Escenario 2: verificación desaprobada
Dado que hay una lista de apto físico sin verificar, un apto físico inválido del usuario con email “pepe@gmail.com”Cuando selecciona “Aptos físicos pendientes”, visualiza el apto físico del usuario con email “pepe@gmail.com” y presiona “Desaprobar”.
Entonces el sistema notifica al usuario el resultado de la verificación

Escenario 3: verificación vacía
Dado que no hay lista de apto físico sin verificarCuando selecciona “Aptos físicos pendientes”
Entonces el sistema informa que no hay aptos físicos para verificar

## ID: Modificar información de usuario
Título: como administrador quiero modificar informaciones de los usuarios para actualizar datos
Reglas de negocios:

Criterios de aceptación:Escenario 1: modificación exitoso
Dado que el administrador está autenticado y el usuario con email "usuario@gmail.com" existe en el sistema
Cuando el administrador modifica los datos del usuario con valores válidos y presiona "Guardar"
Entonces el sistema actualiza los datos del usuario y registra la acción en el historial del sistema.

Escenario 2: Cambio de especialidad de profesor exitoso
Dado que el administrador está autenticado y el profesor con email "prof@rehabilitar.com" tiene la especialidad "Tren superior",
cuando el administrador selecciona al profesor "prof@rehabilitar.com", elige de la lista la especialidad "Tren medio" y presiona "Guardar",
entonces el sistema actualiza la especialidad del profesor a "Tren medio" y registra la acción en el historial del sistema

Escenario 3: Cambio de especialidad de profesor con clases asignadas exitoso
Dado que el administrador está autenticado y el profesor con email "prof@rehabilitar.com" tiene la especialidad "Tren superior" y tiene clases activas
cuando el administrador selecciona al profesor "prof@rehabilitar.com", elige de la lista la especialidad "Tren medio" y presiona "Guardar"
Entonces el sistema actualiza la especialidad del profesor a "Tren medio", lo desvincula de todas sus clases asignadas y registra la acción en el sistema.

Escenario 4: modificación fallida por cancelación
Dado que el administrador está autenticado y el usuario con email "usuario@gmail.com" existe en el sistema
Cuando el administrador modifica algún dato del usuario y presiona "Cancelar"
Entonces el sistema descarta los cambios y mantiene los datos anteriores del usuario.

## ID: Listar condiciones de cliente
Título: Como recepcionista quiero listar y visualizar la condición de acceso de un cliente para saber si puede ingresar a la clase.
Reglas de negocio:
- Para clientes no abonados, se muestra si tienen reserva y el estado de pago (total, seña, pendiente).
- Para clientes abonados, se muestra si tienen suscripción activa y están inscriptos en la clase.
- El sistema solo muestra la información disponible, no permite registrar pagos ni modificar estados desde esta pantalla.
Criterios de aceptación

Criterios de aceptación:

Escenario 1: Listado de inscriptos con condiciones de ingreso
Dado que el recepcionista está autenticado y selecciona la clase "Tren superior" de las 10:00
Cuando accede a la opción "Ver inscriptos"
Entonces el sistema muestra un listado con todos los clientes inscriptos y, para cada uno, su condición de ingreso (abonado con suscripción vigente, no abonado con pago total, no abonado con seña, pago pendiente, etc.).

Escenario 2: Listado de inscriptos vacío
Dado que el recepcionista está autenticado y selecciona la clase "Tren superior" de las 10:00
Cuando accede a la opción "Ver inscriptos"
Entonces el sistema informa que no hay inscriptos en la actividad.

## ID: Modificar Empleado
Título: Como administrador quiero modificar los datos de un empleado para mantener la información actualizada.

Reglas de negocio:

Criterios de aceptación:
Escenario 1: Modificación exitosa
Dado que el administrador está autenticado
Cuando modifica los campos permitidos de un empleado y presiona "Guardar"
Entonces el sistema actualiza los datos del empleado y registra la acción en el historial.

Escenario 2: Modificación cancelada
Dado que el administrador está autenticado
Cuando inicia una modificación y presiona "Cancelar"
Entonces el sistema descarta los cambios y mantiene los datos anteriores.

Escenario 3: Modificación fallida por validación
Dado que el administrador está autenticado
Cuando ingresa datos inválidos (p.ej. email con formato incorrecto) y presiona "Guardar"
Entonces el sistema muestra errores de validación y no guarda los cambios.

## ID: Busqueda de Usuarios
Título: Como administrador quiero buscar usuarios por nombre, email o DNI para localizar cuentas rápidamente.

Reglas de negocio:

Criterios de aceptación:
Escenario 1: Búsqueda con resultados
Dado que existen usuarios que coinciden con el criterio
Cuando el administrador ejecuta la búsqueda
Entonces el sistema muestra la lista de usuarios coincidentes paginada.

Escenario 2: Búsqueda sin resultados
Dado que no existen usuarios que coincidan con el criterio
Cuando el administrador ejecuta la búsqueda
Entonces el sistema muestra un mensaje indicando que no se encontraron resultados.
## ID: Listar empleados
Título: Como administrador quiero listar empleados para revisar y gestionar el personal.

Criterios de aceptación
Escenario 1: Listado con resultados
Dado que existen empleados en el sistema,
Cuando el administrador abre la vista de empleados,
Entonces el sistema muestra la lista de empleados con paginación y filtros aplicables.

Escenario 2: Listado vacío
Dado que no existen empleados registrados,
Cuando el administrador abre la vista de empleados,
Entonces el sistema muestra un mensaje indicando que no hay empleados.

Escenario 3: Limpiar filtros
Dado que la vista de empleados tiene filtros aplicados y el sistema muestra resultados filtrados.
Cuando el administrador presiona “limpiar filtros”,
Entonces el sistema elimina los filtros aplicados y muestra la lista completa de empleados.
## ID: Listar clientes
Título: Como administrador quiero listar clientes para verificar sus reservas y estado de pago.

Criterios de aceptación
Escenario 1: Listado con resultados
Dado que existen clientes registrados,
Cuando el recepcionista visualiza la lista de clientes,
Entonces el sistema muestra los clientes y sus estados relevantes.

Escenario 2: Listado vacío
Dado que no existen clientes,
Cuando el recepcionista visualiza la lista de clientes,
Entonces el sistema muestra un mensaje indicando que no hay clientes.

Escenario 3: Limpiar filtros
Dado que la vista de clientes tiene filtros aplicados y el sistema muestra resultados filtrados,
Cuando el recepcionista presiona “limpiar filtros”,
Entonces el sistema elimina los filtros aplicados y muestra la lista completa de clientes.
## ID: Listar administrativos
Título: Como administrador quiero listar usuarios administrativos para gestionar accesos.

Criterios de aceptación
Escenario 1: Listado con resultados
Dado que existen usuarios administrativos,
Cuando el administrador abre la vista de administrativos,
Entonces el sistema muestra la lista filtrable y paginada.

Escenario 2: Listado vacío
Dado que no existen administrativos,
Cuando el administrador abre la vista,
Entonces el sistema muestra un mensaje indicando que no hay usuarios administrativos.

Escenario 3: Limpiar filtros
Dado que la vista de administrativos tiene filtros aplicados y el sistema muestra resultados filtrados,
Cuando el administrador  presiona “limpiar filtros”,
Entonces el sistema elimina los filtros aplicados y muestra la lista completa de usuarios administrativos.

# 2-Gestión de clientes
## ID: Solicitar reintegro de cuenta
Título: Como cliente con cuenta suspendida quiero solicitar el reintegro de mi cuenta para volver a acceder al sistema.

Reglas de negocio:
- El motivo de la solicitud es obligatorio.

Criterios de aceptación:

Escenario 1: Solicitud de reintegro exitosa
Dado que el cliente con email "cliente@gmail.com" tiene la cuenta en estado "suspendida",
Cuando el cliente ingresa al formulario desde el link enviado al mail, completa el campo de motivo y presiona "Solicitar reintegro",
Entonces el sistema registra la solicitud con el motivo ingresado y la deja pendiente de revisión por un administrador.

Escenario 2: Solicitud fallida por falta de motivo
Dado que el cliente con email "cliente@gmail.com" tiene la cuenta en estado "suspendida",
Cuando el cliente ingresa al formulario desde el link enviado al mail, deja el campo de motivo vacío y presiona "Solicitar reintegro",
Entonces el sistema informa que el motivo es obligatorio y no registra la solicitud.

Escenario 3: Solicitud fallida por cuenta no suspendida
Dado que el cliente con email "cliente@gmail.com" tiene la cuenta en estado "activa",
Cuando el cliente ingresa al formulario desde el link enviado al mail,
Entonces el sistema informa que la cuenta no está suspendida y redirige a la pantalla de login.

## ID: Reintegrar de cuenta
Título: Como administrador quiero reintegrar la cuenta de un cliente suspendido para permitirle volver a acceder al sistema.

Reglas de negocio:
- El motivo del reintegro es opcional.

Criterios de aceptación:

Escenario 1: Reintegro exitoso a partir de solicitud del cliente
Dado que el cliente con email "cliente@gmail.com" tiene la cuenta en estado "suspendida" con una solicitud de reintegro pendiente,
Cuando el administrador selecciona la solicitud del cliente "cliente@gmail.com" y presiona "Reintegrar cuenta",
Entonces el sistema reactiva la cuenta del cliente, la deja en estado "activa" y notifica al cliente vía mail.

Escenario 2: Reintegro exitoso sin solicitud del cliente
Dado que el cliente con email "cliente@gmail.com" tiene la cuenta en estado "suspendida" sin solicitud de reintegro registrada,
Cuando el administrador busca al cliente "cliente@gmail.com" y presiona "Reintegrar cuenta",
Entonces el sistema reactiva la cuenta del cliente, la deja en estado "activa" y notifica al cliente vía mail.

Escenario 3: Rechazo de solicitud de reintegro
Dado que el cliente con email "cliente@gmail.com" tiene la cuenta en estado "suspendida" con una solicitud de reintegro pendiente,
Cuando el administrador selecciona la solicitud del cliente "cliente@gmail.com" y presiona "Rechazar reintegro",
Entonces el sistema mantiene la cuenta en estado "suspendida" y notifica al cliente que su solicitud fue rechazada vía mail.
## ID: Suspender cuenta
Título: como administrador quiero suspender una cuenta para que el usuario no pueda acceder a las funcionalidades
Reglas de negocio:
El motivo de suspensión es obligatorio
Criterios de aceptación:

Escenario 1: suspensión exitosa
Dado que el administrador está autenticado y el cliente con email "cliente@gmail.com" tiene la cuenta en estado "activa",
Cuando el administrador selecciona al cliente "cliente@gmail.com", ingresa el motivo "Incumplimiento de normas" y presiona "Suspender cuenta",
Entonces el sistema cambia el estado de la cuenta a "suspendida", notifica al cliente vía mail y registra la acción en el historial del sistema.

Escenario 2: suspensión cancelada
Dado que el administrador está autenticado y el cliente con email "cliente@gmail.com" tiene la cuenta en estado "activa",
Cuando el administrador selecciona al cliente "cliente@gmail.com", presiona Suspender, ingresa el motivo y presiona "Cancelar",
Entonces el sistema cancela la operación y mantiene la cuenta en estado "activa".

Escenario 3: suspensión fallida por falta de descripción
Dado que el administrador está autenticado y el cliente con email "cliente@gmail.com" tiene la cuenta en estado "activa",
Cuando el administrador selecciona al cliente "cliente@gmail.com", deja el campo de motivo vacío y presiona "Suspender cuenta",
Entonces el sistema informa que el motivo de suspensión es obligatorio y no realiza ningún cambio.

Nota: selector de usuarios, por ende no va a haber un caso fallido de usuario inexistente

# 3-Gestión de actividades y clases
## ID: Crear actividad
Título: Como administrador quiero crear una actividad para agregar una nueva actividad al sistema
Reglas de negocio:
-

Criterios de aceptación:

Escenario 1: Creación exitosa con profesor asignado
Dado que el administrador está autenticado, el aula 3 con capacidad para 50 personas no está ocupada los lunes a las 15:00 y Pepe Muñoz es un profesor especializado en tren medio, sin actividades asignadas los lunes a las 15:00
Cuando el administrador selecciona “Crear nueva clase” y selecciona aula “3”, cupos máximos “50”, tipo de clase “fija”, tipo de actividad “tren medio”, horario de lunes a las 15:00, profesor asignado “Pepe Muñoz” y aprieta “Crear”
Entonces la actividad se carga en el sistema exitosamente, queda disponible para que los clientes se inscriban a la misma, manda un mail al profesor asignado, e informa el éxito al administrador.

Escenario 2: Creación exitosa sin profesor asignado
Dado que el administrador está autenticado y el aula 3 con capacidad para 50 personas no está ocupada el lunes 27/07/2026 a las 15:00
Cuando el administrador selecciona “Crear nueva clase” y selecciona aula “3”, cupos máximos “30”, tipo de clase “individual”, tipo de actividad “tren inferior”, fecha para el lunes 27/07/2026 a las 15:00  y presiona “Crear”
Entonces la actividad se carga en el sistema exitosamente, queda disponible tanto para que los clientes se inscriban a la misma como para que un profesor especializado en tren inferior pueda asignarse la clase e informa el éxito al administrador.

Escenario 3: Creación fallida por capacidad máxima superada
Dado que el administrador está autenticado y el aula 3 con capacidad para 50 personas no está ocupada los lunes a las 15:00
Cuando el administrador selecciona “Crear nueva clase” y selecciona aula “3”, cupos máximos “75”, tipo de clase “fija”, tipo de actividad “tren medio” y horario de lunes a las 15:00
Entonces la operación falla, informando al administrador que los cupos requeridos superan la capacidad máxima del aula.

## ID: Asumir actividad
Título: Como profesor quiero asumir una actividad para impartir la actividad.

Reglas de negocios:
-El profesor debe tener como especialidad la misma que la de la clase que quiero asumir.
-El profesor no debe estar asignado a una clase con el mismo horario.

Criterios de aceptación:

Escenario 1: Asignación exitosa
Dado que el profesor está autenticado, especializado en tren superior y sin clases asignadas para el 27/07/2026 y la clase individual de tren superior del lunes 27/07/2026 a las 15:00 no tiene profesor asignado
Cuando el profesor busca la clase individual de tren superior del 27/07/2026 a las 15:00, selecciona “Asumir” y confirma su selección
Entonces el sistema lo asigna a la clase correspondiente, se envía un mail tanto a profesor como a los administradores y registra la acción en el historial del sistema.

Escenario 2: Asignación fallida por superposición de horarios
Dado que el profesor está autenticado, especializado en tren superior, está a cargo de las clases fijas de los lunes a las 15:00 y la clase individual de tren superior del lunes 27/07/2026 a las 15:00 no tiene profesor asignado
Cuando el profesor busca la clase individual de tren superior del 27/07/2026 a las 15:00, selecciona “Asumir” y confirma su selección
Entonces la operación falla, informando al profesor que ya tiene una actividad asignada en la misma fecha y horario.

Escenario 3: Asignación fallida por cancelación
Dado que el profesor está autenticado, especializado en tren superior y sin clases asignadas para el 27/07/2026 y la clase individual de tren superior del lunes 27/07/2026 a las 15:00 no tiene profesor asignado
Cuando el profesor busca la clase individual de tren superior del 27/07/2026 a las 15:00, selecciona “Asumir” y cancela su selección
Entonces la operación falla.

## ID: Sugerir actividad
Título: Como profesor quiero sugerir una actividad nueva para agregarla al catálogo del negocio.
Reglas de negocios:
-

Criterios de aceptación:

Escenario 1: Sugerencia exitosa
Dado que el profesor está autenticado, especializado en tren superior y el aula 3 tiene capacidad para 50 personas y está disponible el día 27/07/2026 a las 15.
Cuando el profesor selecciona “Sugerir actividad”, selecciona aula “3”, cupos máximos “50”, tipo de clase “individual”, tipo de actividad “tren superior”, fecha para el lunes 27/07/2026 a las 15:00, aprieta “Enviar Sugerencia” y confirma su selección
Entonces se crea exitosamente la sugerencia de actividad, que queda a disposición de los administradores para que la aprueben manualmente.

Escenario 2: Sugerencia fallida por capacidad máxima superada
Dado que el profesor está autenticado, especializado en tren superior y el aula 3 tiene capacidad para 50 personas y está disponible el día 27/07/2026 a las 15.
Cuando el profesor selecciona “Sugerir actividad”, selecciona aula “3”, cupos máximos “75”, tipo de clase “fija”, tipo de actividad “tren superior”, día 27/07/2026  y horario 15:00, selecciona la opción “Enviar Sugerencia” y confirma su selección
Entonces la operación falla, informando al profesor que los cupos máximos exceden la capacidad del aula.

Escenario 3: Sugerencia fallida por cancelación
Dado que el profesor está autenticado, especializado en tren superior y el aula 3 tiene capacidad para 50 personas el día 27/07/2026 a las 15:00
Cuando el profesor selecciona “Sugerir actividad”, selecciona aula “3”, cupos máximos “50”, tipo de clase “individual”, tipo de actividad “tren superior”, fecha para el lunes 27/07/2026 a las 15:00, aprieta “Enviar Sugerencia” y cancela su selección
Entonces la operación falla.

## ID: Aceptar actividad
Título: Como administrador quiero aceptar una actividad sugerida para agregarla como nueva actividad.
Reglas de negocios:
-

Criterios de aceptación:

Escenario 1: Operación exitosa
Dado que el administrador está autenticado, y tiene una sugerencia de actividad disponible de Pepe Muñoz
Cuando el administrador presiona “aceptar sugerencia”
Entonces la sugerencia se añade al sistema como actividad exitosa, se informa el éxito al administrador, se asigna al profesor a la clase,se envía una notificación al profesor Pepe Muñoz que su sugerencia fue aceptada y la clase queda disponible para que los clientes se inscriban a la misma.

Escenario 2: Operación fallida por cancelación
Dado que el administrador está autenticado, y tiene una sugerencia de actividad disponible de Pepe Muñoz
Cuando el administrador presiona “Rechazar sugerencia”
Entonces la sugerencia se rechaza, se informa el rechazo al administrador, se envía una notificación al profesor Pepe Muñoz que su sugerencia fue rechaza.

## ID: Renunciar a actividad
Título: como profesor quiero darme de baja de una actividad para dejar libre el cupo de profesor de la misma.
Reglas de negocio:
-

Criterios de aceptación:

Escenario 1: Baja exitosa
Dado que el profesor con mail “profe@gmail.com” está autenticado y está inscripto como profesor a la actividad fija de tren superior los días lunes a las 15:00 en el aula 3 que no está en curso
Cuando el profesor con mail “profe@gmail.com” busca la actividad fija de tren superior de los días lunes a las 15:00 llevada a cabo en el aula 3, selecciona “Renunciar a actividad” y confirma su selección
Entonces la baja es exitosa, se informa del éxito al profesor, se avisa al administrador y la actividad queda con el cupo de profesor libre.

Escenario 2: Baja fallida por cancelación voluntaria
Dado que el profesor con mail “profe@gmail.com” está autenticado y está inscripto a la actividad fija de tren superior los días lunes a las 15:00 en el aula 3 que no está en curso
Cuando el profesor con mail “profe@gmail.com” busca la actividad fija de tren superior de los días lunes a las 15:00 llevada a cabo en el aula 3, selecciona “Renunciar a actividad” y cancela su selección
Entonces el sistema cancela la baja.

## ID: Cancelar actividad
Título: Como administrador quiero cancelar una actividad para que el aula no esté ocupada en el momento que tenía planeado llevarse a cabo.
Reglas de negocio:
-
Criterios de aceptación:

Escenario 1: Cancelación exitosa
Dado que la actividad “Rehabilitar Muñeca” no está en curso
Cuando el administrador seleccione la actividad “Rehabilitar Muñeca”, presione “Cancelar Actividad” y presione “Confirmar”
Entonces la baja será exitosa, se informa la cancelación por mail a alumnos y profesores.

Escenario 2: Cancelación fallida por actividad en curso
Dado que la actividad “Rehabilitar Muñeca” está en curso
Cuando el administrador seleccione la actividad “Rehabilitar Muñeca”, presione “Cancelar Actividad” y presione “Confirmar”
Entonces la baja será fallida y se informa al administrador que no puede cancelar una actividad en curso.

Escenario 3: Cancelación fallida por cancelación voluntaria
Dado que la actividad “Rehabilitar Muñeca” no está en curso
Cuando el administrador seleccione la actividad “Rehabilitar Muñeca”, presione “Cancelar Actividad” y presione “Cancelar”
Entonces la baja será fallida porque la operación ha sido cancelada.

## ID: Ver actividad
Título: Como usuario autenticado quiero ver el detalle de una actividad para conocer su descripción, horario, profesor asignado y disponibilidad.
Reglas de negocio:
-
Criterios de aceptación:
Escenario 1: Visualización exitosa.
Dado que la actividad “Rehabilitar muñeca” existe.
Cuando el usuario seleccione  “Rehabilitar muñeca” y presione ver información de actividad.
Entonces se mostrará en pantalla la descripción, el horario, el profesor asignado y la disponibilidad de la actividad seleccionada.
## ID: Filtrar actividades
Título: Como usuario autenticado quiero filtrar el listado de actividades para encontrar clases según mis criterios.

Reglas de negocio:

Criterios de aceptación:
Escenario 1: Filtro aplicado con resultados
Dado que el usuario con mail “usuario@gmail.com” selecciona el filtro “Actividad de tren inferior” y hay actividades de tren inferior disponibles
Cuando el usuario selecciona el filtro tren inferior y presiona la opción “Filtrar”
Entonces el sistema muestra el listado de actividades del tren inferior

Escenario 2: Filtro aplicado sin resultados
Dado que el usuario con mail “usuario@gmail.com” selecciona el filtro “Actividad de tren inferior” y no hay actividades de tren inferior disponibles
Cuando el usuario selecciona el filtro tren inferior y presiona la opción “Filtrar”
Entonces el sistema muestra el listado de actividades del tren inferior

Escenario 3: Limpiar filtros
Dado que la vista de actividades tiene filtros aplicados y el sistema muestra resultados filtrados,
Cuando el usuario presiona “limpiar filtros”,
Entonces el sistema elimina los filtros aplicados y muestra la lista completa de actividades.

## ID: Buscar actividades
Título: Como usuario quiero buscar actividades para encontrar una clase específica.

Criterios de aceptación:

Escenario 1: Búsqueda exitosa con resultados
Dado que hay actividades disponibles en el sistema
Cuando la persona presiona la opción “Actividades”
Entonces el sistema muestra el listado de actividades

Escenario 2: Búsqueda sin resultados
Dado que el usuario con mail “usuario@gmal.com” está autenticado en el sistema y no hay actividades disponibles en el sistema
Cuando el usuario con mail “usuario@gmail,com” presiona la opción “Actividades”
Entonces el sistema muestra el listado de actividades vacío

## ID: Listar horarios disponibles
Título: Como administrador quiero listar los horarios disponibles para elegir uno para una clase específica.

Reglas de negocio:
-

Criterios de aceptación:

Escenario 1: Listado exitoso con resultados
Dado que el admin con mail “admin@gmail.com” está autenticado y hay horarios disponibles en el sistema
Cuando el admin con mail “admin@gmail,com” presiona la opción “Horarios disponibles”
Entonces el sistema muestra el listado de horarios disponibles.

Escenario 2: Listado exitoso sin resultados
Dado que el admin con mail “admin@gmail.com” está autenticado en el sistema y no hay horarios disponibles en el sistema
Cuando el admin con mail “admin@gmail.com” presiona la opción “Horarios disponibles”
Entonces el sistema notificará que no hay horarios disponibles.

## ID: Listar profesores disponibles
Título: Como administrador quiero listar los profesores disponibles para elegir a uno para una clase específica.

Reglas de negocio:
-

Criterios de aceptación:

Escenario 1: Listado exitoso con resultados
Dado que el admin con mail “admin@gmail.com” está autenticado en el sistema y hay profesores disponibles en el sistema
Cuando el admin con mail “admin@gmail,com” presiona la opción “Profesores disponibles”
Entonces el sistema muestra el listado de profesores disponibles
.
Escenario 2: Listado exitoso sin resultados
Dado que el admin con mail “admin@gmail.com” está autenticado en el sistema y no hay profesores disponibles en el sistema
Cuando el admin con mail “admin@gmail,com” presiona la opción “Profesores disponibles”
Entonces el sistema notificará que no hay profesores disponibles.

## ID: Listar días disponibles
Título: Como administrador quiero listar los dias disponibles para elegir uno para una clase específica.

Reglas de negocio:
-

Criterios de aceptación:

Escenario 1: Listado exitoso con resultados
Dado que el admin con mail “admin@gmail.com” está autenticado y hay dias disponibles en el sistema
Cuando el admin con mail “admin@gmail,com” presiona la opción “Dias disponibles”
Entonces el sistema muestra el listado de días disponibles.

Escenario 2: Listado exitoso sin resultados
Dado que el admin con mail “admin@gmail.com” está autenticado en el sistema y no hay dias disponibles en el sistema
Cuando el admin con mail “admin@gmail.com” presiona la opción “Dias disponibles”
Entonces el sistema notificará que no hay dias disponibles.

## ID: Listar salas disponibles
Título: Como administrador quiero listar las salas disponibles para elegir una para una clase específica.

Reglas de negocio:
-

Criterios de aceptación:

Escenario 1: Listado exitoso con resultados
Dado que el admin con mail “admin@gmail.com” está autenticado y hay salas  disponibles en el sistema
Cuando el admin con mail “admin@gmail,com” presiona la opción “Salas disponibles”
Entonces el sistema muestra el listado de salas disponibles.

Escenario 2: Listado exitoso sin resultados
Dado que el admin con mail “admin@gmail.com” está autenticado en el sistema y no hay salas disponibles en el sistema
Cuando el admin con mail “admin@gmail.com” presiona la opción “Salas disponibles”
Entonces el sistema notificará que no hay salas disponibles.

## ID: Listar especialización
Título: Como administrador quiero listar las especializaciones disponibles para elegir una para una clase específica.

Reglas de negocio:
-

Criterios de aceptación:

Escenario 1: Listado exitoso con resultados
Dado que el admin con mail “admin@gmail.com” está autenticado y hay especializaciones disponibles en el sistema
Cuando el admin con mail “admin@gmail,com” presiona la opción “Especilizaciones disponibles”
Entonces el sistema muestra el listado de especializaciones disponibles.

Escenario 2: Listado exitoso sin resultados
Dado que el admin con mail “admin@gmail.com” está autenticado en el sistema y no hay especializaciones disponibles en el sistema
Cuando el admin con mail “admin@gmail.com” presiona la opción “Especilizaciones disponibles”
Entonces el sistema notificará que no hay especializaciones disponibles.

# 4-Gestión de reservas de turnos
ID: Inscribir a actividad fija
Título: Como cliente quiero inscribirme en una actividad fija para asegurar mi turno en la clase periódica.

Reglas de Negocio:
Debe aplicar un 20% de descuento a los mayores de 65 años.
Los clientes no abonados deben abonar al menos el 50% del valor como seña

Criterios de aceptación
Escenario 1: Inscripción confirmada por suscripción activa (abonado)
Dado que el cliente está autenticado y tiene una suscripción activa que cubre la actividad fija "Rehabilitar Codo" y la actividad tiene cupo disponible,
Cuando el cliente selecciona la actividad “Rehabilitar codo” y presiona “Inscribirse”
Entonces el sistema crea la inscripción en estado “confirmada”, decrementa el cupo disponible, inscribe al cliente en la actividad y notifica la confirmación al usuario.

Escenario 2: Inscripción confirmada con pago total(no abonado)
Dado que el cliente no abonado está autenticado las condiciones son las adecuadas para un pago exitoso y la actividad “Rehabilitar Codo”  tiene cupos
Cuando el cliente selecciona la actividad “Rehabilitar codo”, presiona “Inscribirse” y selecciona “Abonar Total”
Entonces el sistema redirige al usuario a “Pagar Mercado Pago”, espera respuesta, registra la inscripción como “confirmada”, inscribe al cliente en la actividad “Rehabilitar Codo”, decrementa el cupo disponible y notifica al usuario

Escenario 3: Inscripción confirmada con seña (no abonado)
Dado que el cliente no abonado está autenticado las condiciones son las adecuadas para un pago exitoso y la actividad “Rehabilitar Codo”  tiene cupos
Cuando el cliente selecciona la actividad “Rehabilitar codo”, presiona “Inscribirse” y selecciona “Abonar con seña”
Entonces el sistema calcula el valor de la seña, redirige al usuario a “Pagar Mercado Pago”, espera respuesta, registra la inscripción como “Pendiente”, inscribe al cliente en la actividad “Rehabilitar Codo”, decrementa el cupo disponible y notifica al usuario.

Escenario 4: Inscripción confirmada por pago con descuento (no abonado)
Dado un cliente que está autenticado, las condiciones son las adecuadas para un pago exitoso, la actividad “Rehabilitar Codo”  tiene cupos y cumple con alguna condición de descuento (Mayor de 65 años, descuento por mes, u otros)
Cuando el cliente selecciona la actividad “Rehabilitar codo”, presiona “Inscribirse” y selecciona “Confirmar Pago”
Entonces el sistema aplica el descuento, redirige al usuario a “Pagar Mercado Pago”, espera respuesta, registra la inscripción como “confirmada”, inscribe al cliente en la actividad “Rehabilitar Codo”, decrementa el cupo disponible y notifica al usuario

Escenario 5: Inscripción confirmada en lista de espera abonado
Dado que el cliente está autenticado, tiene una suscripción activa y la actividad "Rehabilitar Codo" tiene 0 cupos
Cuando el cliente selecciona la actividad “Rehabilitar codo”, presiona “Inscribirse” y selecciona “Esperar en la Lista”
Entonces el sistema añade al cliente a la lista de espera con prioridad y notifica al usuario

Escenario 6: Inscripción confirmada en lista de espera no abonado
Dado que el cliente no abonado está autenticado, y la actividad "Rehabilitar Codo" tiene 0 cupos
Cuando el cliente no abonado selecciona la actividad “Rehabilitar codo”, presiona “Inscribirse” y selecciona “Esperar en la Lista”
Entonces el sistema añade al cliente a la lista de espera sin prioridad y notifica al usuario

Escenario 7: Inscripción confirmada con créditos
Dado que el cliente abonado está autenticado, tiene un crédito para la actividad "Rehabilitar Codo" que tiene cupos,
Cuando el cliente selecciona la actividad “Rehabilitar codo”, presiona “Inscribirse” y selecciona “Usar crédito”
Entonces el sistema crea la inscripción en estado “confirmada”, decrementa el cupo y el crédito, inscribe al cliente en la actividad y notifica la confirmación al usuario.

Escenario 8: inscripción fallida por error en el pago
Dado un cliente con condiciones que no son adecuadas para un pago exitoso
Cuando el cliente selecciona la actividad “Rehabilitar codo”, presiona “Inscribirse” y selecciona un método de pago.
Entonces el sistema redirige al usuario a “Pagar Mercado Pago”, espera respuesta e informa que hubo un error en el pago y cancela la inscripción.

Escenario 9: inscripción cancelada
Dado un usuario autenticado y la actividad “Rehabilitar Codo” tiene cupos
Cuando el cliente selecciona la actividad “Rehabilitar codo”, presiona “Inscribirse” y selecciona “Cancelar”
Entonces el sistema cancela la operación y redirige al inicio
## ID: Inscribir a actividad individual
Nota: el cliente puede ser abonado o no abonado
Título: Como cliente quiero inscribirme a  una actividad individual para reservar un turno.
Reglas de Negocio:
Los clientes no abonados deben abonar al menos el 50% del valor como seña

Criterios de aceptación
Escenario 1: inscripción con pago total
Dado un cliente autenticado, una actividad individual  “Rehabilitar codo” que cuesta 100 pesos con cupos disponibles y las condiciones son las adecuadas para un pago exitoso
Cuando el cliente selecciona la actividad “Rehabilitar codo”, presiona “Inscribirse” y selecciona “Abonar total”
Entonces el sistema redirige al usuario a “Pagar Mercado Pago”, espera respuesta, registra la inscripción como “confirmada”, inscribe al cliente a la clase “Rehabilitar codo” y notifica al usuario.

Escenario 2: inscripción con seña exitoso
Dado un cliente autenticado, una actividad individual “Rehabilitar codo” que cuesta 100 pesos con cupos disponibles y las condiciones son las adecuadas para un pago exitoso
Cuando el cliente selecciona la actividad “Rehabilitar codo”, presiona “Inscribirse” y selecciona “Abonar con seña”
Entonces el sistema calcula el valor de la seña, redirige al usuario a “Pagar Mercado Pago”, espera respuesta, registra la inscripción como “pendiente”, inscribe al cliente a la clase “Rehabilitar codo” y notifica al usuario.

Escenario 3: Inscripción pendiente en lista de espera abonado
Dado que el cliente está autenticado, y la actividad individual  "Rehabilitar Codo" tiene 0 cupos
Cuando el cliente selecciona la actividad “Rehabilitar codo”, presiona “Inscribirse” y selecciona “Esperar en la Lista”
Entonces el sistema añade al cliente a la lista de espera general y notifica al usuario

Escenario 4: Inscripción confirmada con créditos
Dado que el cliente abonado está autenticado, tiene un crédito para la actividad individual "Rehabilitar Codo" que tiene cupos,
Cuando el cliente selecciona la actividad “Rehabilitar codo”, presiona “Inscribirse” y selecciona “Usar crédito”
Entonces el sistema crea la inscripción en estado “confirmada”, decrementa el cupo y el crédito, inscribe al cliente en la actividad y notifica la confirmación al usuario.

Escenario 5: inscripción fallido por error en el pago
Dado un cliente, una actividad  individual “Rehabilitar codo” que cuesta 100 pesos, con cupos disponibles y las condiciones no son las adecuadas para un pago exitoso
Cuando el cliente selecciona la actividad “Rehabilitar codo”, presiona “Inscribirse” y selecciona un método de pago.
Entonces el sistema redirige al usuario a “Pagar Mercado Pago”, espera respuesta e informa que hubo un error en el pago por lo que no se pudo llevar a cabo la inscripción.

Escenario 6: Inscripción cancelada
Dado un cliente, una actividad individual  “Rehabilitar codo” que cuesta 100 pesos con cupos disponibles y las condiciones son las adecuadas para un pago exitoso
Cuando el cliente selecciona la actividad “Rehabilitar codo”, selecciona “Inscribirse” y  presiona “Cancelar”
Entonces el sistema cancela la operación y redirige al inicio

## ID: Ver mis reservas
Título: como cliente quiero ver mis reservas para recordar qué actividades tengo en el futuro.

Reglas de negocio:

Criterios de aceptación:

Escenario 1: visualización exitosa
Dado que el cliente tiene actividades reservadas
Cuando selecciona la opción “Ver mis reservas”
Entonces se muestra el listado de las actividades reservadas del cliente.

Escenario 2: visualización exitosa vacía
Dado que el cliente no tiene actividades reservadas
Cuando selecciona la opción “Ver mis reservas”
Entonces se carga el mensaje “No tenés reservas para ver”

# 5-Gestión de lista de espera
## ID: Dar de baja en lista de espera
Título: como cliente quiero darme de baja de una lista de espera para no concurrir a la actividad.

Reglas de negocio:
-

Escenario 1: Baja exitosa
Dado que el cliente está autenticado, y permanece en lista de espera de la actividad “Rehabilitar Codo”
Cuando el cliente seleccione la actividad “Rehabilitar Codo” y presione “Salir de la lista de espera”
Entonces el sistema registra la baja y se enviará un mail confirmando esto al cliente.

Escenario 2: Dada de baja cancelada
Dado que un cliente que permanece en una lista de espera de la actividad “Rehabilitar Codo” que aún no comenzó Cuando el cliente selecciona “Rehabilitar Codo” y presiona “Cancelar”
Entonces el sistema cancela la operación

## ID: Listar lista de espera
Título: Como usuario autorizado quiero listar la lista de espera de una actividad para ver quién está en espera.

Reglas de negocio:
- La lista de espera se muestra ordenada por prioridad (abonados primero).

Criterios de aceptación:
Escenario 1: Listado con resultados
Dado que existen clientes en la lista de espera de la actividad "Rehabilitar Codo"
Cuando el usuario autorizado presiona “visualizar la lista de espera” de la actividad "Rehabilitar Codo"
Entonces el sistema muestra la lista de espera con prioridad y datos de contacto.

Escenario 2: Listado vacío
Dado que no existen clientes en la lista de espera de la actividad "Rehabilitar Codo"
Cuando se solicita visualizar la lista de espera
Entonces el sistema informa que no hay clientes en lista de espera.

Escenario 3: Limpiar filtros
Dado que la vista de lista de espera tiene filtros aplicados
Cuando se solicita limpiar filtros
Entonces el sistema elimina los filtros y muestra la lista completa de espera.

Nota: Una vez comenzado la clase, la lista de espera del misma será eliminada

# 6-Gestión de asistencias
## ID: Generar QR
Título: Como profesor quiero generar un código QR para registrar la asistencia a una actividad.
Reglas de negocio:
-
Escenario 1: generación de QR con éxito
Dado que el profesor está autenticado y la actividad tiene sesión activa
Cuando el profesor presiona “Generar QR”
Entonces el sistema crea un código QR para validar las asistencias.
## ID: Registrar asistencia por DNI
Título: Como profesor quiero ingresar el DNI de un cliente para registrar que asistió a una clase.
Reglas de negocio:
-
Escenario 1: registro de asistencia exitoso sin comentario
Dado un DNI “222” de un cliente que pertenece a la actividad
Cuando el profesor ingresa DNI 222 y presiona “Registrar”
Entonces el sistema registra la asistencia del cliente

Escenario 2: registro de asistencia exitoso con comentario
Dado un DNI “222” de un cliente que pertenece a la actividad
Cuando el profesor ingresa DNI 222, “Buen desempeño” y presiona “Registrar”
Entonces el sistema registra la asistencia del cliente junto con el comentario

Escenario 3: registro de asistencia fallida por DNI inexistente
Dado un cliente con DNI “334” no pertenece a la clase
Cuando el profesor ingresa DNI “334” y presiona “Registrar”
Entonces el sistema informa que el cliente no se anotó para dicha clase

Escenario 4: registro fallido por asistencia ya registrada
Dado un DNI "222" de un cliente que ya tiene la asistencia registrada para la actividad
Cuando se intenta registrar su asistencia nuevamente
Entonces el sistema informa que la asistencia ya fue registrada y no duplica el registro.

## ID: Registrar asistencia por QR
Título: como cliente quiero escanear el QR para registrar la asistencia de la clase
Reglas de negocio:
El QR puede ser escaneado durante 15 minutos luego de generado.

Criterios de aceptación:
Escenario 1: Registro exitoso
Dado un código de QR generado hace 5 minutos y el cliente se inscribió a la clase
Cuando el cliente escanea el código QR
Entonces el sistema registra la asistencia del cliente

Escenario 2: Registro fallido por QR expirado
Dado un código de QR generado hace 20 minutos y el cliente se inscribió a la clase
Cuando el cliente escanea el código QR
Entonces el sistema informa que ya se expiró el código QR

Escenario 3: Registro fallido por cliente no inscripto
Dado un código QR generado hace 2 minutos y el cliente no se inscribió a la clase
Cuando el cliente escanea el código QR
Entonces el sistema informa que no se inscribió a la clase

Escenario 4: Registro fallido por cliente ya registrado
Dado un código QR generado hace 5 minutos, el cliente se inscribió a la clase y ya está registrado
Cuando escanea el código QR
Entonces el sistema informa que la asistencia ya fue registrado

## ID: Dejar comentario en asistencia
Título: como profesor quiero dejar un comentario para registrar la observación del cliente
Reglas de negocio:

Criterios de aceptación:Escenario 1: comentario hecho con éxito
Dado un cliente que se registró la asistencia
Cuando el profesor ingresa el comentario y presiona “Guardar”
Entonces el sistema guarda el comentario.

Escenario 2: comentario cancelada
Dado un cliente que se registró la asistencia
Cuando el profesor ingresa el comentario y presiona “Cancelar”
Entonces el sistema cancela la operación
## ID: Eliminar comentario en asistencia
Título: como profesor quiero eliminar comentarios de asistencia para mantener el historial actualizado y sin datos erróneos.
Reglas de negocio:

Escenario 1: eliminación exitoso
Dado una asistencia registrada con comentario
Cuando el profesor selecciona el comentario y presiona “Eliminar”
Entonces el sistema elimina el comentario

Escenario 2: eliminación cancelada
Dado una asistencia registrada con comentario
Cuando el profesor selecciona el comentario y presiona “Cancelar”
Entonces el sistema cancela la operación
## ID: Modificar comentario en asistencia
Título: como profesor quiero editar un comentario en el registro de asistencia para actualizar o corregir la información sin necesidad de eliminarla
Regla de negocio:

Criterios de aceptación
Escenario 1: modificación exitoso
Dado una asistencia registrado con comentario
Cuando el profesor modifica el comentario y presiona “Confirmar”
Entonces el sistema modifica el comentario

Escenario 2: modificación cancelada
Dado una asistencia registrado con comentario
Cuando el profesor modifica el comentario y presiona “Cancelar”
Entonces el sistema cancela la operación

# 7-Gestión de Pago
## ID: Ver planes y abonos (Ver suscripciones)
Título: Como usuario quiero ver los planes y abonos para comparar las opciones disponibles y elegir la que mejor se adapte a mis necesidades.

Reglas de negocio:

Criterios de aceptación:
Escenario 1: visualización exitoso
Dado que existen planes activos en el sistema
Cuando el usuario ingresa a la sección de planes
Entonces el sistema devuelve la lista de planes con nombre, descripción breve, precio, duración y tipo de cobertura

Escenario 2: Visualización fallida sin planes
Dado que no existen planes activos
Cuando el usuario consulta el listado de planes
Entonces el sistema devuelve una lista vacía con código 200 y un mensaje informativo
## ID: Pagar Mercado Pago
Título: como cliente quiero pagar con mercado pago para inscribirme a un curso
Reglas de negocio

Criterios de aceptación:
Escenario 1: pago exitoso
Dado que la conexión con el servidor del banco es exitosa, la cuenta tiene saldo y hay transacción a una inscripción o compra
Cuando el cliente presiona “Pagar”
Entonces el sistema registra el pago y retorna un resultado de éxito

Escenario 2: Pago fallido por saldo insuficiente
Dado que la conexión con el servidor del banco es exitosa, pero la cuenta no tiene el saldo suficiente,
Cuando el cliente presiona “Pagar”
Entonces el sistema informa que faltan fondos y retorna un resultado de fallo.

Escenario 3: pago fallido por fallo en la conexión con el servidor externo del banco
Dado que no se pudo realizar la conexión con el servidor del banco
Cuando el cliente presiona “Pagar”
Entonces el sistema retorna un error por conexión fallida

# 8-Gestión de estadísticas
## ID: Generar reporte
Título: Como administrador quiero generar un reporte estadístico para obtener información del negocio.
Reglas de negocio:

Criterios de aceptación:
Escenario 1: Generación exitosa de reporte
Dado que el administrador está autenticado y selecciona un rango de fechas válido
Cuando solicita generar el reporte
Entonces el sistema genera y muestra el reporte con los datos solicitados

Escenario 2: Generación fallida por rango de fechas inválido
Dado que el administrador está autenticado y selecciona un rango de fechas invalido
Cuando solicita generar el reporte
Entonces el sistema informa el error y no genera el reporte
## ID: Filtrar reporte
Título: Como administrador quiero aplicar filtros al reporte generado para obtener información específica.

Criterios de aceptación:
Escenario 1: Filtro aplicado exitosamente con resultados
Dado que existen datos en el reporte y el administrador aplica un filtro válido
Cuando se aplica el filtro
Entonces el sistema muestra solo los datos que cumplen el filtro

Escenario 2: Filtro aplicado sin resultados
Dado que el filtro aplicado no coincide con ningún dato
Cuando se aplica el filtro
Entonces el sistema muestra el reporte vacío y un mensaje informativo
## ID: Ordenar reporte
Título: Como administrador quiero ordenar el reporte generado para visualizar la información en un orden específico.

Criterios de aceptación:
Escenario 1: Ordenación ascendente/descendente
Dado que el reporte tiene múltiples filas
Cuando el administrador selecciona un campo para ordenar
Entonces el sistema ordena el reporte según el campo y el orden elegido
## ID: Exportar reporte a Excel/PDF
Título: Como administrador quiero exportar el reporte generado a Excel o PDF para poder utilizar las funcionalidades del programa sobre mi reporte.

Criterios de aceptación:
Escenario 1: Exportación exitosa a Excel
Dado que el reporte tiene datos
Cuando el administrador selecciona "Exportar a Excel"
Entonces el sistema genera y descarga el archivo Excel

Escenario 2: Exportación exitosa a PDF
Dado que el reporte tiene datos
Cuando el administrador selecciona "Exportar a PDF"
Entonces el sistema genera y descarga el archivo PDF

Escenario 3: Exportación fallida por reporte vacío
Dado que el reporte no tiene datos
Cuando el administrador intenta exportar
Entonces el sistema informa que no hay datos para exportar

# 9-Gestión de notificaciones
## ID: Notificar por mail y sistema
Título: Como sistema quiero enviar notificaciones por mail y/o dentro de la pagina para mantener informados a los usuarios sobre eventos relevantes.
Reglas de negocio:

Criterios de aceptación:
Escenario 1: Notificación enviada exitosamente por mail
Dado que el usuario tiene una dirección de email válida y activa
Cuando ocurre un evento relevante y el canal seleccionado es mail
Entonces el sistema envía la notificación por mail y registra el envío exitoso

Escenario 2: Notificación enviada exitosamente por sistema
Dado que el usuario tiene habilitadas las notificaciones en la pagina
Cuando ocurre un evento relevante y el canal seleccionado es sistema
Entonces el sistema muestra la notificación en la pagina y registra el envío exitoso

Escenario 3: Envío fallido por falla de conexión
Dado que el usuario tiene habilitada las notificaciones pero el servidor está caído
Cuando el sistema intenta enviar la notificación por mail
Entonces el sistema registra el error y reintenta el envío.
## ID: Desactivar notificación
Título: Como usuario quiero desactivar un tipo de notificación para no recibirla más.
Reglas de negocio:

Criterios de aceptación:
Escenario 1: Desactivación exitosa de notificación por mail
Dado que el usuario tiene notificaciones por mail activas
Cuando el usuario desactiva las notificaciones por mail desde su perfil
Entonces el sistema deja de enviarle ese tipo de notificaciones

Escenario 2: Desactivación exitosa de notificación por sistema
Dado que el usuario tiene notificaciones por sistema activas
Cuando el usuario desactiva las notificaciones por sistema desde su perfil
Entonces el sistema deja de mostrar ese tipo de notificaciónes

## ID: Activar notificación
Título: Como usuario quiero activar un tipo de notificación para volver a recibirla.
Reglas de negocio:

Criterios de aceptación:
Escenario 1: Activación exitosa de notificación por mail
Dado que el usuario tiene desactivada la notificación por mail
Cuando el usuario activa las notificaciones por mail desde su perfil
Entonces el sistema vuelve a enviar ese tipo de notificación por mail

Escenario 2: Activación exitosa de notificación por sistema
Dado que el usuario tiene desactivada una notificación por sistema
Cuando el usuario activa las notificaciones por sistema desde su perfil
Entonces el sistema vuelve a mostrar ese tipo de notificación en la aplicación
# 10-Gestión de cancelaciones y políticas

## ID: Cancelar turno
Título: Como cliente abonado o no abonado quiero cancelar mi reserva para liberar el cupo y notificar al sistema.
Reglas de negocio:
La cancelación de un abonado a más de 48 hs de la clase otorga un crédito
La cancelación de un abonado entre 24-48 hs antes de la clase generan un descuento para el siguiente mes (30% en la primera cancelación, 20% en la segunda, sin descuento a partir de la tercera)
La cancelación de un abonado entre 0-24hs antes de la clase hace que el cliente pierda el turno
La cancelación de un no abonado a más de 24hs antes de la clase devuelve la seña
La cancelación de un no abonados entre 0-24hs antes de la clase hace que el cliente pierda el turno y la seña
Criterios de aceptación:   Escenario 1: Cancelación exitosa con crédito
Dado un cliente abonado, faltan 72 horas para que comience la clase fija “Rehabilitar Codo” y el cliente está inscripto a la misma
Cuando el cliente abonado busca la clase “Rehabilitar Codo” y selecciona “Cancelar turno”
Entonces el sistema da de baja al cliente de la clase y le otorga un crédito.
Escenario 2: Primera cancelación exitosa con descuento
Dado un cliente, faltan 36 horas para que comience la clase fija “Rehabilitar Codo”, el cliente está inscripto a la misma y no ha cancelado clases este mes
Cuando el cliente abonado busca la clase “Rehabilitar Codo” y selecciona “Cancelar turno”
Entonces el sistema da de baja al cliente de la clase y le otorga un descuento del 30% para el siguiente mes.

Escenario 3: Segunda cancelación exitosa con descuento
Dado un cliente abonado, faltan 36 horas para que comience la clase fija “Rehabilitar Codo”, el cliente está inscripto a la misma y ha cancelado una clase este mes
Cuando el cliente abonado busca la clase “Rehabilitar Codo” y selecciona “Cancelar turno”
Entonces el sistema da de baja al cliente de la clase y le otorga un descuento del 20% para el siguiente mes.

Escenario 4: Tercera cancelación exitosa sin descuento
Dado un cliente abonado, faltan 36 horas para que comience la clase fija “Rehabilitar Codo”, el cliente está inscripto a la misma y ha cancelado dos clases este mes
Cuando el cliente abonado busca la clase “Rehabilitar Codo” y selecciona “Cancelar turno”
Entonces el sistema da de baja al cliente de la clase.
Escenario 5: Cancelación exitosa sin beneficios
Dado que faltan 16 horas para que comience la clase fija “Rehabilitar Codo” y el cliente está inscripto a la misma
Cuando el cliente busca la clase “Rehabilitar Codo” y selecciona “Cancelar turno”
Entonces el sistema da de baja al cliente de la clase
Escenario 6: Cancelación fallida por clase en curso
Dado que la clase fija “Rehabilitar Codo” está en curso y el cliente está inscripto a la misma
Cuando el cliente busca la clase “Rehabilitar Codo” y selecciona “Cancelar turno”
Entonces la operación falla e informa al cliente que no se pudo cancelar porque la clase está en curso o ya finalizó.

Escenario 7: Cancelación exitosa con devolución
Dado un cliente no abonado, faltan 36 horas para que comience la clase individual “Rehabilitar Codo” y el cliente está inscripto a la misma
Cuando el cliente busca la clase “Rehabilitar Codo” y selecciona “Cancelar turno”
Entonces el sistema da de baja al cliente de la clase y devuelve la seña

Escenario 8: Cancelación exitosa sin devolución
Dado un cliente no abonado, faltan 12 horas para que comience la clase individual “Rehabilitar Codo” y el cliente está inscripto a la misma
Cuando el cliente busca la clase “Rehabilitar Codo” y selecciona “Cancelar turno”
Entonces el sistema da de baja al cliente de la clase

# 11-Gestión de Auditoria
## ID: Ver registro de actividad del sistema
Título: Como administrador quiero ver el registro de actividad del sistema para auditar las acciones realizadas por empleados y administradores.
Reglas de negocio:
- El sistema debe registrar todas las acciones relevantes (altas, bajas, modificaciones, accesos, pagos, notificaciones, etc.) con fecha, usuario y detalle.
- El registro debe ser inalterable.
- Debe permitir filtrar por usuario, tipo de acción, fecha y resultado.

Criterios de aceptación:
Escenario 1: Visualización exitosa
Dado que el administrador está autenticado
Cuando accede al registro de actividad
Entonces el sistema muestra el historial completo de acciones

Escenario 2: Filtro aplicado exitosamente con resultados
Dado que existen acciones registradas
Cuando el administrador aplica un filtro válido (usuario, fecha, tipo de acción)
Entonces el sistema muestra solo las acciones que cumplen el filtro

Escenario 3: Filtro aplicado sin resultados
Dado que el filtro aplicado no coincide con ninguna acción
Cuando el administrador aplica el filtro
Entonces el sistema muestra el registro vacío y un mensaje informativo
## ID: Ver registro de clases
Título: Como administrador quiero ver el historial de clases para auditar las creaciones, modificaciones y cancelaciones de actividades.
Reglas de negocio:
- El sistema debe registrar todas las operaciones sobre clases (creación, edición, cancelación, asignación de profesor, etc.)
- El registro debe permitir filtrar por clase, profesor, fecha y tipo de operación.

Criterios de aceptación:
Escenario 1: Visualización exitosa del historial de clases
Dado que existen registros de clases
Cuando el administrador accede al historial
Entonces el sistema muestra el historial completo de clases

Escenario 2: Visualización exitosa con filtro
Dado que existen registros de clases
Cuando el administrador aplica un filtro válido (clase, profesor, fecha)
Entonces el sistema muestra solo los registros que cumplen el filtro

Escenario 3: Visualización fallida con filtro sin resultados
Dado que el filtro aplicado no coincide con ningún registro
Cuando el administrador aplica el filtro
Entonces el sistema muestra el historial vacío y un mensaje informativo
## ID: Ver registro de ingresos
Título: Como administrador quiero ver el registro contable de ingresos para hacer seguimiento financiero del centro.
Reglas de negocio:
- El sistema debe registrar todos los ingresos (pagos de planes, señas, abonos, devoluciones, etc.) con fecha, usuario y concepto.
- El registro debe permitir filtrar por fecha, usuario y tipo de ingreso.

Criterios de aceptación:
Escenario 1: Visualización exitosa del historial contable
Dado que existen ingresos registrados
Cuando el administrador accede al registro contable
Entonces el sistema muestra el historial completo de ingresos

Escenario 2: Visualización con filtro
Dado que existen ingresos registrados
Cuando el administrador aplica un filtro válido (fecha, usuario, tipo de ingreso)
Entonces el sistema muestra solo los ingresos que cumplen el filtro

Escenario 3: Visualización vacía con filtro sin resultados
Dado que el filtro aplicado no coincide con ningún ingreso
Cuando el administrador aplica el filtro
Entonces el sistema muestra el historial vacío y un mensaje informativo
## ID: Ver registro de cambios de cuenta
Título: Como administrador quiero ver el historial de cambios de cuenta de usuarios para auditar suspensiones, reintegros, altas y bajas.
Reglas de negocio:
- El sistema debe registrar todas las operaciones sobre cuentas de usuario (suspensión, reintegro, alta, baja, rechazo, etc.)
- El registro debe permitir filtrar por usuario, tipo de cambio y fecha.

Criterios de aceptación:
Escenario 1: Visualización exitosa del historial de cambios de cuenta
Dado que existen cambios de cuenta registrados
Cuando el administrador accede al historial
Entonces el sistema muestra el historial completo de cambios de cuenta

Escenario 2: Visualización con filtro
Dado que existen cambios de cuenta registrados
Cuando el administrador aplica un filtro válido (usuario, tipo de cambio, fecha)
Entonces el sistema muestra solo los cambios que cumplen el filtro

Escenario 3: Visualización vacía con filtro sin resultados
Dado que el filtro aplicado no coincide con ningún cambio
Cuando el administrador aplica el filtro
Entonces el sistema muestra el historial vacío y un mensaje informativo
## ID: Ver listado de usuarios (general)
Título: Como administrador quiero ver el listado de usuarios para auditar y gestionar el acceso al sistema.
Reglas de negocio:
- El sistema debe permitir listar todos los usuarios con sus datos principales y estado de cuenta.
- El registro debe permitir filtrar por rol, estado y fecha de alta.

Criterios de aceptación:
Escenario 1: Visualización exitosa del listado de usuarios
Dado que existen usuarios registrados
Cuando el administrador accede al listado
Entonces el sistema muestra el listado completo de usuarios

Escenario 2: Visualización con filtro
Dado que existen usuarios registrados
Cuando el administrador aplica un filtro válido (rol, estado, fecha de alta)
Entonces el sistema muestra sólo los usuarios que cumplen el filtro

Escenario 3: Visualización vacía con filtro sin resultados
Dado que el filtro aplicado no coincide con ningún usuario
Cuando el administrador aplica el filtro
Entonces el sistema muestra el listado vacío y un mensaje informativo


