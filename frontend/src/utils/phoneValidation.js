/**
 * Utilidades para sanitización y validación de números telefónicos.
 * Soporta números de Perú (9 dígitos iniciando con 9 -> canónico +51 9XX XXX XXX)
 * y números en formato internacional E.164 (con prefijo + y entre 8 y 15 dígitos),
 * con auto-espaciado inteligente para los principales países de la región.
 */

/**
 * Formatea canónicamente números internacionales con prefijo de países conocidos
 * (Perú, México, Colombia, Chile, España, EE.UU./Canadá, Argentina).
 *
 * @param {string} digitsAfterPlus - Dígitos numéricos tras el símbolo '+'
 * @returns {string|null} Teléfono con espaciado legible o null si no es un país reconocido
 */
export function formatKnownCountryPhone(digitsAfterPlus) {
  if (!digitsAfterPlus || typeof digitsAfterPlus !== 'string') return null;

  // Perú (+51): 9 dígitos iniciando en 9
  if (digitsAfterPlus.length === 11 && digitsAfterPlus.startsWith('519')) {
    const d = digitsAfterPlus.slice(2);
    return `+51 ${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 9)}`;
  }
  // México (+52): 10 dígitos nacionales (ej. +52 55 8869 4904)
  if (digitsAfterPlus.length === 12 && digitsAfterPlus.startsWith('52')) {
    const d = digitsAfterPlus.slice(2);
    return `+52 ${d.slice(0, 2)} ${d.slice(2, 6)} ${d.slice(6, 10)}`;
  }
  // Colombia (+57): 10 dígitos nacionales (ej. +57 300 123 4567)
  if (digitsAfterPlus.length === 12 && digitsAfterPlus.startsWith('57')) {
    const d = digitsAfterPlus.slice(2);
    return `+57 ${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 10)}`;
  }
  // Chile (+56): 9 dígitos nacionales (ej. +56 9 1234 5678)
  if (digitsAfterPlus.length === 11 && digitsAfterPlus.startsWith('56')) {
    const d = digitsAfterPlus.slice(2);
    return `+56 ${d.slice(0, 1)} ${d.slice(1, 5)} ${d.slice(5, 9)}`;
  }
  // España (+34): 9 dígitos nacionales (ej. +34 612 345 678)
  if (digitsAfterPlus.length === 11 && digitsAfterPlus.startsWith('34')) {
    const d = digitsAfterPlus.slice(2);
    return `+34 ${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 9)}`;
  }
  // EE.UU. / Canadá (+1): 10 dígitos nacionales (ej. +1 555 123 4567)
  if (digitsAfterPlus.length === 11 && digitsAfterPlus.startsWith('1')) {
    const d = digitsAfterPlus.slice(1);
    return `+1 ${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 10)}`;
  }
  // Argentina (+54): 10 dígitos nacionales (ej. +54 9 11 2345 6789 o +54 11 2345 6789)
  if (digitsAfterPlus.length === 12 && digitsAfterPlus.startsWith('54')) {
    const d = digitsAfterPlus.slice(2);
    return `+54 ${d.slice(0, 2)} ${d.slice(2, 6)} ${d.slice(6, 10)}`;
  }
  return null;
}

/**
 * Sanitiza la entrada de un teléfono mientras el usuario escribe en el formulario.
 * Permite únicamente dígitos, un '+' al inicio, espacios, guiones y paréntesis.
 * Elimina cualquier letra, punto, coma u otro símbolo.
 *
 * @param {string} value - Valor en bruto ingresado por el usuario
 * @returns {string} Valor sanitizado
 */
export function sanitizePhoneInput(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  const startsWithPlus = str.trimStart().startsWith('+');
  // Retener solo dígitos, espacios, guiones y paréntesis
  const allowed = str.replace(/[^\d\s\-()]/g, '');
  return startsWithPlus ? `+${allowed}` : allowed;
}

/**
 * Evalúa y formatea un número de teléfono.
 *
 * Reglas de negocio:
 * 1. Si está vacío o solo espacios:
 *    - Si isOptional: válido, formattedPhone: '', error: null
 *    - Si no isOptional: inválido con phoneEmptyError
 * 2. Si contiene letras, comas o puntos:
 *    - Inválido con phoneInvalidCharsError
 * 3. Si no empieza con '+':
 *    - Se asume Perú. Extraer dígitos.
 *    - Si tiene 9 dígitos y empieza con 9: válido con formato canónico +51 9XX XXX XXX
 *    - Si no: inválido con phonePeruInvalidError
 * 4. Si empieza con '+':
 *    - Extraer dígitos tras el '+'.
 *    - Si tiene entre 8 y 15 dígitos y el primer dígito no es '0':
 *      - Si coincide con país conocido (Perú, México, Colombia, Chile, España, EE.UU., Argentina):
 *        formato canónico con espacios legibles
 *      - Si excede 20 caracteres: inválido con phoneLengthError
 *      - En otro caso: formato limpio con espacios normalizados
 *    - Si no: inválido con phoneInternationalInvalidError
 *
 * @param {string|null|undefined} rawPhone - Número de teléfono a evaluar
 * @param {Object} [options]
 * @param {boolean} [options.isOptional=true] - Si el teléfono es opcional
 * @param {Function} [options.t] - Función de traducción i18n
 * @returns {{ isValid: boolean, formattedPhone: string, error: string|null }}
 */
export function evaluatePhone(rawPhone, options = {}) {
  const { isOptional = true, t = (k, fallback) => fallback } = options;

  const raw = rawPhone === null || rawPhone === undefined ? '' : String(rawPhone);
  const trimmed = raw.trim();

  // 1. Campo vacío o solo espacios
  if (!trimmed) {
    if (isOptional) {
      return { isValid: true, formattedPhone: '', error: null };
    }
    return {
      isValid: false,
      formattedPhone: '',
      error: t('configuration.phoneEmptyError', 'El teléfono no puede estar vacío.'),
    };
  }

  // 2. Comprobar si contiene letras, puntos o comas
  if (/[\p{L}.,]/u.test(trimmed)) {
    return {
      isValid: false,
      formattedPhone: rawPhone,
      error: t(
        'configuration.phoneInvalidCharsError',
        'El teléfono no debe contener letras, puntos ni comas.'
      ),
    };
  }

  // 3. Si no empieza con '+' -> Se asume Perú
  if (!trimmed.startsWith('+')) {
    const digits = trimmed.replace(/\D/g, '');
    if (digits.length === 9 && digits.startsWith('9')) {
      const formatted = `+51 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)}`;
      return { isValid: true, formattedPhone: formatted, error: null };
    }
    return {
      isValid: false,
      formattedPhone: rawPhone,
      error: t(
        'configuration.phonePeruInvalidError',
        'El número de Perú debe tener 9 dígitos y empezar con 9 (ej. 987 654 321).'
      ),
    };
  }

  // 4. Si empieza con '+' -> Formato internacional
  const digitsAfterPlus = trimmed.slice(1).replace(/\D/g, '');

  if (
    digitsAfterPlus.length < 8 ||
    digitsAfterPlus.length > 15 ||
    digitsAfterPlus.startsWith('0')
  ) {
    return {
      isValid: false,
      formattedPhone: rawPhone,
      error: t(
        'configuration.phoneInternationalInvalidError',
        'Formato internacional no válido (debe tener entre 8 y 15 dígitos numéricos tras el +).'
      ),
    };
  }

  // Auto-espaciado inteligente si coincide con formato canónico de país conocido
  const knownFormatted = formatKnownCountryPhone(digitsAfterPlus);
  if (knownFormatted && knownFormatted.length <= 20) {
    return { isValid: true, formattedPhone: knownFormatted, error: null };
  }

  const phoneLimpio = '+' + trimmed.slice(1).replace(/\s+/g, ' ').trim();
  if (phoneLimpio.length > 20) {
    return {
      isValid: false,
      formattedPhone: rawPhone,
      error: t(
        'configuration.phoneLengthError',
        'El teléfono no puede exceder los 20 caracteres.'
      ),
    };
  }

  return { isValid: true, formattedPhone: phoneLimpio, error: null };
}
