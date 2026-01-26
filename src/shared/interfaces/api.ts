export interface IApiResponse<T = unknown> {
  status: boolean;
  code: number;
  message?: string;
  data?: T;
  errors?: IApiError[];
  validationMessages?: string[];
  total?: number;
}

export interface IApiError {
  code: string;
  message: string;
}
