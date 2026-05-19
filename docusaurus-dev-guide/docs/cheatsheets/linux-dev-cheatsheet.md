---
title: "Linux Commands Cheatsheet"
sidebar_label: "Linux Commands"
sidebar_position: 1
tags: [linux, cheatsheet]
---

# Linux Commands Cheatsheet for Software Developers

## Navigation & File Management

### pwd
**Print Working Directory** - Shows your current location in the filesystem
```bash
pwd
# Output: /home/username/projects
```

### ls
**List** - Displays files and directories in the current location
```bash
ls -la
# -l: long format with permissions
# -a: shows hidden files (starting with .)
# Output: drwxr-xr-x 2 user group 4096 Oct 20 14:30 myproject
```

### cd
**Change Directory** - Navigate through the filesystem
```bash
cd /var/log        # Absolute path
cd ../             # Parent directory
cd ~               # Home directory
cd -               # Previous directory
```

### mkdir
**Make Directory** - Creates new directories
```bash
mkdir project      # Single directory
mkdir -p src/components/ui  # Create parent directories as needed
```

### rm
**Remove** - Deletes files and directories
```bash
rm file.txt        # Remove file
rm -rf directory   # Force remove directory and contents
# -r: recursive, -f: force without prompting
```

### cp
**Copy** - Duplicates files or directories
```bash
cp file.txt backup.txt     # Copy file
cp -r src/ src_backup/     # Copy directory recursively
```

### mv
**Move/Rename** - Relocates or renames files and directories
```bash
mv oldname.txt newname.txt # Rename
mv file.txt /tmp/          # Move to different location
```

### touch
**Create/Update** - Creates empty files or updates timestamps
```bash
touch newfile.txt          # Create empty file
touch -t 202310201430 file.txt  # Set specific timestamp
```

### which
**Locate a Command** - Shows the full path of a command's executable
```bash
which node                 # Output: /usr/bin/node
which python3              # Locate Python 3 interpreter
which -a git               # List all matching executables in PATH
```
Use `which` to confirm which version of a tool is actually being invoked, especially when multiple versions are installed.

## File Content & Text Processing

### cat
**Concatenate** - Displays file contents
```bash
cat file.txt               # Show file content
cat file1.txt file2.txt > combined.txt  # Combine files
```

### less / more
**Pagers** - View file contents page by page
```bash
less largefile.log         # Navigate with arrows, q to quit
# / to search forward, ? to search backward
```

### head / tail
**View Beginning/End** - Shows first or last lines of a file
```bash
head -n 20 file.txt        # First 20 lines
tail -f /var/log/app.log   # Follow log file in real-time
tail -n 100 error.log      # Last 100 lines
```

### grep
**Global Regular Expression Print** - Searches text patterns
```bash
grep "error" logfile.txt   # Find lines containing "error"
grep -r "TODO" ./src       # Recursive search in directory
grep -i "warning" file.txt # Case-insensitive search
grep -n "function" code.js # Show line numbers
```

### sed
**Stream Editor** - Performs text transformations
```bash
sed 's/old/new/g' file.txt           # Replace all occurrences
sed -i 's/localhost/127.0.0.1/g' config.ini  # Edit file in-place
sed '5d' file.txt                    # Delete line 5
```

### awk
**Pattern Processing** - Powerful text processing tool
```bash
awk '{print $1, $3}' data.txt        # Print 1st and 3rd columns
awk -F',' '{sum+=$2} END {print sum}' data.csv  # Sum 2nd column in CSV
awk '/error/ {count++} END {print count}' log.txt  # Count error lines
```

### cut
**Extract Columns** - Cuts out sections from each line
```bash
cut -d',' -f2 data.csv     # Extract 2nd field from CSV
cut -c1-10 file.txt        # Extract characters 1-10
```

### sort / uniq
**Sort and Deduplicate** - Orders lines and removes duplicates
```bash
sort file.txt              # Sort alphabetically
sort -n numbers.txt        # Numeric sort
sort file.txt | uniq       # Remove duplicate lines
sort file.txt | uniq -c    # Count occurrences
```

## File Permissions & Ownership

### chmod
**Change Mode** - Modifies file permissions
```bash
chmod 755 script.sh        # rwxr-xr-x (owner:rwx, group:rx, others:rx)
chmod +x deploy.sh         # Add execute permission
chmod -R 644 ./docs        # Recursive permission change
```

### chown
**Change Owner** - Changes file ownership
```bash
chown user:group file.txt  # Change owner and group
chown -R www-data:www-data /var/www  # Recursive ownership change
```

### umask
**User Mask** - Sets default permissions for new files
```bash
umask 022                  # Default: files 644, directories 755
umask 077                  # Restrictive: files 600, directories 700
```

## Process Management

### ps
**Process Status** - Shows running processes
```bash
ps aux                     # All processes with detailed info
ps -ef | grep python       # Find Python processes
ps -p 1234                 # Info about specific PID
```

### top / htop
**Process Monitor** - Real-time process viewer
```bash
top                        # Dynamic process view
htop                       # Enhanced interactive viewer (if installed)
# Press 'k' to kill, 'q' to quit
```

### kill / killall
**Terminate Processes** - Stops running processes
```bash
kill 1234                  # Terminate process by PID
kill -9 1234              # Force kill (SIGKILL)
killall node              # Kill all processes with name
```

### jobs / bg / fg
**Job Control** - Manage background tasks
```bash
command &                  # Run in background
jobs                      # List background jobs
fg %1                     # Bring job 1 to foreground
bg %2                     # Resume job 2 in background
Ctrl+Z                    # Suspend current process
```

### nohup
**No Hangup** - Run commands immune to hangups
```bash
nohup python script.py &   # Continue running after logout
nohup ./server.sh > output.log 2>&1 &  # Redirect output
```

## Network & Connectivity

### curl
**Client URL** - Transfer data from/to servers
```bash
curl https://api.example.com/data    # GET request
curl -X POST -d '{"key":"value"}' -H "Content-Type: application/json" https://api.example.com/endpoint
curl -o file.zip https://example.com/file.zip  # Download file
```

### wget
**Web Get** - Download files from the web
```bash
wget https://example.com/file.tar.gz
wget -r -np https://example.com/docs/  # Recursive download
wget -c https://large-file.iso         # Resume interrupted download
```

### ssh
**Secure Shell** - Remote server access
```bash
ssh user@server.com        # Connect to remote server
ssh -p 2222 user@host      # Custom port
ssh -i ~/.ssh/key.pem user@server  # Use specific key
```

### scp
**Secure Copy** - Transfer files over SSH
```bash
scp file.txt user@server:/path/to/dest/
scp -r directory/ user@server:/backup/
scp user@server:/remote/file.txt ./local/
```

### rsync
**Remote Sync** - Efficient file synchronization
```bash
rsync -avz source/ dest/   # Archive mode with compression
rsync -avz --delete source/ user@server:/backup/  # Mirror directories
rsync --exclude='*.log' source/ dest/  # Exclude patterns
```

### netstat / ss
**Network Statistics** - Display network connections
```bash
netstat -tuln              # Show listening ports
ss -tuln                   # Modern alternative to netstat
netstat -anp | grep :8080  # Find what's using port 8080
```

### ping
**Network Connectivity Test** - Check if host is reachable
```bash
ping google.com            # Test connection
ping -c 4 192.168.1.1     # Send 4 packets only
```

## Archive & Compression

### tar
**Tape Archive** - Bundle files together
```bash
tar -czf archive.tar.gz directory/    # Create compressed archive
tar -xzf archive.tar.gz               # Extract compressed archive
tar -tvf archive.tar                  # List contents without extracting
```

### zip / unzip
**ZIP Archives** - Create and extract ZIP files
```bash
zip -r project.zip project/           # Create ZIP archive
unzip project.zip                     # Extract ZIP
unzip -l archive.zip                  # List contents
```

### gzip / gunzip
**GNU Zip** - Compress/decompress single files
```bash
gzip file.txt              # Creates file.txt.gz
gunzip file.txt.gz         # Decompress
gzip -k file.txt           # Keep original file
```

## System Information

### df
**Disk Free** - Display filesystem disk space
```bash
df -h                      # Human-readable format
df -i                      # Show inode information
```

### du
**Disk Usage** - Show directory space usage
```bash
du -sh /var/log            # Summary of directory size
du -h --max-depth=1        # Size of subdirectories
du -ah | sort -rh | head -10  # Find 10 largest files/dirs
```

### free
**Memory Usage** - Display RAM usage
```bash
free -h                    # Human-readable memory info
free -m                    # Display in megabytes
```

### uname
**System Information** - Display system details
```bash
uname -a                   # All system information
uname -r                   # Kernel version
```

### lsof
**List Open Files** - Shows files in use by processes
```bash
lsof -i :8080              # What's using port 8080
lsof -u username           # Files opened by user
lsof +D /var/log           # Files open in directory
```

## Version Control (Git)

### git init / clone
**Initialize/Copy Repository**
```bash
git init                   # Create new repository
git clone https://github.com/user/repo.git
```

### git add / commit
**Stage and Save Changes**
```bash
git add .                  # Stage all changes
git add -p                 # Interactive staging
git commit -m "Fix bug in authentication"
```

### git branch / checkout
**Manage Branches**
```bash
git branch feature-login   # Create branch
git checkout -b bugfix     # Create and switch
git branch -d old-branch   # Delete branch
```

### git merge / rebase
**Integrate Changes**
```bash
git merge feature-branch   # Merge branch
git rebase main           # Rebase current branch onto main
git rebase -i HEAD~3      # Interactive rebase last 3 commits
```

### git stash
**Temporary Storage**
```bash
git stash                  # Save current changes
git stash pop             # Apply and remove stash
git stash list            # Show all stashes
```

## Package Management

### apt (Debian/Ubuntu)
**Advanced Package Tool**
```bash
sudo apt update            # Update package list
sudo apt install nginx     # Install package
sudo apt upgrade          # Upgrade all packages
sudo apt remove package   # Remove package
```

### yum/dnf (RedHat/Fedora)
**Yellowdog Updater Modified / Dandified YUM**
```bash
sudo yum install package   # Install package
sudo dnf update           # Update all packages
sudo dnf search keyword   # Search for packages
```

### npm (Node.js)
**Node Package Manager**
```bash
npm install express        # Install package
npm install -g nodemon    # Global installation
npm list                  # List installed packages
npm update                # Update packages
```

### pip (Python)
**Python Package Installer**
```bash
pip install requests       # Install package
pip install -r requirements.txt  # Install from file
pip freeze > requirements.txt    # Export dependencies
```

## Environment & Variables

### export
**Set Environment Variables**
```bash
export PATH=$PATH:/new/path
export NODE_ENV=production
export DATABASE_URL="postgresql://localhost/mydb"
```

### env / printenv
**Display Environment Variables**
```bash
env                        # Show all variables
printenv PATH             # Show specific variable
```

### source
**Execute Script in Current Shell**
```bash
source ~/.bashrc           # Reload shell configuration
source venv/bin/activate   # Activate Python virtual environment
. script.sh               # Alternative syntax
```

## Advanced Text Processing

### find
**Search for Files** - Locate files based on criteria
```bash
find . -name "*.log"       # Find by name pattern
find /tmp -mtime +7 -delete  # Delete files older than 7 days
find . -type f -size +100M   # Files larger than 100MB
find . -perm 777          # Files with specific permissions
```

### xargs
**Build Command Lines** - Pass output as arguments
```bash
find . -name "*.tmp" | xargs rm  # Delete all .tmp files
echo "file1 file2" | xargs -n1 -I{} cp {} backup/  # Copy files
ls *.txt | xargs -I{} mv {} {}.bak  # Rename files
```

### tee
**Split Output** - Send output to file and stdout
```bash
command | tee output.log   # Save and display
command | tee -a log.txt   # Append to file
```

## Docker Commands

### docker run
**Create and Start Container**
```bash
docker run -d -p 8080:80 nginx  # Detached with port mapping
docker run -it ubuntu bash      # Interactive with terminal
docker run -v /host:/container image  # With volume mount
```

### docker ps / images
**List Containers and Images**
```bash
docker ps                  # Running containers
docker ps -a              # All containers
docker images             # List images
```

### docker exec
**Execute Command in Container**
```bash
docker exec -it container_id bash  # Interactive shell
docker exec container_id ls -la    # Run command
```

### docker-compose
**Multi-container Applications**
```bash
docker-compose up -d       # Start services
docker-compose down       # Stop and remove
docker-compose logs -f    # Follow logs
```

## System Monitoring & Performance

### iostat
**I/O Statistics** - Monitor disk I/O
```bash
iostat -x 2               # Extended stats every 2 seconds
iostat -d                 # Device statistics only
```

### vmstat
**Virtual Memory Statistics** - System performance
```bash
vmstat 2                  # Update every 2 seconds
vmstat -s                 # Memory statistics summary
```

### strace
**System Call Tracer** - Debug process system calls
```bash
strace ls                 # Trace ls command
strace -p 1234           # Attach to running process
strace -e open,read command  # Filter specific calls
```

### tcpdump
**Network Packet Analyzer** - Capture network traffic
```bash
sudo tcpdump -i eth0      # Capture on interface
sudo tcpdump port 80      # Capture HTTP traffic
sudo tcpdump -w capture.pcap  # Save to file
```

## Shell Scripting Essentials

### Shebang
**Script Interpreter Declaration**
```bash
#!/bin/bash               # Bash script
#!/usr/bin/env python3    # Python script
```

### Variables and Conditionals
```bash
NAME="John"
if [ "$NAME" = "John" ]; then
    echo "Hello John"
elif [ -z "$NAME" ]; then
    echo "Name is empty"
else
    echo "Hello $NAME"
fi
```

### Loops
```bash
# For loop
for file in *.txt; do
    echo "Processing $file"
done

# While loop
while read line; do
    echo "Line: $line"
done < input.txt
```

### Functions
```bash
function deploy() {
    echo "Deploying to $1"
    ssh user@$1 "cd /app && git pull"
}
deploy "server.example.com"
```

### Variable Naming Conventions
Bash has no enforced naming rules, but following conventions makes scripts readable and maintainable.

| Scope | Convention | Example |
|---|---|---|
| Local variable | `snake_case` | `file_count`, `user_name` |
| Environment / exported | `UPPER_SNAKE_CASE` | `DATABASE_URL`, `NODE_ENV` |
| Constants (readonly) | `UPPER_SNAKE_CASE` | `readonly MAX_RETRIES=3` |
| Loop variables | Short `snake_case` | `file`, `line`, `item` |
| Private / internal | Leading underscore | `_tmp_dir` |

```bash
# Good: clear, consistent naming
readonly MAX_RETRIES=3
output_dir="/tmp/results"
user_input=""

# Declare local variables inside functions to avoid polluting global scope
function process_file() {
    local file_path="$1"       # local prevents leaking into global scope
    local line_count
    line_count=$(wc -l < "$file_path")
    echo "Lines: $line_count"
}

# Environment variables are UPPER_SNAKE_CASE
export APP_ENV="production"
export DB_HOST="localhost"
```

- Always **quote variables**: `"$var"` prevents word-splitting on values with spaces.
- Prefer `local` inside functions to limit scope.
- Use `readonly` for values that must not change after assignment.

### Reading User Input
```bash
# Basic prompt
read -p "Enter your name: " user_name
echo "Hello, $user_name"

# Silent input (e.g. passwords)
read -s -p "Password: " password
echo ""  # newline after silent input

# With a timeout (5 seconds)
read -t 5 -p "Continue? [y/n]: " answer || answer="n"

# Read multiple values at once
read -p "Enter first and last name: " first_name last_name
echo "First: $first_name, Last: $last_name"

# Validate input
read -p "Enter a number: " num
if ! [[ "$num" =~ ^[0-9]+$ ]]; then
    echo "Error: not a number" >&2
    exit 1
fi
```

### Reading from a File
```bash
# Read line by line (recommended — handles spaces correctly)
while IFS= read -r line; do
    echo "Line: $line"
done < input.txt

# IFS=  : preserves leading/trailing whitespace
# -r    : disables backslash interpretation

# Read file into an array
mapfile -t lines < input.txt
echo "Total lines: ${#lines[@]}"
echo "First line: ${lines[0]}"

# Process CSV (split on comma)
while IFS=',' read -r name age city; do
    echo "Name=$name Age=$age City=$city"
done < data.csv

# Skip the header line of a file
tail -n +2 data.csv | while IFS=',' read -r name age city; do
    echo "$name is $age years old"
done
```

### Command Line Arguments
```bash
#!/bin/bash
# $0  : script name
# $1..$N : positional arguments
# $#  : number of arguments
# $@  : all arguments as separate words
# $*  : all arguments as a single string

echo "Script: $0"
echo "First arg: $1"
echo "All args: $@"
echo "Arg count: $#"

# Guard: require at least one argument
if [ "$#" -lt 1 ]; then
    echo "Usage: $0 <environment> [--dry-run]" >&2
    exit 1
fi

# Named flags with getopts (built-in)
while getopts ":e:v" opt; do
    case $opt in
        e) environment="$OPTARG" ;;  # -e production
        v) verbose=true ;;           # -v flag
        :) echo "Option -$OPTARG requires an argument." >&2; exit 1 ;;
        \?) echo "Unknown option: -$OPTARG" >&2; exit 1 ;;
    esac
done

# Shift past the parsed options to access remaining args
shift $((OPTIND - 1))
```

### Case Statements
**`case`** is the idiomatic Bash way to branch on a string value — cleaner than a chain of `elif`.

```bash
#!/bin/bash
day=$(date +%A)

case "$day" in
    Monday|Tuesday|Wednesday|Thursday|Friday)
        echo "Weekday"
        ;;
    Saturday|Sunday)
        echo "Weekend"
        ;;
    *)
        echo "Unknown day: $day"
        ;;
esac
```

**Practical example — dispatch on a CLI argument:**
```bash
#!/bin/bash
command="$1"

case "$command" in
    start)
        echo "Starting service..."
        systemctl start myapp
        ;;
    stop)
        echo "Stopping service..."
        systemctl stop myapp
        ;;
    restart)
        systemctl restart myapp
        ;;
    status)
        systemctl status myapp
        ;;
    "")
        echo "Usage: $0 {start|stop|restart|status}" >&2
        exit 1
        ;;
    *)
        echo "Unknown command: $command" >&2
        exit 1
        ;;
esac
```

- Each pattern ends with `)`.
- `;;` terminates each branch (like `break` in C `switch`).
- `|` separates multiple patterns in one branch.
- `*)` is the catch-all default.

## Scheduling Scripts with Cron

**Cron** is the standard Unix job scheduler. It runs commands or scripts automatically on a defined schedule.

### Cron Syntax
```
┌───────────── minute        (0–59)
│ ┌─────────── hour          (0–23)
│ │ ┌───────── day of month  (1–31)
│ │ │ ┌─────── month         (1–12 or JAN–DEC)
│ │ │ │ ┌───── day of week   (0–7, 0 and 7 = Sunday, or SUN–SAT)
│ │ │ │ │
* * * * *  command_to_run
```

**Common schedule examples:**
```bash
# Every minute
* * * * * /path/to/script.sh

# Every day at 2:30 AM
30 2 * * * /path/to/backup.sh

# Every Monday at midnight
0 0 * * 1 /path/to/weekly-report.sh

# Every 15 minutes
*/15 * * * * /path/to/health-check.sh

# First day of every month at 6 AM
0 6 1 * * /path/to/monthly-cleanup.sh

# Weekdays at 8 AM
0 8 * * 1-5 /path/to/workday-task.sh
```

**Special strings (shortcuts):**
```bash
@reboot   # Run once at system startup
@hourly   # Equivalent to: 0 * * * *
@daily    # Equivalent to: 0 0 * * *
@weekly   # Equivalent to: 0 0 * * 0
@monthly  # Equivalent to: 0 0 1 * *
@yearly   # Equivalent to: 0 0 1 1 *
```

### crontab
**Manage Per-User Cron Jobs**
```bash
crontab -e               # Edit your crontab (opens in $EDITOR)
crontab -l               # List current user's cron jobs
crontab -r               # Remove all cron jobs for current user
crontab -u username -l   # List another user's cron jobs (root only)
```

**Best practices for cron jobs:**
```bash
# Always use absolute paths — cron runs with a minimal PATH
30 2 * * * /usr/bin/python3 /home/user/scripts/backup.py

# Redirect output to a log file to capture errors
0 * * * * /home/user/scripts/hourly.sh >> /var/log/hourly.log 2>&1

# Suppress output entirely (if you don't need logs)
*/5 * * * * /home/user/scripts/silent.sh > /dev/null 2>&1

# Set environment variables at the top of the crontab
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin
MAILTO=admin@example.com   # Email output to this address
```

**System-wide cron directories** (no crontab editing required):
```bash
/etc/cron.d/        # Drop-in cron files with user field
/etc/cron.daily/    # Scripts run daily
/etc/cron.hourly/   # Scripts run hourly
/etc/cron.weekly/   # Scripts run weekly
/etc/cron.monthly/  # Scripts run monthly
```

## Debug and Troubleshoot Bash Scripts

### Shell Debug Options
```bash
#!/bin/bash
set -x    # Print each command before executing it (xtrace)
set -e    # Exit immediately if a command fails
set -u    # Treat unset variables as errors
set -o pipefail  # Catch errors in pipelines (not just the last command)

# Combine all four — recommended for robust scripts
set -euxo pipefail
```

**Enable/disable xtrace around a specific block:**
```bash
set -x
# ... commands to trace ...
set +x   # Disable xtrace
```

**Run a script with debug flags without editing it:**
```bash
bash -x script.sh          # Trace every command
bash -n script.sh          # Syntax check only — does not execute
bash -v script.sh          # Print lines as they are read
```

### Inspecting Variables
```bash
# Print variable value and type
echo "value='$my_var'"
declare -p my_var          # Shows type flags: -i (integer), -a (array), etc.

# Check if a variable is set
if [ -z "${my_var+x}" ]; then
    echo "my_var is unset"
else
    echo "my_var='$my_var'"
fi
```

### Trapping Errors
```bash
#!/bin/bash
set -euo pipefail

# Run cleanup on exit (success or failure)
cleanup() {
    echo "Cleaning up temp files..."
    rm -f /tmp/script_tmp_*
}
trap cleanup EXIT

# Print which line caused an error
trap 'echo "Error on line $LINENO" >&2' ERR

# Debug: print every command with line number
export PS4='+(${BASH_SOURCE}:${LINENO}): '
set -x
```

### Checking Exit Codes
```bash
# Every command returns an exit code: 0 = success, non-zero = failure
ls /nonexistent
echo "Exit code: $?"      # $? holds the last command's exit code

# Explicit error handling without set -e
if ! cp source.txt dest.txt; then
    echo "Copy failed" >&2
    exit 1
fi

# Run a command and capture both output and exit code
output=$(some_command 2>&1) || {
    echo "Command failed: $output" >&2
    exit 1
}
```

### Common Pitfalls
```bash
# WRONG: unquoted variable — breaks on spaces or globs
for file in $files; do ...

# CORRECT: quoted
for file in "$files"; do ...
# Or better — use an array:
declare -a files=("file one.txt" "file two.txt")
for file in "${files[@]}"; do ...

# WRONG: comparing integers with string operator
if [ "$count" = "10" ]; then ...

# CORRECT: use -eq for integers
if [ "$count" -eq 10 ]; then ...

# WRONG: piping to read loses variables (subshell issue)
cat file.txt | while read line; do total=$((total+1)); done
echo "$total"  # Always prints 0

# CORRECT: use process substitution or redirect
while IFS= read -r line; do total=$((total+1)); done < file.txt
echo "$total"  # Correct count
```

### Logging Helper Pattern
```bash
#!/bin/bash
readonly LOG_FILE="/var/log/myscript.log"

log()   { echo "[$(date '+%F %T')] INFO  $*" | tee -a "$LOG_FILE"; }
warn()  { echo "[$(date '+%F %T')] WARN  $*" | tee -a "$LOG_FILE" >&2; }
error() { echo "[$(date '+%F %T')] ERROR $*" | tee -a "$LOG_FILE" >&2; }

log "Script started"
warn "Disk usage above 80%"
error "Database connection failed"; exit 1
```

## Useful Combinations & Pipelines

### Log Analysis Pipeline
```bash
# Find top 10 IP addresses in access log
cat access.log | awk '{print $1}' | sort | uniq -c | sort -rn | head -10

# Count error types in log file
grep ERROR app.log | awk '{print $5}' | sort | uniq -c | sort -rn

# Monitor log file and highlight errors
tail -f application.log | grep --color=auto -E "ERROR|WARNING"
```

### Process Management Pipeline
```bash
# Kill all processes matching pattern
ps aux | grep 'pattern' | grep -v grep | awk '{print $2}' | xargs kill

# Find memory-hungry processes
ps aux | sort -nrk 4 | head -10
```

### File Search and Replace
```bash
# Recursive find and replace in files
find . -type f -name "*.txt" -exec sed -i 's/old/new/g' {} +

# Find files modified in last 24 hours
find . -type f -mtime -1 -ls
```

### Backup Script Example
```bash
#!/bin/bash
BACKUP_DIR="/backup"
DATE=$(date +%Y%m%d_%H%M%S)
tar -czf "$BACKUP_DIR/backup_$DATE.tar.gz" /important/data/
find "$BACKUP_DIR" -name "backup_*.tar.gz" -mtime +30 -delete
```

## Shell History

### history
**Command History** - Displays previously run commands
```bash
history                    # Show all recorded commands with line numbers
history 20                 # Show last 20 commands
history -c                 # Clear the current session history
history -w                 # Write current history to ~/.bash_history
```

**Re-run commands from history:**
```bash
!!                         # Repeat the last command
!42                        # Run command number 42 from history
!grep                      # Run the most recent command starting with "grep"
^old^new                   # Repeat last command replacing "old" with "new"
```

**Search history interactively:**
```bash
# Press Ctrl+R and start typing to search backwards through history
# Press Ctrl+R again to cycle through matches
# Press Enter to execute, or Ctrl+G to cancel
```

**History configuration in `~/.bashrc`:**
```bash
HISTSIZE=10000             # Number of commands kept in memory
HISTFILESIZE=20000         # Number of commands saved to disk
HISTCONTROL=ignoredups     # Don't record duplicate consecutive commands
HISTTIMEFORMAT="%F %T "   # Prepend timestamp to each entry
```

## Tips for Developers

1. **Use aliases** for frequently used commands:
   ```bash
   alias ll='ls -la'
   alias gs='git status'
   alias dc='docker-compose'
   ```

2. **Master keyboard shortcuts**:
   - `Ctrl+R`: Reverse search command history
   - `Ctrl+L`: Clear screen
   - `Ctrl+A/E`: Jump to beginning/end of line
   - `Ctrl+K/U`: Cut from cursor to end/beginning

3. **Use command substitution**:
   ```bash
   echo "Current date: $(date)"
   files_count=`ls | wc -l`
   ```

4. **Redirect and append output**:
   ```bash
   command > output.txt    # Overwrite
   command >> output.txt   # Append
   command 2>&1           # Redirect stderr to stdout
   command &> all.txt     # Redirect both
   ```

5. **Use process substitution**:
   ```bash
   diff <(ls dir1) <(ls dir2)  # Compare directory listings
   ```

Remember: Always use `man command` or `command --help` to explore more options for any command!