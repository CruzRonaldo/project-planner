/**
 * Datos mock de usuarios para visualización y desarrollo offline del frontend.
 * En ejecución real o producción, estos datos se obtienen directamente de PostgreSQL (seed_data.py).
 */

export const initialUsers = [
  {
    id: 'usr-admin',
    db_id: 4,
    username: 'Admin',
    name: 'Admin',
    email: 'admin@gmail.com',
    isAdmin: true,
    isSubAdmin: false,
    isOnline: true,
  },
  {
    id: 'usr-sistemas',
    db_id: 1,
    username: 'sistemas',
    name: 'Luis Gonzales (Sistemas)',
    email: 'sistemas@gmail.com',
    isAdmin: false,
    isSubAdmin: false,
    isOnline: false,
  },
  {
    id: 'usr-civil',
    db_id: 2,
    username: 'civil',
    name: 'Andrea Rojas (Civil)',
    email: 'civil@gmail.com',
    isAdmin: false,
    isSubAdmin: false,
    isOnline: false,
  },
  {
    id: 'usr-arquitectura',
    db_id: 3,
    username: 'arquitectura',
    name: 'Carlos Mendoza (Arquitectura)',
    email: 'arquitectura@gmail.com',
    isAdmin: false,
    isSubAdmin: false,
    isOnline: false,
  },
];
