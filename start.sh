#!/bin/bash

echo "Starting Ikimina Digital Tontine System..."
echo

echo "Installing dependencies..."
npm run install-all

echo
echo "Running database migration..."
npm run migrate

echo
echo "Starting development servers..."
echo "Backend will run on http://localhost:3000"
echo "Frontend will run on http://localhost:3001"
echo

npm run dev