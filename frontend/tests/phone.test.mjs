import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluatePhone, formatKnownCountryPhone, sanitizePhoneInput } from '../src/utils/phoneValidation.js';

test('evaluatePhone maneja teléfonos vacíos o nulos según isOptional', () => {
  // Opcional por defecto (isOptional: true)
  assert.deepEqual(evaluatePhone(''), { isValid: true, formattedPhone: '', error: null });
  assert.deepEqual(evaluatePhone(null), { isValid: true, formattedPhone: '', error: null });
  assert.deepEqual(evaluatePhone(undefined), { isValid: true, formattedPhone: '', error: null });
  assert.deepEqual(evaluatePhone('   '), { isValid: true, formattedPhone: '', error: null });

  // No opcional (isOptional: false)
  const requiredRes = evaluatePhone('', { isOptional: false });
  assert.equal(requiredRes.isValid, false);
  assert.equal(requiredRes.formattedPhone, '');
  assert.equal(requiredRes.error, 'El teléfono no puede estar vacío.');

  const requiredSpaces = evaluatePhone('   ', { isOptional: false });
  assert.equal(requiredSpaces.isValid, false);
  assert.equal(requiredSpaces.error, 'El teléfono no puede estar vacío.');
});

test('evaluatePhone valida y formatea números de Perú con 9 dígitos empezando en 9', () => {
  const result1 = evaluatePhone('987654321');
  assert.equal(result1.isValid, true);
  assert.equal(result1.formattedPhone, '+51 987 654 321');
  assert.equal(result1.error, null);

  const result2 = evaluatePhone('987 654 321');
  assert.equal(result2.isValid, true);
  assert.equal(result2.formattedPhone, '+51 987 654 321');
  assert.equal(result2.error, null);

  const result3 = evaluatePhone('  987-654-321  ');
  assert.equal(result3.isValid, true);
  assert.equal(result3.formattedPhone, '+51 987 654 321');
  assert.equal(result3.error, null);

  // Con prefijo +51 explícito
  const result4 = evaluatePhone('+51 987 654 321');
  assert.equal(result4.isValid, true);
  assert.equal(result4.formattedPhone, '+51 987 654 321');
  assert.equal(result4.error, null);

  const result5 = evaluatePhone('+51987654321');
  assert.equal(result5.isValid, true);
  assert.equal(result5.formattedPhone, '+51 987 654 321');
  assert.equal(result5.error, null);
});

test('evaluatePhone rechaza números de Perú inválidos (longitud incorrecta o no inician con 9)', () => {
  // 8 dígitos
  const res8Digits = evaluatePhone('98765432');
  assert.equal(res8Digits.isValid, false);
  assert.equal(
    res8Digits.error,
    'El número de Perú debe tener 9 dígitos y empezar con 9 (ej. 987 654 321).'
  );

  // Inicia con 8
  const resStarts8 = evaluatePhone('887654321');
  assert.equal(resStarts8.isValid, false);
  assert.equal(
    resStarts8.error,
    'El número de Perú debe tener 9 dígitos y empezar con 9 (ej. 987 654 321).'
  );

  // Inicia con 1
  const resStarts1 = evaluatePhone('123456789');
  assert.equal(resStarts1.isValid, false);
  assert.equal(
    resStarts1.error,
    'El número de Perú debe tener 9 dígitos y empezar con 9 (ej. 987 654 321).'
  );

  // 10 dígitos sin prefijo internacional
  const res10Digits = evaluatePhone('9876543210');
  assert.equal(res10Digits.isValid, false);
  assert.equal(
    res10Digits.error,
    'El número de Perú debe tener 9 dígitos y empezar con 9 (ej. 987 654 321).'
  );
});

test('evaluatePhone valida teléfonos internacionales válidos', () => {
  // Colombia (+57)
  const resCol = evaluatePhone('+57 300 123 4567');
  assert.equal(resCol.isValid, true);
  assert.equal(resCol.formattedPhone, '+57 300 123 4567');
  assert.equal(resCol.error, null);

  // Estados Unidos (+1)
  const resUSA = evaluatePhone('+1 800 555 0199');
  assert.equal(resUSA.isValid, true);
  assert.equal(resUSA.formattedPhone, '+1 800 555 0199');
  assert.equal(resUSA.error, null);

  // México (+52)
  const resMex = evaluatePhone('+52 55 1234 5678');
  assert.equal(resMex.isValid, true);
  assert.equal(resMex.formattedPhone, '+52 55 1234 5678');
  assert.equal(resMex.error, null);
});

test('evaluatePhone formatea con auto-espaciado inteligente teléfonos de países conocidos ingresados sin espacios', () => {
  // México (+52) sin espacios: 10 dígitos nacionales
  const resMex = evaluatePhone('+525588694904');
  assert.equal(resMex.isValid, true);
  assert.equal(resMex.formattedPhone, '+52 55 8869 4904');
  assert.equal(resMex.error, null);

  // Colombia (+57) sin espacios: 10 dígitos nacionales
  const resCol = evaluatePhone('+573001234567');
  assert.equal(resCol.isValid, true);
  assert.equal(resCol.formattedPhone, '+57 300 123 4567');
  assert.equal(resCol.error, null);

  // Estados Unidos (+1) sin espacios: 10 dígitos nacionales
  const resUSA = evaluatePhone('+12025550123');
  assert.equal(resUSA.isValid, true);
  assert.equal(resUSA.formattedPhone, '+1 202 555 0123');
  assert.equal(resUSA.error, null);

  // Chile (+56) sin espacios: 9 dígitos nacionales
  const resChile = evaluatePhone('+56912345678');
  assert.equal(resChile.isValid, true);
  assert.equal(resChile.formattedPhone, '+56 9 1234 5678');
  assert.equal(resChile.error, null);

  // España (+34) sin espacios: 9 dígitos nacionales
  const resEsp = evaluatePhone('+34612345678');
  assert.equal(resEsp.isValid, true);
  assert.equal(resEsp.formattedPhone, '+34 612 345 678');
  assert.equal(resEsp.error, null);

  // Argentina (+54) sin espacios: 10 dígitos nacionales
  const resArg = evaluatePhone('+541123456789');
  assert.equal(resArg.isValid, true);
  assert.equal(resArg.formattedPhone, '+54 11 2345 6789');
  assert.equal(resArg.error, null);

  // Perú (+51) con prefijo internacional sin espacios
  const resPeru = evaluatePhone('+51987654321');
  assert.equal(resPeru.isValid, true);
  assert.equal(resPeru.formattedPhone, '+51 987 654 321');
  assert.equal(resPeru.error, null);
});

test('formatKnownCountryPhone formatea o devuelve null para entradas no reconocidas', () => {
  assert.equal(formatKnownCountryPhone('51987654321'), '+51 987 654 321');
  assert.equal(formatKnownCountryPhone('525588694904'), '+52 55 8869 4904');
  assert.equal(formatKnownCountryPhone('573001234567'), '+57 300 123 4567');
  assert.equal(formatKnownCountryPhone('56912345678'), '+56 9 1234 5678');
  assert.equal(formatKnownCountryPhone('34612345678'), '+34 612 345 678');
  assert.equal(formatKnownCountryPhone('12025550123'), '+1 202 555 0123');
  assert.equal(formatKnownCountryPhone('541123456789'), '+54 11 2345 6789');

  // No reconocidos / inválidos
  assert.equal(formatKnownCountryPhone('33123456789'), null);
  assert.equal(formatKnownCountryPhone(''), null);
  assert.equal(formatKnownCountryPhone(null), null);
  assert.equal(formatKnownCountryPhone(undefined), null);
});

test('evaluatePhone rechaza teléfonos que contienen letras, puntos o comas', () => {
  const withLetters = evaluatePhone('+57 300 abc 4567');
  assert.equal(withLetters.isValid, false);
  assert.equal(
    withLetters.error,
    'El teléfono no debe contener letras, puntos ni comas.'
  );

  const withDots = evaluatePhone('+51 987.654.321');
  assert.equal(withDots.isValid, false);
  assert.equal(
    withDots.error,
    'El teléfono no debe contener letras, puntos ni comas.'
  );

  const withCommas = evaluatePhone('987,654,321');
  assert.equal(withCommas.isValid, false);
  assert.equal(
    withCommas.error,
    'El teléfono no debe contener letras, puntos ni comas.'
  );
});

test('evaluatePhone rechaza formato internacional inválido (dígitos < 8, > 15 o inicia con 0)', () => {
  // Inicia con 0 tras el +
  const resZero = evaluatePhone('+0123456789');
  assert.equal(resZero.isValid, false);
  assert.equal(
    resZero.error,
    'Formato internacional no válido (debe tener entre 8 y 15 dígitos numéricos tras el +).'
  );

  // Muy corto (< 8 dígitos tras el +)
  const resShort = evaluatePhone('+1234567');
  assert.equal(resShort.isValid, false);
  assert.equal(
    resShort.error,
    'Formato internacional no válido (debe tener entre 8 y 15 dígitos numéricos tras el +).'
  );

  // Muy largo (> 15 dígitos tras el +)
  const resLong = evaluatePhone('+1234567890123456');
  assert.equal(resLong.isValid, false);
  assert.equal(
    resLong.error,
    'Formato internacional no válido (debe tener entre 8 y 15 dígitos numéricos tras el +).'
  );
});

test('evaluatePhone rechaza números que exceden los 20 caracteres totales', () => {
  const longPhone = '+57 1 2 3 4 5 6 7 8 9 0 1 2';
  assert.ok(longPhone.length > 20);
  const res = evaluatePhone(longPhone);
  assert.equal(res.isValid, false);
  assert.equal(res.error, 'El teléfono no puede exceder los 20 caracteres.');
});

test('evaluatePhone soporta función de traducción i18n personalizada', () => {
  const mockT = (key, fallback) => {
    const dict = {
      'configuration.phoneEmptyError': 'Custom: Phone cannot be empty',
      'configuration.phonePeruInvalidError': 'Custom: Peru phone must have 9 digits',
    };
    return dict[key] || fallback;
  };

  const emptyRes = evaluatePhone('', { isOptional: false, t: mockT });
  assert.equal(emptyRes.error, 'Custom: Phone cannot be empty');

  const peruRes = evaluatePhone('887654321', { t: mockT });
  assert.equal(peruRes.error, 'Custom: Peru phone must have 9 digits');
});

test('sanitizePhoneInput permite solo números, +, espacios, guiones y paréntesis', () => {
  assert.equal(sanitizePhoneInput('abc987.654,321#'), '987654321');
  assert.equal(sanitizePhoneInput('+51 987 654 321'), '+51 987 654 321');
  assert.equal(sanitizePhoneInput('+51 abc 987'), '+51  987');
  assert.equal(sanitizePhoneInput('++51 987'), '+51 987');
  assert.equal(sanitizePhoneInput('987-654-321'), '987-654-321');
  assert.equal(sanitizePhoneInput('+1 (555) 123-4567'), '+1 (555) 123-4567');
  assert.equal(sanitizePhoneInput(''), '');
  assert.equal(sanitizePhoneInput(null), '');
  assert.equal(sanitizePhoneInput(undefined), '');
});
