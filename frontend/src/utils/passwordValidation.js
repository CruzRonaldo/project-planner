export function evaluatePassword(password = '', confirmPassword = '', options = {}) {
  const { currentPassword = '', t } = options;

  const rules = [
    {
      id: 'length',
      labelKey: 'passwordPolicy.rules.length',
      defaultLabel: 'Mínimo 12 caracteres',
      label: 'Mínimo 12 caracteres',
      valid: password.length >= 12,
    },
    {
      id: 'uppercase',
      labelKey: 'passwordPolicy.rules.uppercase',
      defaultLabel: 'Al menos una mayúscula (A-Z)',
      label: 'Al menos una mayúscula (A-Z)',
      valid: /[A-Z]/.test(password),
    },
    {
      id: 'lowercase',
      labelKey: 'passwordPolicy.rules.lowercase',
      defaultLabel: 'Al menos una minúscula (a-z)',
      label: 'Al menos una minúscula (a-z)',
      valid: /[a-z]/.test(password),
    },
    {
      id: 'number',
      labelKey: 'passwordPolicy.rules.number',
      defaultLabel: 'Al menos un número (0-9)',
      label: 'Al menos un número (0-9)',
      valid: /[0-9]/.test(password),
    },
    {
      id: 'symbol',
      labelKey: 'passwordPolicy.rules.symbol',
      defaultLabel: 'Al menos un símbolo (!@#$%...)',
      label: 'Al menos un símbolo (!@#$%...)',
      valid: /[^A-Za-z0-9\s]/.test(password),
    },
    {
      id: 'noSpaces',
      labelKey: 'passwordPolicy.rules.noSpaces',
      defaultLabel: 'Sin espacios en blanco',
      label: 'Sin espacios en blanco',
      valid: password.length > 0 && !/\s/.test(password),
    },
    {
      id: 'match',
      labelKey: 'passwordPolicy.rules.match',
      defaultLabel: 'Las contraseñas coinciden',
      label: 'Las contraseñas coinciden',
      valid: password.length > 0 && password === confirmPassword,
    },
  ];

  if (currentPassword) {
    rules.push({
      id: 'different',
      labelKey: 'passwordPolicy.rules.different',
      defaultLabel: 'Distinta a la contraseña actual',
      label: 'Distinta a la contraseña actual',
      valid: password.length > 0 && password !== currentPassword,
    });
  }

  const failed = rules.filter((r) => !r.valid);
  const resolveLabel = (r, translator) => {
    if (typeof translator === 'function') {
      return translator(r.labelKey, r.defaultLabel || r.label);
    }
    return r.defaultLabel || r.label;
  };

  return {
    rules,
    isValid: failed.length === 0,
    failedLabels: failed.map((r) => resolveLabel(r, t).toLowerCase()),
    getFailedLabels: (translator) => failed.map((r) => resolveLabel(r, translator).toLowerCase()),
  };
}
