/** Spring {@code ApiResponse<T>} và các envelope tương tự → trích {@code data}. */
export function unwrap(res) {
  const body = res?.data
  if (body && Object.prototype.hasOwnProperty.call(body, 'data')) {
    return body.data
  }
  return body
}
