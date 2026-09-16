// Express 4 only catches synchronous throws in route handlers — an async
// controller's rejected promise would otherwise hang the request. Wrap every
// async controller with this so rejections reach the centralized error handler.
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
