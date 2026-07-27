# File Transfer Commands & VPS Setup

Quick reference for copying files from your local PC to a VPS and managing your server.

---

## `scp` — Secure Copy

Simple and straightforward file transfer over SSH. No extra setup needed but copies everything including `node_modules`.

```bash
scp -r folder root@IP:/root/
```

### Where to run this

Run this command on your **local PC**, from the **parent folder** of the folder you want to copy.

For example if your structure is:

```
my-project/
└── folder/
```

You should be inside `my-project/` when you run the command.

### VPS destination

- If the destination folder **does not exist** — `scp` will create it and dump the contents inside it.
- If the destination folder **already exists** — `scp` copies the folder itself inside the destination, creating a nested folder.

```bash
# To avoid nesting issues, always point to the parent folder
scp -r folder root@IP:/root/
# Result: /root/folder/ ✅
```

### Trailing slash on source

> ⚠️ **Do not rely on trailing slash with `scp`** — its behavior is inconsistent and depends on the OpenSSH version installed. Unlike `rsync`, trailing slash on `scp` source is unreliable. Always use without trailing slash and point to the parent folder.

| Command                                    | Result                                                                       |
| ------------------------------------------ | ---------------------------------------------------------------------------- |
| `scp -r dist root@IP:/root/your-project/`  | copies `dist` folder itself into destination → `/root/your-project/dist/` ✅ |
| `scp -r dist/ root@IP:/root/your-project/` | unpredictable — may copy contents OR nest the folder ⚠️                      |

**Always use this safe pattern:**

```bash
# First time or updating — always point to parent
scp -r dist root@IP:/root/your-project/
```

### Common uses

```bash
# Copy a folder (safest pattern)
scp -r folder root@IP:/root/

# Copy a single file
scp file.txt root@IP:/root/

# Copy from VPS to local PC
scp root@IP:/root/file.txt ./
```

> ⚠️ `scp` has no `--exclude` option — it copies everything including `node_modules`. Use `rsync` instead when you need to exclude folders.

---

## `rsync` — Smart File Sync

Smarter than `scp` — can exclude folders, only transfers changed files, and is faster for large transfers.

```bash
# First install rsync on VPS
sudo apt install rsync -y

# On Windows, open WSL Ubuntu
wsl -d Ubuntu

# Then run from your project parent folder
rsync -av --exclude='node_modules' backend-folder/ root@IP:/root/backend-folder/
```

### Where to run this

Run this command on your **local PC**, from the **parent folder** of `backend-folder`.

For example if your structure is:

```
my-project/
└── backend-folder/
```

You should be inside `my-project/` when you run the command.

### VPS destination

- The destination folder **does not need to exist** — `rsync` will create it automatically.
- If it already exists, `rsync` will **merge** the files into it, not overwrite the whole folder.
- If you want a clean copy, delete the folder on VPS first:

```bash
rm -rf /root/backend-folder
```

### Flag Breakdown

| Part                            | Meaning                                                      |
| ------------------------------- | ------------------------------------------------------------ |
| `rsync`                         | the tool                                                     |
| `-a`                            | archive mode — preserves permissions, timestamps, symlinks   |
| `-v`                            | verbose — shows each file being transferred                  |
| `--exclude='node_modules'`      | skip the node_modules folder                                 |
| `backend-folder/`               | source — trailing `/` copies contents, not the folder itself |
| `root@IP:/root/backend-folder/` | destination on VPS — `user@ip:path`                          |

### Trailing slash on source

> ⚠️ Unlike `scp`, `rsync` **does respect** the trailing slash on the source — and it is consistent and reliable.

| Command                                   | Result                                                                      |
| ----------------------------------------- | --------------------------------------------------------------------------- |
| `rsync -av folder/ root@IP:/root/folder/` | copies **contents** into destination ✅                                     |
| `rsync -av folder root@IP:/root/folder/`  | copies the **folder itself** inside destination → `/root/folder/folder/` ⚠️ |

---

## Nginx — Reverse Proxy Config

Routes incoming traffic from a domain/path to your Express app running on a port.

### Config file location

```bash
/etc/nginx/sites-available/myapp
```

### Open the config file

```bash
nano /etc/nginx/sites-available/myapp
```

### Single Express app on a domain

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
    }
}
```

### Multiple Express apps on same domain (path based)

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location /api {
        proxy_pass http://localhost:3000;
    }

    location /crm {
        proxy_pass http://localhost:4000;
    }

    location /shop {
        proxy_pass http://localhost:5000;
    }
}
```

### React app (static files)

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    root /root/your-repo/client/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

> ⚠️ `try_files $uri $uri/ /index.html` is the correct config for React — it first tries to serve the file, then as a directory, then falls back to `index.html` so React Router can handle the route. Without this, refreshing any route other than `/` returns a 404.

### React app on a subdomain

```nginx
server {
    listen 80;
    server_name app.yourdomain.com;

    root /root/your-repo/client/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### HTML website (no React Router)

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    root /root/your-folder;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }
}
```

> ⚠️ HTML sites use `=404` instead of `/index.html` — there is no client side routing so a missing file should return a real 404.

### Apply changes

```bash
# Test config for syntax errors
nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

> ⚠️ Always run `nginx -t` before restarting — if the config has errors, restarting will bring down all your sites.

### Ports explained

| Port | Protocol | Meaning                          |
| ---- | -------- | -------------------------------- |
| 80   | HTTP     | unencrypted, default web traffic |
| 443  | HTTPS    | encrypted, secure web traffic    |

### SSL with Certbot

After setting up the Nginx config, get a free SSL certificate:

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com
```

Certbot automatically updates your Nginx config to:

- Add port 443 with SSL certificates
- Redirect all port 80 traffic to port 443

Your config becomes something like:

```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;

    # SSL certificates managed by Certbot
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
    }
}

server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$host$request_uri;  # redirect HTTP → HTTPS
}
```

> ⚠️ Never manually edit the SSL section — Certbot manages it. Only edit the `location` blocks.

### Test auto-renewal

SSL certificates expire every 90 days. Certbot auto-renews them. Test it with:

```bash
sudo certbot renew --dry-run
```

---

## PM2 — Process Manager

Keeps your Node.js app running in the background, restarts on crashes, and survives VPS reboots.

### Install

```bash
npm install -g pm2
```

### Basic commands

```bash
# Start an app
pm2 start npm --name app-name -- start

# Start a specific file
pm2 start index.js --name app-name

# List all running apps
pm2 list

# Restart an app
pm2 restart app-name

# Stop an app
pm2 stop app-name

# Delete an app from PM2
pm2 delete app-name

# View logs
pm2 logs app-name

# View last 50 lines of logs
pm2 logs app-name --lines 50

# Monitor CPU and memory
pm2 monit
```

### Auto-start on VPS reboot

Run this once after setting up PM2:

```bash
pm2 startup
```

Copy and run the command it outputs — it will look something like this (your path will vary):

```bash
sudo env PATH=$PATH:/root/.nvm/versions/node/v22.22.2/bin pm2 startup systemd -u root --hp /root
```

Then save the current process list:

```bash
pm2 save
```

> ⚠️ Always run `pm2 save` after starting, stopping, or deleting any app — otherwise changes won't survive a reboot.

### Ecosystem file

Instead of starting apps manually with long commands, an ecosystem file lets you define all your app's config in one place and start it with a single command.

Create `ecosystem.config.js` in your project root:

```javascript
module.exports = {
  apps: [
    {
      name: "app-name", // PM2 process name
      script: "src/index.js", // entry file relative to cwd
      cwd: "/root/your-project-folder", // absolute path to project root — required!
      max_restarts: 5, // stop restarting after 5 consecutive crashes
      min_uptime: "10s", // app must stay up 10s to count as a successful start
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
```

- `cwd` is required — without it PM2 may not find your entry file if started from a different directory
- `max_restarts` prevents an infinite crash loop from hammering your server
- `min_uptime` prevents PM2 from counting a crash as a successful restart
- `env` block injects environment variables directly into the app — this is **in addition to** your `.env` file, not a replacement. Your app still needs `dotenv` to load `.env` values

Start with ecosystem file:

```bash
pm2 start ecosystem.config.js
pm2 save
```

### After updating Node.js version

PM2 links to the Node binary it was installed with. After switching Node versions via NVM, you must redo the startup script:

```bash
sudo rm /usr/local/bin/pm2   # remove old pm2 binary if it exists
npm install -g pm2
pm2 startup                  # re-run and copy the output command
pm2 save
```

> ⚠️ With NVM, the PM2 path changes every time you update Node — always redo `pm2 startup` after a Node version change and run the command it outputs.

> ⚠️ Run `pm2 info app-name` and check the `node.js version` field to confirm your app is running on the correct Node version.

---

### Common PM2 problems and fixes

**App not starting after reboot**

`pm2 save` was not run or `pm2 startup` was not set up properly.

```bash
pm2 startup
# run the command it outputs
pm2 save
```

---

**App shows `errored` status in `pm2 list`**

App crashed on startup. Check logs to find the error:

```bash
pm2 logs app-name --lines 50
```

Common causes:

- Missing `.env` variables
- Port already in use
- Syntax error in code
- Missing `node_modules` — run `npm install`

---

**App running on wrong Node version after NVM update**

Check with:

```bash
pm2 info app-name  # look for node.js version field
```

Fix:

```bash
pm2 delete app-name
pm2 start ecosystem.config.js  # or your start command
pm2 startup                    # redo startup — path changes with every Node update
pm2 save
```

---

**`pm2` command not found after NVM install**

PM2 was installed under old Node. Reinstall under NVM:

```bash
sudo rm /usr/local/bin/pm2
npm install -g pm2
```

---

**`pm2 save` not persisting after reboot**

`pm2 startup` was never run or the output command was not executed.

```bash
pm2 startup
# copy and run the command it outputs
pm2 save
```

---

**App keeps restarting in a loop**

Hit `max_restarts` limit due to a crash. Check logs:

```bash
pm2 logs app-name --lines 100
```

Fix the underlying error, then restart:

```bash
pm2 restart app-name
```

---

**Port already in use error**

Another process is using the same port. Find and kill it:

```bash
sudo ss -tlnp | grep 3000
kill -9 <PID>
```

Then restart your app:

```bash
pm2 restart app-name
```

---

**`pm2 list` shows app as `online` but getting 502 in browser**

App started but crashed immediately after. Memory shows `0b` in `pm2 list`. Check logs:

```bash
pm2 logs app-name --lines 50
```

---

**Changes to `.env` not taking effect**

PM2 does not watch `.env` files. Always restart after changing env variables:

```bash
pm2 restart app-name
```
