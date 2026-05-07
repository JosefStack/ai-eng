from fastapi import Request
import time

async def logging_middleware(request: Request, call_next):
    start = time.time()
    print(f"-> REQUEST [{request.method}] {request.url.path}")

    response = await call_next(request)

    duration = time.time() - start
    print(f"-> RESPONSE [{request.method}] {request.url.path} - {response.status_code} - {duration:.2f}s")

    return response

