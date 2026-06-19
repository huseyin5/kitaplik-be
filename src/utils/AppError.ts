/**
 * Uygulama genelinde kullanılan operasyonel hata sınıfı.
 * `statusCode` ile uygun HTTP durum kodu, `errorHandler` tarafından
 * client'a döndürülür.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(
    statusCode: number,
    message: string,
    details?: unknown,
    isOperational = true,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace?.(this, this.constructor);
  }

  static badRequest(message: string, details?: unknown): AppError {
    return new AppError(400, message, details);
  }

  static notFound(message = 'Kaynak bulunamadı'): AppError {
    return new AppError(404, message);
  }

  static badGateway(message = 'Dış servis hatası', details?: unknown): AppError {
    return new AppError(502, message, details);
  }

  static internal(message = 'Beklenmeyen bir hata oluştu'): AppError {
    return new AppError(500, message, undefined, false);
  }
}
