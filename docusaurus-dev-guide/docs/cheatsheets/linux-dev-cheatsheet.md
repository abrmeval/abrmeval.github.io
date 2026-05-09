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