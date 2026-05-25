<div align="center">

<img src="https://img.shields.io/badge/DarkCyberWatch-IDS-388bfd?style=for-the-badge&logoColor=white" alt="DarkCyberWatch"/>

# DarkCyberWatch

### ML-Powered Network Intrusion Detection System

Real-time network traffic monitoring and attack detection using a Random Forest classifier trained on the CICIDS2017 dataset. Detects 14 attack types with 99.88% binary accuracy and a 1.0000 ROC-AUC score.

![Python](https://img.shields.io/badge/Python-3.11.1-3776AB?style=flat-square&logo=python&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=flat-square&logo=fastapi&logoColor=white)
![scikit-learn](https://img.shields.io/badge/scikit--learn-Random%20Forest-F7931E?style=flat-square&logo=scikit-learn&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Setup](#environment-setup)
- [Running the Project](#running-the-project)
- [Attack Detection](#attack-detection)
- [Dashboard Pages](#dashboard-pages)
- [API Reference](#api-reference)
- [Why Not Dockerized?](#why-not-dockerized)
- [Developers](#developers)

---

## Overview

DarkCyberWatch is a host-based Intrusion Detection System (IDS) that monitors live network traffic in real time, classifies each flow using a trained Random Forest model, and displays results on an interactive dashboard.

The system runs entirely on your local machine — the Python engine captures packets directly from the host network interface (the way real IDS products work), while the Next.js frontend provides a live dashboard accessible in any browser.

---

## Features

- **Live packet capture** using Scapy — monitors real network traffic on your machine
- **Binary classification** — BENIGN vs ATTACK (99.88% accuracy)
- **Multi-class classification** — identifies 14 specific attack types (99.48% accuracy)
- **Real-time dashboard** — flows, alerts, charts, and stats update live without page refresh
- **Attack simulation** — simulate 7 attack types through the real ML engine
- **Persistent session** — switching between dashboard pages never resets your data
- **Demo mode** — dashboard works with realistic simulated data when the engine is offline
- **Severity grading** — CRITICAL / HIGH / MEDIUM / LOW based on model confidence
- **Reports** — session summary with attack breakdown, exportable as `.txt`
- **Alerts management** — filter by severity and type, clear with one click

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      ML_PROJECT/                        │
│                                                         │
│  ┌──────────────────────┐   ┌──────────────────────┐   │
│  │   python-engine/     │   │    ids-nextjs/        │   │
│  │   (FastAPI :8000)    │◄──│   (Browser :3000)     │   │
│  │                      │   │                       │   │
│  │  capture.py          │   │  IDSContext.js        │   │
│  │  (Scapy live sniff)  │   │  (shared session      │   │
│  │        ↓             │   │   state — never       │   │
│  │  feature_extractor   │   │   resets on nav)      │   │
│  │  (78 CICIDS features)│   │        ↓              │   │
│  │        ↓             │   │  page.js / alerts/    │   │
│  │  predictor.py        │   │  traffic/ / reports/  │   │
│  │  (Random Forest)     │   └──────────────────────┘   │
│  │        ↓             │                               │
│  │  main.py (REST API)  │                               │
│  └──────────────────────┘                               │
│            ↑                                            │
│   Network Interface (Ethernet / Wi-Fi)                  │
└─────────────────────────────────────────────────────────┘
```

The Python engine captures raw packets from your network interface, extracts 78 CICIDS2017 features per flow, runs them through the Random Forest model, and exposes results via a REST API. The frontend polls the API every 2 seconds and renders everything live.

---

## Project Structure

```
ML_PROJECT/                             ← Root folder
│
├── ids-nextjs/                         ← Next.js frontend
│   ├── app/
│   │   ├── layout.js                   ← Root layout — IDSProvider lives here
│   │   ├── page.js                     ← Overview / main dashboard
│   │   ├── globals.css                 ← Global styles and CSS variables
│   │   ├── lib/
│   │   │   └── IDSContext.js           ← Shared React state (persists across pages)
│   │   ├── components/
│   │   │   ├── Topbar.js               ← Shared navigation bar
│   │   │   ├── StatCard.js             ← Metric card component
│   │   │   ├── AlertsFeed.js           ← Alert list component
│   │   │   ├── LiveMonitor.js          ← Traffic event component
│   │   │   ├── TrafficChart.js         ← Area chart + attack breakdown chart
│   │   │   └── SharedUI.js             ← SevBadge, PageFooter
│   │   ├── api/                        ← Next.js API routes (proxy to Python engine)
│   │   │   ├── health/route.js
│   │   │   ├── stats/route.js
│   │   │   ├── alerts/route.js
│   │   │   ├── traffic/route.js
│   │   │   ├── simulate/route.js
│   │   │   ├── predict/route.js
│   │   │   └── report/route.js
│   │   ├── alerts/page.js              ← Alerts management page
│   │   ├── traffic/page.js             ← Live traffic monitor page
│   │   └── reports/page.js             ← Session report page
│   ├── public/
│   ├── .env.local                      ← Frontend env variables (do not commit)
│   ├── .env.example                    ← Safe template to commit
│   ├── next.config.js
│   ├── package-lock.json
│   └── package.json
│
├── python-engine/                      ← ML engine + packet capture
│   ├── models/                         ← Trained model files (not in repo)
│   │   ├── binary_model.pkl            ← Not committed — too large
│   │   ├── multiclass_model.pkl        ← Not committed — too large
│   │   └── README.txt                  ← Instructions for placing model files
│   ├── capture.py                      ← Scapy live packet capture
│   ├── feature_extractor.py            ← 78-feature extraction + 7 attack simulators
│   ├── main.py                         ← FastAPI app — all API routes
│   ├── predictor.py                    ← Loads models, runs predictions
│   ├── requirements.txt                ← Python dependencies
│   ├── .env                            ← Engine env variables (do not commit)
│   └── .env.example                    ← Safe template to commit
│
├── .gitignore
└── README.md
```

---

## Prerequisites

Before you begin, make sure you have the following installed:

| Requirement | Version | Notes |
|---|---|---|
| Python | **3.11.1** | [python.org](https://python.org) — other 3.10+ versions may work |
| Node.js | 18 or higher | [nodejs.org](https://nodejs.org) |
| npm | 9 or higher | Comes with Node.js |
| Git | Any | [git-scm.com](https://git-scm.com) |
| Npcap *(Windows only)* | Latest | Required for Scapy packet capture. [npcap.com](https://npcap.com) |

> **Windows users:** Install Npcap **before** running the Python engine. Without it, live packet capture will not work. You can still use demo mode without Npcap.

> **Linux users:** You may need `sudo` for raw packet capture, or grant capabilities:
> ```bash
> sudo setcap cap_net_raw+ep $(which python3)
> ```

---

## Installation

### 1 — Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/DarkCyberWatch.git
cd DarkCyberWatch
```

### 2 — Set up the Python engine

```bash
cd python-engine

# Create a virtual environment
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate
# macOS / Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3 — Download and add your trained model files

The `.pkl` model files are not included in the repository due to their size.
Download them from the Google Drive folder and place them in `python-engine/models/`:

**Download models:** [DarkCyberWatch Models on Google Drive](https://drive.google.com/drive/folders/1gxW9z-SkuLvZXbFLdWnQHwb_ynF3j5nh)

Extract the downloaded files and place them in:

```
python-engine/
└── models/
    ├── ids_binary_model.pkl
    ├── ids_multiclass_model.pkl
    ├── label_encoder.pkl
    ├── scaler.pkl
    └── feature_cols.pkl
```

> **Note:** You must download all files from the Google Drive folder for the system to work correctly. The feature columns, scaler, and label encoder are required alongside the trained models.

### 4 — Set up the frontend

```bash
cd ../ids-nextjs

# Install Node.js dependencies
npm install
```

---

## Environment Setup

### Python engine — `python-engine/.env`

Create a `.env` file inside `python-engine/` using the template below.
A `.env.example` with these keys (no values) is included in the repo.

```env
# Python Engine Configuration
# Copy .env.example to .env and fill in your values
# Never commit .env — it is in .gitignore

# Network interface to capture on
# Windows examples: "Ethernet", "Wi-Fi", "Local Area Connection"
# Linux examples:   "eth0", "wlan0", "ens33"
# Leave empty to auto-detect
CAPTURE_INTERFACE=

# FastAPI server host and port
HOST=0.0.0.0
PORT=8000

# Must match your frontend URL exactly
CORS_ORIGIN=http://localhost:3000

# Set to "true" to enable verbose packet logging (optional)
DEBUG_CAPTURE=
```

### Frontend — `ids-nextjs/.env.local`

Create a `.env.local` file inside `ids-nextjs/` using the template below.
A `.env.example` with these keys (no values) is included in the repo.

```env
# Frontend Configuration
# Copy .env.example to .env.local and fill in your values
# Never commit .env.local — it is in .gitignore

# URL of the Python engine — change if running on a different host/port
PYTHON_ENGINE_URL=http://localhost:8000
```

---

## Running the Project

You need **two terminals** open at the same time.

### Terminal 1 — Python engine

```bash
cd python-engine

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS / Linux:
source venv/bin/activate

# Start the engine
python main.py
```

Expected output:
```
==================================================
  DarkCyberWatch — Python Engine
==================================================
✓ Binary model loaded
✓ Multi-class model loaded
🚀 Server running at http://0.0.0.0:8000
   Dashboard  → http://localhost:3000
   API docs   → http://localhost:8000/docs
```

### Terminal 2 — Frontend

```bash
cd ids-nextjs
npm run dev
```

Open **http://localhost:3000** in your browser.

---

## Attack Detection

DarkCyberWatch detects the following 14 attack types from the CICIDS2017 dataset:

| Attack Type | Category | Description |
|---|---|---|
| DoS Hulk | Denial of Service | High-rate HTTP flood using random content |
| DoS GoldenEye | Denial of Service | Slow HTTP DoS keeping connections open |
| DoS slowloris | Denial of Service | Slow header sending to exhaust server threads |
| DoS Slowhttptest | Denial of Service | Slow HTTP body DoS |
| DDoS | Distributed DoS | UDP/TCP flood from multiple sources |
| PortScan | Reconnaissance | Systematic scan of ports to find open services |
| FTP-Patator | Brute Force | Dictionary attack against FTP login |
| SSH-Patator | Brute Force | Dictionary attack against SSH login |
| Bot | Botnet | C2 communication and botnet heartbeat traffic |
| Infiltration | Internal Attack | Lateral movement inside the network |
| Web Attack – XSS | Web Attack | Cross-site scripting payload injection |
| Web Attack – Brute Force | Web Attack | HTTP login brute force |
| Web Attack – SQL Injection | Web Attack | SQL injection via HTTP requests |
| Heartbleed | Vulnerability Exploit | OpenSSL Heartbleed memory leak exploit |

### Confidence and Severity

The Random Forest outputs a confidence score representing how many of its 100 decision trees agreed on the prediction. Severity is assigned as:

| Confidence | Severity |
|---|---|
| ≥ 98% | 🔴 CRITICAL |
| ≥ 95% | 🔴 HIGH |
| ≥ 85% | 🟡 MEDIUM |
| < 85% | 🔵 LOW |

---

## Dashboard Pages

| Page | URL | Description |
|---|---|---|
| Overview | `/` | Live stat cards, traffic chart, top threats, recent alerts |
| Alerts | `/alerts` | Full alert table with severity and type filters, clear button |
| Traffic | `/traffic` | Per-flow event log with protocol filter (TCP / UDP / ICMP) |
| Reports | `/reports` | Session summary with attack breakdown, export to `.txt` |

### Demo Mode

If the Python engine is not running, the dashboard automatically enters **Demo Mode**:

- Realistic simulated traffic is generated live in the browser
- All charts, counters, and alerts update in real time
- The status dot shows **Demo mode** in the navigation bar
- Simulate Attack still works — results are pre-built (no ML runs)

Demo mode is useful for exploring the dashboard without setting up the Python engine.

---

## API Reference

Full interactive documentation is available at **http://localhost:8000/docs** when the engine is running.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Engine status, uptime, model load state |
| `POST` | `/predict` | Predict a single flow (78 features) |
| `POST` | `/predict/batch` | Predict multiple flows at once |
| `GET` | `/alerts` | Recent attack alerts (filterable by severity and type) |
| `GET` | `/stats` | Session statistics and top attack types |
| `GET` | `/traffic` | Recent captured traffic events |
| `GET` | `/report` | Full session report data |
| `POST` | `/simulate` | Simulate an attack through the ML engine |
| `GET` | `/features` | List of all 78 expected feature names |
| `GET` | `/test/benign` | Test — benign prediction |
| `GET` | `/test/dos` | Test — DoS prediction |
| `GET` | `/test/portscan` | Test — PortScan prediction |

---

## Why Not Dockerized?

DarkCyberWatch is intentionally **not containerized**, and this is by design.

IDS systems are host-based security tools built to monitor the machine they run on directly. Containerizing an IDS creates a fundamental conflict:

- **Docker on Windows** uses a WSL2 or Hyper-V virtual machine. The container sees the VM's virtual network interface — not your real Windows network. The IDS ends up monitoring traffic inside the VM rather than your actual host traffic.
- **Scapy and raw sockets** — live packet capture requires raw socket access at the OS level. On Windows and macOS, Docker containers cannot reliably access the real host network interface for raw packet sniffing.
- **Network namespace isolation** — Docker containers run in their own network namespace by default. Even with `--network host`, this only works correctly on Linux.

On Linux, Docker with `--network host` and `--cap-add NET_RAW` can technically work, but it adds unnecessary complexity since Linux already makes direct Python setup straightforward.

This is not a limitation — commercial IDS products such as Snort, Suricata, and Zeek are also not containerized in production for exactly the same reasons. Running directly on the host is the correct architecture for a network intrusion detection system.

---

## Developers

<table>
  <tr>
    <td align="center" width="50%">
      <br/>
      <b>Aftab Farhan</b>
      <br/><br/>
      <sub>ML Engineering · Model Training & Evaluation<br/>Backend Architecture · Dataset Processing</sub>
    </td>
    <td align="center" width="50%">
      <br/>
      <b>Moeez Ahmad</b>
      <br/><br/>
      <sub>Frontend Development · Dashboard & UX<br/>System Design · API Integration</sub>
    </td>
  </tr>
</table>

---

<div align="center">

**DarkCyberWatch** · Built with FastAPI, Next.js, and scikit-learn · CICIDS2017 Dataset

*Binary Accuracy: 99.88% · Multi-class Accuracy: 99.48% · ROC-AUC: 1.0000*

</div>