# Auto-Restart for Next.js Development Server

This project includes an auto-restart feature that automatically cleans the Next.js cache and restarts the server after builds. This helps prevent file locking issues and keeps your development environment stable.

## How to Use

### Option 1: Use the Batch File (Recommended)

Simply double-click the `start-auto-server.bat` file in the project root directory. This will:

1. Start the Next.js development server with auto-restart enabled
2. Show server logs in the console window
3. Automatically detect when builds occur
4. Run the clean-restart script after builds to prevent file locking issues

**Note:** Keep the console window open while developing. Closing it will stop the server.

### Option 2: Use npm Script

Run the following command in your terminal:

```bash
npm run dev:auto
```

This will start the custom server with auto-restart functionality.

## How It Works

The auto-restart system:

1. Monitors the `.next` and `dev-build` directories for changes
2. Detects when a build completes
3. Automatically runs the `clean-restart.ps1` script, which:
   - Terminates all Node.js processes
   - Clears Next.js cache directories
   - Restarts the development server

## Troubleshooting

If you encounter any issues:

1. **Manual Restart:** You can always manually run `npm run clean` to clean and restart the server
2. **Check Logs:** Look at the console output for any error messages
3. **Kill Processes:** If the server seems stuck, run `taskkill /f /im node.exe` to force-terminate all Node.js processes

## Configuration

The auto-restart behavior can be configured by editing:

- `server.js` - Controls the file watching and restart logic
- `clean-restart.ps1` - Controls the cleanup and restart process

## Benefits

- Prevents file locking issues common in Next.js development
- Reduces the need for manual restarts
- Keeps the development server stable during long coding sessions
- Automatically cleans up cache files that can cause corruption 