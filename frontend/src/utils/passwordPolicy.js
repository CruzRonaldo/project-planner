export function validatePasswordPolicy(password = '') {
  if (password.length < 12) {
    return 'La contraseña debe tener al menos 12 caracteres.';
  }

  if (!/[A-ZÁÉÍÓÚÑ]/.test(password)) {
    return 'La contraseña debe contener al menos una mayúscula.';
  }

  if (!/[a-záéíóúñ]/.test(password)) {
    return 'La contraseña debe contener al menos una minúscula.';
  }

  if (!/\d/.test(password)) {
    return 'La contraseña debe contener al menos un número.';
  }

  if (!/[^A-Za-zÁÉÍÓÚÑáéíóúñ0-9\s]/.test(password)) {
    return 'La contraseña debe contener al menos un símbolo.';
  }

  return '';
}