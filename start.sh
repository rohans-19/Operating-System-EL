#!/bin/bash

# Kill background processes on exit
trap "trap - SIGTERM && kill -- -$$" SIGINT SIGTERM EXIT

# Start Backend
echo "Starting Backend..."
cd backend
# Check if venv exists
if [ -d "../venv" ]; then
    source ../venv/bin/activate
fi
python3 server.py &
BACKEND_PID=$!
cd ..

# Wait for backend to be ready
sleep 2

# Start Frontend
echo "Starting Frontend..."
cd frontend
npm start &
FRONTEND_PID=$!

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
