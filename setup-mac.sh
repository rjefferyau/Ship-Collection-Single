#!/bin/bash

# Ship Collection App - Mac Setup Script
# This script automates the initial setup process

set -e  # Exit on any error

echo "🚀 Ship Collection App - Mac Setup"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    print_error "This script is designed for macOS only!"
    exit 1
fi

print_status "Checking prerequisites..."

# Check if Homebrew is installed
if ! command -v brew &> /dev/null; then
    print_warning "Homebrew not found. Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    print_success "Homebrew installed!"
else
    print_success "Homebrew is already installed"
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_warning "Node.js not found. Installing Node.js..."
    brew install node
    print_success "Node.js installed!"
else
    NODE_VERSION=$(node --version)
    print_success "Node.js is already installed: $NODE_VERSION"
fi

# Check if Git is installed
if ! command -v git &> /dev/null; then
    print_warning "Git not found. Installing Git..."
    brew install git
    print_success "Git installed!"
else
    print_success "Git is already installed"
fi

print_status "Installing npm dependencies..."
if [ -f "package.json" ]; then
    npm install
    print_success "Dependencies installed!"
else
    print_error "package.json not found. Make sure you're in the Ship-Collection-Single directory."
    exit 1
fi

# Create .env.local if it doesn't exist
if [ ! -f ".env.local" ]; then
    print_status "Creating .env.local file..."
    cat > .env.local << EOF
# MongoDB Connection String
# Replace with your actual MongoDB connection string
MONGODB_URI=mongodb://localhost:27017/ship-collection-v2

# Optional: Custom port (default is 3000)
# PORT=3001

# Node Environment
NODE_ENV=development
EOF
    print_success ".env.local created!"
    print_warning "⚠️  IMPORTANT: Edit .env.local with your MongoDB connection string!"
else
    print_success ".env.local already exists"
fi

# Create backups directory if it doesn't exist
if [ ! -d "backups" ]; then
    print_status "Creating backups directory..."
    mkdir backups
    print_success "Backups directory created!"
else
    print_success "Backups directory already exists"
fi

# Check for backup files
BACKUP_COUNT=$(ls backups/*.zip 2>/dev/null | wc -l)
if [ $BACKUP_COUNT -eq 0 ]; then
    print_warning "No backup files found in backups/ directory"
    print_status "Copy your backup ZIP files to the backups/ directory to restore your data"
else
    print_success "Found $BACKUP_COUNT backup file(s) in backups/ directory"
fi

echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "Next steps:"
echo "1. Edit .env.local with your MongoDB connection string"
echo "2. Copy your backup files to the backups/ directory (if not done already)"
echo "3. Start the application:"
echo ""
echo -e "${GREEN}   npm run dev${NC}"
echo ""
echo "4. Open your browser to: http://localhost:3000"
echo "5. Go to Database Setup to restore your data: http://localhost:3000/database-setup"
echo ""

# Ask if user wants to start the app now
read -p "Would you like to start the application now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Starting the application..."
    npm run dev
fi 