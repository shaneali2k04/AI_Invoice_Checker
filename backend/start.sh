#!/usr/bin/env bash
# Render start script

echo "Starting FastAPI server..."
cd /opt/render/project/src/backend
uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
