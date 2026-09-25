FROM node:22-alpine AS frontend-build

WORKDIR /build/frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./

ENV DISABLE_HOT_RELOAD=true \
    DISABLE_VISUAL_EDITS=true \
    DISABLE_EMERGENT_OVERLAY=true

RUN npm run build


FROM python:3.11-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    STATIC_DIR=/app/frontend/dist

WORKDIR /app/backend

COPY backend/requirements.txt ./requirements.txt

RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

COPY backend/ ./

COPY --from=frontend-build /build/frontend/dist /app/frontend/dist

RUN useradd --create-home --uid 10001 appuser \
    && mkdir -p /mnt/private-uploads \
    && chown -R appuser:appuser /app /mnt/private-uploads

USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=8s --start-period=45s --retries=3 \
    CMD python -c "import os, urllib.request; urllib.request.urlopen('http://127.0.0.1:' + os.environ['PORT'] + '/api/health', timeout=5).read()" || exit 1

CMD ["sh", "-c", "test -n \"$PORT\" && exec uvicorn server:app --host 0.0.0.0 --port \"$PORT\" --proxy-headers --forwarded-allow-ips='*'"]