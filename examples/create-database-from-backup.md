# Create Database from Backup

This script allows you to create new MongoDB databases from existing backup files. It's perfect for:

- Setting up test environments
- Creating backup databases for safe operations
- Duplicating production data for development
- Database migration scenarios

## Features

✅ **Interactive & Non-Interactive Modes** - Use in scripts or run interactively  
✅ **Automatic Database Configuration** - Adds new databases to your config  
✅ **Connection Testing** - Verifies database connectivity before operations  
✅ **Backup Selection** - Choose from available backups or use latest  
✅ **Progress Monitoring** - Real-time restore progress updates  
✅ **Cleanup Handling** - Automatic temporary file cleanup  

## Usage

### Interactive Mode (Default)

```bash
cd scripts
node create-database-from-backup.js
```

The script will prompt you for:
- Database URI for the new database
- Database ID (unique identifier)
- Display name
- Description (optional)
- Which backup to restore from

### Non-Interactive Mode

```bash
node create-database-from-backup.js --non-interactive \
  --uri=mongodb://localhost:27017/ship-collection-test \
  --id=test-db \
  --name="Test Database" \
  --description="Test environment database"
```

### Command Line Options

| Option | Description | Example |
|--------|-------------|---------|
| `--help` | Show help message | `--help` |
| `--non-interactive` | Run without prompts | `--non-interactive` |
| `--no-config` | Don't add to database config | `--no-config` |
| `--backup=FILENAME` | Use specific backup file | `--backup=backup-2025-01-15T10-30-00.zip` |
| `--uri=URI` | Target MongoDB URI | `--uri=mongodb://localhost:27017/mydb` |
| `--id=ID` | Database configuration ID | `--id=test-db` |
| `--name=NAME` | Display name | `--name="Test Database"` |
| `--description=DESC` | Description | `--description="Development database"` |

## Examples

### 1. Create Test Database (Interactive)

```bash
node create-database-from-backup.js
```

### 2. Create Test Database (Automated)

```bash
node create-database-from-backup.js --non-interactive \
  --uri=mongodb://localhost:27017/ship-collection-test \
  --id=test-db \
  --name="Test Database"
```

### 3. Create Database from Specific Backup

```bash
node create-database-from-backup.js \
  --backup=backup-2025-01-15T10-30-00.zip \
  --uri=mongodb://localhost:27017/ship-collection-backup \
  --id=backup-db \
  --name="Backup Database"
```

### 4. Using the Example Script

```bash
# Create test database
node example-create-db.js test

# Create backup database  
node example-create-db.js backup
```

## Programmatic Usage

```javascript
const DatabaseFromBackupCreator = require('./create-database-from-backup');

async function createDatabase() {
  const creator = new DatabaseFromBackupCreator({
    interactive: false,
    targetUri: 'mongodb://localhost:27017/my-new-db',
    databaseId: 'my-db',
    databaseName: 'My Database',
    description: 'Created from backup',
    addToConfig: true
  });
  
  const result = await creator.run();
  console.log(`Database created: ${result.database.name}`);
}
```

## Requirements

- **Node.js** - Script runtime
- **MongoDB Tools** - `mongorestore` command must be available
- **unzip** - For extracting backup archives
- **MongoDB Server** - Target database server running

## Process Flow

1. **📋 Configuration** - Gather database details
2. **🔌 Connection Test** - Verify target database accessibility  
3. **📁 Backup Selection** - Choose backup file to restore
4. **📤 Extraction** - Extract backup archive
5. **✅ Validation** - Verify backup contents
6. **🗃️ Database Restore** - Restore data using mongorestore
7. **⚙️ Config Update** - Add database to configuration
8. **🧹 Cleanup** - Remove temporary files

## Database Configuration

When `addToConfig` is true (default), the script automatically adds the new database to your `database-config.json` file. This allows you to:

- Switch between databases in the UI
- Use the database with the backup/restore system
- Manage multiple database connections

## Error Handling

The script includes comprehensive error handling for:
- Invalid backup files
- Database connection failures  
- mongorestore errors
- File system issues
- User cancellation

## Security Notes

- Test database connections before proceeding
- Backup existing data before overwriting
- Use strong authentication for production databases
- Verify backup integrity before restoration

## Troubleshooting

### Common Issues

**mongorestore not found**
```bash
# Install MongoDB Tools
# macOS: brew install mongodb/brew/mongodb-database-tools
# Ubuntu: sudo apt install mongodb-database-tools
# Windows: Download from MongoDB website
```

**Connection refused**
- Ensure MongoDB server is running
- Check firewall settings
- Verify connection string format

**Permission denied**
- Check file permissions on backup directory
- Ensure user has database write permissions

**Backup extraction fails**
- Verify unzip is installed
- Check backup file integrity
- Ensure sufficient disk space

## See Also

- `backup-database.js` - Create backups
- `restore-database.js` - Restore to existing database
- Database Configuration UI in "Other Tools" 