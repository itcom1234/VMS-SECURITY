# Autostart (Linux)

Compose services use `restart: unless-stopped` so Docker/Podman restarts containers after crashes or daemon reboots. To bring the stack up automatically when the host boots, use a **systemd user unit** with `docker compose` or `podman-compose`.

## Prerequisites

1. **Clone and configure** the repo (e.g. `~/VMS-SECURITY`), copy `.env.example` to `.env`, and build once:
   ```bash
   cd ~/VMS-SECURITY
   cp .env.example .env
   docker compose up --build -d
   ```

2. **Lingering user session** — required so user units run without an active login:
   ```bash
   loginctl enable-linger "$USER"
   ```

3. **Podman only** — enable the socket so rootless compose can talk to the daemon:
   ```bash
   systemctl --user enable --now podman.socket
   ```

## systemd user unit

Create `~/.config/systemd/user/vms-security-compose.service`:

```ini
[Unit]
Description=VMS Security Docker Compose stack
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=%h/VMS-SECURITY
Environment=COMPOSE_PROJECT_NAME=vms-security

# Docker Compose:
ExecStart=/usr/bin/docker compose up -d --remove-orphans
ExecStop=/usr/bin/docker compose down

# Podman Compose (comment Docker lines above and use these instead):
# ExecStart=/usr/bin/podman-compose up -d
# ExecStop=/usr/bin/podman-compose down

[Install]
WantedBy=default.target
```

Adjust `WorkingDirectory` if the repo is not at `~/VMS-SECURITY`. Use the full path to `docker` or `podman-compose` from `which docker` / `which podman-compose` if binaries are not under `/usr/bin`.

## Enable on boot

```bash
systemctl --user daemon-reload
systemctl --user enable --now vms-security-compose.service
systemctl --user status vms-security-compose.service
```

After a reboot, containers should be running with `restart: unless-stopped`; the unit ensures `compose up -d` runs at login/boot when nothing was left up.

## Verify

```bash
docker compose -f ~/VMS-SECURITY/docker-compose.yml ps
curl -s http://localhost:3001/health
```

## Disable autostart

```bash
systemctl --user disable --now vms-security-compose.service
```