// Define the expected shape of the error object
export interface ServerErrorResponse {
  response: {
    data: {
      message: string
    }
  }
}

// Custom type guard function

export function isServerErrorResponse(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error: any
): error is ServerErrorResponse {
  return (
    error &&
    typeof error === 'object' &&
    'response' in error &&
    error.response &&
    typeof error.response === 'object' &&
    'data' in error.response &&
    error.response.data &&
    typeof error.response.data === 'object' &&
    'message' in error.response.data &&
    typeof error.response.data.message === 'string'
  )
}
