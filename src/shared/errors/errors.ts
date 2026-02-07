// Base class for HTTP errors
export abstract class HttpError extends Error {
  public abstract readonly statusCode: number;

  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, HttpError.prototype);
  }
}



export class BadRequestError extends Error {
  public readonly statusCode: number;

  constructor(message: string = "Bad Request") {
    super(message);
    this.name = "BadRequestError";
    this.statusCode = 400;
    Object.setPrototypeOf(this, BadRequestError.prototype);
  }
}

export class UnauthorizedError extends Error {
  public readonly statusCode: number;

  constructor(message: string = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
    this.statusCode = 401;
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

export class PaymentRequiredError extends Error {
  public readonly statusCode: number;

  constructor(message: string = "Payment Required") {
    super(message);
    this.name = "PaymentRequiredError";
    this.statusCode = 402;
    Object.setPrototypeOf(this, PaymentRequiredError.prototype);
  }
}

export class ForbiddenError extends Error {
  public readonly statusCode: number;

  constructor(message: string = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
    this.statusCode = 403;
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

export class NotFoundError extends Error {
  public readonly statusCode: number;

  constructor(message: string = "Not Found") {
    super(message);
    this.name = "NotFoundError";
    this.statusCode = 404;
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class MethodNotAllowedError extends Error {
  public readonly statusCode: number;

  constructor(message: string = "Method Not Allowed") {
    super(message);
    this.name = "MethodNotAllowedError";
    this.statusCode = 405;
    Object.setPrototypeOf(this, MethodNotAllowedError.prototype);
  }
}

export class NotAcceptableError extends Error {
  public readonly statusCode: number;

  constructor(message: string = "Not Acceptable") {
    super(message);
    this.name = "NotAcceptableError";
    this.statusCode = 406;
    Object.setPrototypeOf(this, NotAcceptableError.prototype);
  }
}

export class RequestTimeoutError extends Error {
  public readonly statusCode: number;

  constructor(message: string = "Request Timeout") {
    super(message);
    this.name = "RequestTimeoutError";
    this.statusCode = 408;
    Object.setPrototypeOf(this, RequestTimeoutError.prototype);
  }
}

export class ConflictError extends Error {
  public readonly statusCode: number;

  constructor(message: string = "Conflict") {
    super(message);
    this.name = "ConflictError";
    this.statusCode = 409;
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

export class GoneError extends Error {
  public readonly statusCode: number;

  constructor(message: string = "Gone") {
    super(message);
    this.name = "GoneError";
    this.statusCode = 410;
    Object.setPrototypeOf(this, GoneError.prototype);
  }
}

export class UnprocessableEntityError extends Error {
  public readonly statusCode: number;

  constructor(message: string = "Unprocessable Entity") {
    super(message);
    this.name = "UnprocessableEntityError";
    this.statusCode = 422;
    Object.setPrototypeOf(this, UnprocessableEntityError.prototype);
  }
}

export class TooManyRequestsError extends Error {
  public readonly statusCode: number;

  constructor(message: string = "Too Many Requests") {
    super(message);
    this.name = "TooManyRequestsError";
    this.statusCode = 429;
    Object.setPrototypeOf(this, TooManyRequestsError.prototype);
  }
}

export class InternalServerError extends Error {
  public readonly statusCode: number;

  constructor(message: string = "Internal Server Error") {
    super(message);
    this.name = "InternalServerError";
    this.statusCode = 500;
    Object.setPrototypeOf(this, InternalServerError.prototype);
  }
}

export class NotImplementedError extends Error {
  public readonly statusCode: number;

  constructor(message: string = "Not Implemented") {
    super(message);
    this.name = "NotImplementedError";
    this.statusCode = 501;
    Object.setPrototypeOf(this, NotImplementedError.prototype);
  }
}

export class BadGatewayError extends Error {
  public readonly statusCode: number;

  constructor(message: string = "Bad Gateway") {
    super(message);
    this.name = "BadGatewayError";
    this.statusCode = 502;
    Object.setPrototypeOf(this, BadGatewayError.prototype);
  }
}

export class ServiceUnavailableError extends Error {
  public readonly statusCode: number;

  constructor(message: string = "Service Unavailable") {
    super(message);
    this.name = "ServiceUnavailableError";
    this.statusCode = 503;
    Object.setPrototypeOf(this, ServiceUnavailableError.prototype);
  }
}

export class GatewayTimeoutError extends Error {
  public readonly statusCode: number;

  constructor(message: string = "Gateway Timeout") {
    super(message);
    this.name = "GatewayTimeoutError";
    this.statusCode = 504;
    Object.setPrototypeOf(this, GatewayTimeoutError.prototype);
  }
}
