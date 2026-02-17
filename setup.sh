#!/bin/bash

echo "=================================="
echo "Motor Premium Calculator - Setup"
echo "=================================="
echo

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed"
    exit 1
fi
echo "✓ Python 3 found"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    exit 1
fi
echo "✓ Node.js found"

# Install Python dependencies
echo
echo "Installing Python dependencies..."
pip install -r requirements.txt --quiet
echo "✓ Python dependencies installed"

# Install Node dependencies
echo
echo "Installing Node.js dependencies..."
cd frontend
npm install --silent
cd ..
echo "✓ Node.js dependencies installed"

echo
echo "=================================="
echo "Setup Complete!"
echo "=================================="
echo
echo "To run the application:"
echo
echo "Terminal 1 (Backend):"
echo "  uvicorn src.premium_calculator.api:app --reload"
echo
echo "Terminal 2 (Frontend):"
echo "  cd frontend && npm start"
echo
echo "Then open: http://localhost:3000"
echo
