/**
 * Converts API errors into user-friendly Spanish messages.
 * Never exposes technical details like status codes to the user.
 */

import { ApiError } from './api'

export function friendlyError(err: unknown): string {
  // Network / fetch failure (backend unreachable)
  if (err instanceof TypeError) {
    return 'No se pudo conectar con el servidor. Verifica tu conexión o que el servicio esté activo.'
  }

  if (err instanceof ApiError) {
    switch (err.status) {
      case 400: return 'Los datos enviados no son válidos. Revisa los campos e intenta de nuevo.'
      case 401: return 'Correo o contraseña incorrectos. Verifica tus credenciales.'
      case 403: return 'No tienes permisos para realizar esta acción.'
      case 404: return 'No encontramos el recurso solicitado.'
      case 409: return 'Ya existe un registro con esos datos. Verifica e intenta con datos diferentes.'
      case 422: return 'Algunos campos tienen valores inválidos. Revisa el formulario.'
      case 429: return 'Demasiados intentos. Espera un momento antes de intentar de nuevo.'
      default:
        if (err.status >= 500) return 'El servidor encontró un problema. Por favor intenta más tarde.'
        return err.message ?? 'Ocurrió un error inesperado.'
    }
  }

  if (err instanceof Error) {
    if (err.name === 'AbortError') return 'La petición tardó demasiado. El servidor puede estar iniciando. Intenta de nuevo.'
    return 'Ocurrió un error inesperado.'
  }

  return 'Ocurrió un error inesperado.'
}
