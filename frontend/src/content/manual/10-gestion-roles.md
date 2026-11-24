# 10. Gestión de Roles y Permisos (RBAC)

[← Volver al índice](./README.md)

---

## Espacios y Matriz de Permisos de la Vista

El módulo de **Gestión de Roles** administra los niveles de autorización y la seguridad de acceso a la plataforma:

- **1. Matriz Oficial de Permisos:**  
  Define con precisión las capacidades asignadas a cada perfil:

| Capacidad del Sistema | Administrador (`admin`) | Subadministrador (`subadmin`) | Usuario Técnico (`user`) |
| :--- | :---: | :---: | :---: |
| **Consultar Dashboard y Portafolio** | ✔ Total | ✔ Total | ✔ Total |
| **Crear y Editar Proyectos** | ✔ Sí | ✔ Sí | ✖ No |
| **Eliminar Proyectos** | ✔ Sí | ✖ No | ✖ No |
| **Ajustar Cronograma Gantt** | ✔ Sí | ✔ Sí | ✖ Solo consulta |
| **Emitir Órdenes de Trabajo** | ✔ Sí | ✔ Sí | ✖ Solo actualizar estado |
| **Alta y Reasignación de Técnicos** | ✔ Sí | ✔ Sí | ✖ No |
| **Dar de Baja a Técnicos** | ✔ Sí | ✖ No | ✖ No |
| **Exportar Nómina / Matriz RRHH** | ✔ Sí | ✔ Sí | ✖ No |
| **Configurar Make y Webhooks** | ✔ Sí | ✖ No | ✖ No |
| **Gestionar Roles de Otros Usuarios**| ✔ Sí | ✖ No | ✖ No |
| **Descargar Respaldos del Sistema** | ✔ Sí | ✖ No | ✖ No |

- **2. Directorio de Cuentas:**  
  Presenta la nómina de colaboradores registrados con su correo institucional y selector de rol activo.

![Gestión de Roles y Permisos](../../assets/manual/11-gestion-roles-usuarios.png)
*Figura 10.1: Módulo de administración de roles y permisos de acceso para usuarios.*

---

## 10.1 Consultar permisos y cuentas registradas

**Disponible para:** exclusivo Administrador.

1. En la esquina superior derecha, presione su perfil y seleccione **“Gestión de Roles”**.
2. Revise la lista de colaboradores para conocer sus roles actuales.
3. Utilice la caja de búsqueda para localizar rápidamente a un usuario por nombre o correo.

---

## 10.2 Promover a un usuario a Subadministrador

**Disponible para:** exclusivo Administrador.

1. En la tabla de usuarios, ubique la cuenta del colaborador que requiere permisos de gestión.
2. En la columna **Rol Actual**, abra el selector desplegable y elija **Subadministrador**.
3. Presione el botón **[Guardar Permisos]**.

**Resultado esperado:** el perfil del colaborador se actualiza de inmediato y la operación queda registrada en la bitácora de seguridad del sistema.

---

## 10.3 Revocar privilegios administrativos

**Disponible para:** exclusivo Administrador.

1. Localice la cuenta del usuario en la tabla.
2. Cambie su rol en el selector desplegable de *Subadministrador* a **Usuario Estándar**.
3. Presione **[Guardar Permisos]**.

**Resultado esperado:** en su siguiente acción, el sistema restringirá el acceso a los paneles administrativos de esa cuenta.
