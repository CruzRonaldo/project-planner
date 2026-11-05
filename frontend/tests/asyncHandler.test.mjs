import assert from 'node:assert/strict';
import test from 'node:test';
import { getApiErrorMessage, runSafe } from '../src/utils/asyncHandler.js';

test('getApiErrorMessage extrae string directo o usa fallback si el error es nulo', () => {
  assert.equal(getApiErrorMessage(null, 'Fallback base'), 'Fallback base');
  assert.equal(getApiErrorMessage(undefined, 'Fallback base'), 'Fallback base');
  assert.equal(getApiErrorMessage('Error de texto simple'), 'Error de texto simple');
});

test('getApiErrorMessage extrae mensajes típicos de respuestas de Django y DRF', () => {
  // Django error: { error: 'Mensaje de error' }
  const djangoError = { response: { data: { error: 'El código de proyecto ya existe' } } };
  assert.equal(getApiErrorMessage(djangoError), 'El código de proyecto ya existe');

  // DRF detail: { detail: 'No tienes permisos' }
  const drfDetail = { response: { data: { detail: 'Credenciales inválidas' } } };
  assert.equal(getApiErrorMessage(drfDetail), 'Credenciales inválidas');

  // DRF non_field_errors
  const nonField = { response: { data: { non_field_errors: ['La fecha final debe ser posterior a la fecha inicial'] } } };
  assert.equal(getApiErrorMessage(nonField), 'La fecha final debe ser posterior a la fecha inicial');

  // Error en campo de formulario { email: ['Email no válido'] }
  const fieldError = { response: { data: { email: ['Email no válido'] } } };
  assert.equal(getApiErrorMessage(fieldError), 'Email no válido');
});

test('getApiErrorMessage detecta fallos de conexión o red sin respuesta del servidor', () => {
  const networkError = { request: {}, message: 'Network Error' };
  assert.ok(getApiErrorMessage(networkError).includes('No se pudo conectar con el servidor'));

  const axiosCodeError = { request: {}, code: 'ERR_NETWORK' };
  assert.ok(getApiErrorMessage(axiosCodeError).includes('No se pudo conectar con el servidor'));
});

test('runSafe ejecuta con éxito, gestiona loading y dispara toast exitoso', async () => {
  const loadingStates = [];
  const toastEvents = [];

  const mockFn = async () => ({ id: 42, name: 'Proyecto Alpha' });

  const [data, error] = await runSafe(mockFn, {
    setLoading: (val) => loadingStates.push(val),
    showToast: (t) => toastEvents.push(t),
    successTitle: 'Guardado',
    successMessage: (res) => `Creado ${res.name}`,
  });

  assert.equal(error, null);
  assert.deepEqual(data, { id: 42, name: 'Proyecto Alpha' });
  assert.deepEqual(loadingStates, [true, false]);
  assert.equal(toastEvents.length, 1);
  assert.equal(toastEvents[0].title, 'Guardado');
  assert.equal(toastEvents[0].message, 'Creado Proyecto Alpha');
  assert.equal(toastEvents[0].type, 'success');
});

test('runSafe captura fallo, apaga loading en finally y dispara toast de error con mensaje amigable', async () => {
  const loadingStates = [];
  const toastEvents = [];
  let capturedError = null;
  let capturedMessage = '';

  const failingFn = async () => {
    const err = new Error('Request failed with status 400');
    err.response = { data: { error: 'Presupuesto insuficiente para la asignación' } };
    throw err;
  };

  const [data, error] = await runSafe(failingFn, {
    setLoading: (val) => loadingStates.push(val),
    showToast: (t) => toastEvents.push(t),
    errorTitle: 'Fallo al asignar',
    fallbackError: 'No se pudo completar la asignación',
    onError: (err, msg) => {
      capturedError = err;
      capturedMessage = msg;
    },
  });

  assert.equal(data, null);
  assert.ok(error);
  assert.equal(error.friendlyMessage, 'Presupuesto insuficiente para la asignación');
  assert.deepEqual(loadingStates, [true, false]);
  assert.equal(toastEvents.length, 1);
  assert.equal(toastEvents[0].title, 'Fallo al asignar');
  assert.equal(toastEvents[0].message, 'Presupuesto insuficiente para la asignación');
  assert.equal(toastEvents[0].type, 'error');
  assert.equal(capturedMessage, 'Presupuesto insuficiente para la asignación');
  assert.ok(capturedError);
});

test('runSafe funciona de forma limpia en modo minimalista sin opciones', async () => {
  const [data, error] = await runSafe(async () => 'OK');
  assert.equal(data, 'OK');
  assert.equal(error, null);

  const [failedData, failedErr] = await runSafe(async () => {
    throw new Error('Boom');
  });
  assert.equal(failedData, null);
  assert.equal(failedErr.message, 'Boom');
});
