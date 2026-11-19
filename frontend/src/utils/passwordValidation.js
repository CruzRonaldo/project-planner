export function evaluatePassword(password = '', confirmPassword = '', options = {}) {
  const { currentPassword = '' } = options;

  const rules = [
    {
      id: 'length',
      label: 'Mínimo 12 caracteres',
      valid: password.length >= 12,
    },
    {
      id: 'uppercase',
      label: 'Al menos una mayúscula (A-Z)',
      valid: /[A-Z]/.test(password),
    },
    {
      id: 'lowercase',
      label: 'Al menos una minúscula (a-z)',
      valid: /[a-z]/.test(password),
    },
    {
      id: 'number',
      label: 'Al menos un número (0-9)',
      valid: /[0-9]/.test(password),
    },
    {
      id: 'symbol',
      label: 'Al menos un símbolo (!@#$%...)',
      valid: /[^A-Za-z0-9\s]/.test(password),
    },
    {
      id: 'noSpaces',
      label: 'Sin espacios en blanco',
      valid: password.length > 0 && !/\s/.test(password),
    },
    {
      id: 'match',
      label: 'Las contraseñas coinciden',
      valid: password.length > 0 && password === confirmPassword,
    },
  ];

  if (currentPassword) {
    rules.push({
      id: 'different',
      label: 'Distinta a la contraseña actual',
      valid: password.length > 0 && password !== currentPassword,
    });
  }

  const failed = rules.filter((r) => !r.valid);

  return {
    rules,
    isValid: failed.length === 0,
    failedLabels: failed.map((r) => r.label.toLowerCase()),
  };
}