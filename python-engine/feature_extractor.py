import numpy as np

FEATURE_NAMES = [
    "Destination Port", "Flow Duration", "Total Fwd Packets",
    "Total Backward Packets", "Total Length of Fwd Packets",
    "Total Length of Bwd Packets", "Fwd Packet Length Max",
    "Fwd Packet Length Min", "Fwd Packet Length Mean",
    "Fwd Packet Length Std", "Bwd Packet Length Max",
    "Bwd Packet Length Min", "Bwd Packet Length Mean",
    "Bwd Packet Length Std", "Flow Bytes/s", "Flow Packets/s",
    "Flow IAT Mean", "Flow IAT Std", "Flow IAT Max", "Flow IAT Min",
    "Fwd IAT Total", "Fwd IAT Mean", "Fwd IAT Std", "Fwd IAT Max",
    "Fwd IAT Min", "Bwd IAT Total", "Bwd IAT Mean", "Bwd IAT Std",
    "Bwd IAT Max", "Bwd IAT Min", "Fwd PSH Flags", "Bwd PSH Flags",
    "Fwd URG Flags", "Bwd URG Flags", "Fwd Header Length",
    "Bwd Header Length", "Fwd Packets/s", "Bwd Packets/s",
    "Min Packet Length", "Max Packet Length", "Packet Length Mean",
    "Packet Length Std", "Packet Length Variance", "FIN Flag Count",
    "SYN Flag Count", "RST Flag Count", "PSH Flag Count",
    "ACK Flag Count", "URG Flag Count", "CWE Flag Count",
    "ECE Flag Count", "Down/Up Ratio", "Average Packet Size",
    "Avg Fwd Segment Size", "Avg Bwd Segment Size",
    "Fwd Header Length.1", "Fwd Avg Bytes/Bulk",
    "Fwd Avg Packets/Bulk", "Fwd Avg Bulk Rate",
    "Bwd Avg Bytes/Bulk", "Bwd Avg Packets/Bulk",
    "Bwd Avg Bulk Rate", "Subflow Fwd Packets",
    "Subflow Fwd Bytes", "Subflow Bwd Packets",
    "Subflow Bwd Bytes", "Init_Win_bytes_forward",
    "Init_Win_bytes_backward", "act_data_pkt_fwd",
    "min_seg_size_forward", "Active Mean", "Active Std",
    "Active Max", "Active Min", "Idle Mean", "Idle Std",
    "Idle Max", "Idle Min",
]


def extract_from_packet(packet) -> list:
    """Extract CICIDS2017 features from a Scapy packet."""
    features = [0.0] * len(FEATURE_NAMES)
    try:
        from scapy.all import IP, TCP, UDP, ICMP
        idx = {name: i for i, name in enumerate(FEATURE_NAMES)}

        if packet.haslayer(TCP):
            features[idx["Destination Port"]]       = float(packet[TCP].dport)
            features[idx["Fwd Header Length"]]      = float(packet[TCP].dataofs * 4)
            features[idx["Init_Win_bytes_forward"]] = float(packet[TCP].window)
            flags = int(packet[TCP].flags)
            features[idx["FIN Flag Count"]] = float(flags & 0x01)
            features[idx["SYN Flag Count"]] = float((flags & 0x02) >> 1)
            features[idx["RST Flag Count"]] = float((flags & 0x04) >> 2)
            features[idx["PSH Flag Count"]] = float((flags & 0x08) >> 3)
            features[idx["ACK Flag Count"]] = float((flags & 0x10) >> 4)
            features[idx["URG Flag Count"]] = float((flags & 0x20) >> 5)

        elif packet.haslayer(UDP):
            features[idx["Destination Port"]] = float(packet[UDP].dport)

        elif packet.haslayer(ICMP):
            # ICMP has no ports — type 8=echo request, 0=echo reply
            features[idx["Destination Port"]] = float(packet[ICMP].type)

        if packet.haslayer(IP):
            pkt_len = float(len(packet[IP]))
            features[idx["Total Length of Fwd Packets"]] = pkt_len
            features[idx["Fwd Packet Length Max"]]       = pkt_len
            features[idx["Fwd Packet Length Min"]]       = pkt_len
            features[idx["Fwd Packet Length Mean"]]      = pkt_len
            features[idx["Max Packet Length"]]           = pkt_len
            features[idx["Min Packet Length"]]           = pkt_len
            features[idx["Packet Length Mean"]]          = pkt_len
            features[idx["Average Packet Size"]]         = pkt_len
            features[idx["Total Fwd Packets"]]           = 1.0

    except Exception as e:
        print(f"⚠ Feature extraction warning: {e}")
    return features


def build_feature_vector(data: dict, feature_cols: list) -> list:
    """Map a named-feature dict to an ordered float list. Missing = 0.0"""
    return [float(data.get(col, 0.0)) for col in feature_cols]


# ── Attack simulators ─────────────────────────────────────────
# Each function returns a dict of the most discriminative features
# for that attack type based on CICIDS2017 dataset statistics.
# build_feature_vector() fills every unset feature with 0.0,
# which is what the model saw for those columns in training.
#
# Key principle: only set features that are genuinely different
# from benign traffic for this specific attack type.
# Setting wrong values is worse than leaving them 0.
# ─────────────────────────────────────────────────────────────


def simulate_dos_features() -> dict:
    """
    DoS Hulk / DoS GoldenEye / DoS slowloris
    Signature: massive byte rate, high packet rate, very short flow duration,
    many forward packets, large forward packet sizes, SYN flood variant.
    """
    return {
        "Destination Port":         80.0,
        "Flow Duration":            1.0,        # very short — rapid fire
        "Total Fwd Packets":        5000.0,     # flood of packets
        "Total Backward Packets":   0.0,        # server can't respond
        "Total Length of Fwd Packets": 7500000.0,
        "Fwd Packet Length Max":    1500.0,     # full MTU packets
        "Fwd Packet Length Min":    1500.0,
        "Fwd Packet Length Mean":   1500.0,
        "Fwd Packet Length Std":    0.0,
        "Flow Bytes/s":             9999999.0,  # defining feature of DoS
        "Flow Packets/s":           9999.0,     # defining feature
        "Flow IAT Mean":            0.1,        # almost no gap between packets
        "Flow IAT Min":             0.0,
        "Fwd IAT Mean":             0.1,
        "Fwd IAT Min":              0.0,
        "SYN Flag Count":           1.0,
        "ACK Flag Count":           0.0,
        "Fwd Packets/s":            9999.0,
        "Bwd Packets/s":            0.0,
        "Min Packet Length":        1500.0,
        "Max Packet Length":        1500.0,
        "Packet Length Mean":       1500.0,
        "Average Packet Size":      1500.0,
        "Init_Win_bytes_forward":   65535.0,
        "Subflow Fwd Packets":      5000.0,
        "Subflow Fwd Bytes":        7500000.0,
    }


def simulate_portscan_features() -> dict:
    """
    PortScan
    Signature: many tiny probe packets to different ports, high RST/SYN ratio
    (target sends RST for closed ports), very short flows, almost no backward data.
    """
    return {
        "Destination Port":         8080.0,     # scanning non-standard port
        "Flow Duration":            100.0,      # short probe flows
        "Total Fwd Packets":        1.0,        # one SYN probe per flow
        "Total Backward Packets":   1.0,        # one RST back (port closed)
        "Total Length of Fwd Packets": 0.0,     # SYN has no payload
        "Total Length of Bwd Packets": 0.0,
        "Fwd Packet Length Max":    0.0,
        "Fwd Packet Length Min":    0.0,
        "Fwd Packet Length Mean":   0.0,
        "Flow Bytes/s":             0.0,
        "Flow Packets/s":           500.0,      # fast scan rate
        "SYN Flag Count":           1.0,        # SYN probe
        "RST Flag Count":           1.0,        # RST from target (closed port)
        "ACK Flag Count":           0.0,
        "Fwd Packets/s":            500.0,
        "Bwd Packets/s":            500.0,
        "Min Packet Length":        0.0,
        "Max Packet Length":        0.0,
        "Packet Length Mean":       0.0,
        "Average Packet Size":      0.0,
        "Init_Win_bytes_forward":   1024.0,
        "Down/Up Ratio":            1.0,
    }


def simulate_ddos_features() -> dict:
    """
    DDoS (Distributed Denial of Service)
    Signature: similar to DoS but UDP-based flood, even higher packet rate,
    many sources → very high flow rate, no backward traffic (UDP has no handshake).
    Key difference from DoS: UDP protocol (no SYN/ACK), destination port 80/53.
    """
    return {
        "Destination Port":         80.0,
        "Flow Duration":            1.0,
        "Total Fwd Packets":        8000.0,     # even more than DoS
        "Total Backward Packets":   0.0,        # UDP — no replies
        "Total Length of Fwd Packets": 4800000.0,
        "Fwd Packet Length Max":    600.0,      # UDP packets smaller than TCP
        "Fwd Packet Length Min":    600.0,
        "Fwd Packet Length Mean":   600.0,
        "Fwd Packet Length Std":    0.0,
        "Bwd Packet Length Max":    0.0,
        "Bwd Packet Length Mean":   0.0,
        "Flow Bytes/s":             4800000.0,  # massive byte rate
        "Flow Packets/s":           8000.0,     # higher than DoS
        "Flow IAT Mean":            0.125,
        "Flow IAT Min":             0.0,
        "Fwd IAT Mean":             0.125,
        "Fwd IAT Min":              0.0,
        "SYN Flag Count":           0.0,        # UDP — no SYN
        "ACK Flag Count":           0.0,        # UDP — no ACK
        "Fwd Packets/s":            8000.0,
        "Bwd Packets/s":            0.0,
        "Min Packet Length":        600.0,
        "Max Packet Length":        600.0,
        "Packet Length Mean":       600.0,
        "Packet Length Variance":   0.0,
        "Average Packet Size":      600.0,
        "Down/Up Ratio":            0.0,        # no replies at all
        "Subflow Fwd Packets":      8000.0,
        "Subflow Fwd Bytes":        4800000.0,
    }


def simulate_bruteforce_features() -> dict:
    """
    FTP-Patator / SSH-Patator / Brute Force
    Signature: many repeated short flows to same port (22 SSH / 21 FTP),
    small packets (just credentials), slow deliberate rate (not flooding),
    roughly equal fwd/bwd (login attempt → response), high flow count to same dst.
    """
    return {
        "Destination Port":         22.0,       # SSH brute force
        "Flow Duration":            500000.0,   # medium duration (login attempt)
        "Total Fwd Packets":        8.0,        # handshake + auth packets
        "Total Backward Packets":   6.0,        # server responses
        "Total Length of Fwd Packets": 800.0,
        "Total Length of Bwd Packets": 600.0,
        "Fwd Packet Length Max":    200.0,      # small auth payloads
        "Fwd Packet Length Min":    40.0,
        "Fwd Packet Length Mean":   100.0,
        "Fwd Packet Length Std":    60.0,
        "Bwd Packet Length Max":    150.0,
        "Bwd Packet Length Min":    40.0,
        "Bwd Packet Length Mean":   100.0,
        "Flow Bytes/s":             2800.0,     # slow — not a flood
        "Flow Packets/s":           28.0,       # deliberate pace
        "Flow IAT Mean":            35714.0,
        "Flow IAT Std":             10000.0,
        "SYN Flag Count":           1.0,        # TCP connection per attempt
        "ACK Flag Count":           1.0,
        "FIN Flag Count":           1.0,        # clean close after each attempt
        "PSH Flag Count":           1.0,        # pushing credentials
        "Fwd Packets/s":            14.3,
        "Bwd Packets/s":            10.7,
        "Min Packet Length":        40.0,
        "Max Packet Length":        200.0,
        "Packet Length Mean":       100.0,
        "Average Packet Size":      100.0,
        "Down/Up Ratio":            0.75,       # mostly sending (credentials)
        "Init_Win_bytes_forward":   8192.0,
        "Init_Win_bytes_backward":  8192.0,
        "act_data_pkt_fwd":         5.0,
        "Subflow Fwd Packets":      8.0,
        "Subflow Fwd Bytes":        800.0,
        "Subflow Bwd Packets":      6.0,
        "Subflow Bwd Bytes":        600.0,
    }


def simulate_webattack_features() -> dict:
    """
    Web Attack (XSS / SQL Injection / Brute Force via HTTP)
    Signature: HTTP traffic (port 80/443), medium-length flows,
    PSH flag heavy (HTTP POST payloads), unusual payload sizes
    (injected SQL/JS strings), normal-ish packet rate but odd content sizes.
    """
    return {
        "Destination Port":         80.0,       # HTTP
        "Flow Duration":            2000000.0,  # medium flow
        "Total Fwd Packets":        12.0,
        "Total Backward Packets":   10.0,
        "Total Length of Fwd Packets": 6500.0,  # large POST bodies (injection payloads)
        "Total Length of Bwd Packets": 15000.0, # server HTML responses
        "Fwd Packet Length Max":    1460.0,     # full HTTP POST
        "Fwd Packet Length Min":    66.0,
        "Fwd Packet Length Mean":   541.0,
        "Fwd Packet Length Std":    580.0,      # high variance — mixed requests
        "Bwd Packet Length Max":    1460.0,
        "Bwd Packet Length Min":    66.0,
        "Bwd Packet Length Mean":   1500.0,
        "Flow Bytes/s":             10750.0,
        "Flow Packets/s":           11.0,
        "Flow IAT Mean":            91000.0,
        "Flow IAT Std":             200000.0,   # irregular timing
        "PSH Flag Count":           1.0,        # HTTP data push
        "ACK Flag Count":           1.0,
        "SYN Flag Count":           1.0,
        "FIN Flag Count":           1.0,
        "Fwd PSH Flags":            1.0,        # forward push (POST payload)
        "Fwd Packets/s":            6.0,
        "Bwd Packets/s":            5.0,
        "Min Packet Length":        66.0,
        "Max Packet Length":        1460.0,
        "Packet Length Mean":       951.0,
        "Packet Length Std":        614.0,
        "Average Packet Size":      951.0,
        "Down/Up Ratio":            2.3,        # server sends more (HTML response)
        "Init_Win_bytes_forward":   65535.0,
        "Init_Win_bytes_backward":  65535.0,
        "act_data_pkt_fwd":         8.0,
        "Subflow Fwd Packets":      12.0,
        "Subflow Fwd Bytes":        6500.0,
        "Subflow Bwd Packets":      10.0,
        "Subflow Bwd Bytes":        15000.0,
    }


def simulate_infiltration_features() -> dict:
    """
    Infiltration (internal network attack / lateral movement)
    Signature: long-lived flows (attacker is inside, exploring slowly),
    very low packet rate (stealthy), unusual destination ports,
    bi-directional but low volume, long idle periods.
    """
    return {
        "Destination Port":         443.0,      # HTTPS to blend in
        "Flow Duration":            120000000.0, # very long flow (stealthy)
        "Total Fwd Packets":        20.0,
        "Total Backward Packets":   18.0,
        "Total Length of Fwd Packets": 5000.0,
        "Total Length of Bwd Packets": 12000.0,
        "Fwd Packet Length Max":    1460.0,
        "Fwd Packet Length Min":    40.0,
        "Fwd Packet Length Mean":   250.0,
        "Fwd Packet Length Std":    350.0,
        "Bwd Packet Length Max":    1460.0,
        "Bwd Packet Length Min":    40.0,
        "Bwd Packet Length Mean":   667.0,
        "Flow Bytes/s":             141.6,      # very slow — stealthy
        "Flow Packets/s":           0.317,      # almost no traffic
        "Flow IAT Mean":            3157895.0,  # huge gaps between packets
        "Flow IAT Std":             5000000.0,
        "Flow IAT Max":             20000000.0, # defining feature — long idle
        "Flow IAT Min":             1000.0,
        "Fwd IAT Mean":             6315789.0,
        "Fwd IAT Max":              20000000.0,
        "Bwd IAT Mean":             7000000.0,
        "Bwd IAT Max":              20000000.0,
        "PSH Flag Count":           1.0,
        "ACK Flag Count":           1.0,
        "SYN Flag Count":           1.0,
        "FIN Flag Count":           1.0,
        "Fwd Packets/s":            0.167,
        "Bwd Packets/s":            0.150,
        "Min Packet Length":        40.0,
        "Max Packet Length":        1460.0,
        "Average Packet Size":      447.3,
        "Down/Up Ratio":            2.4,
        # Long idle periods — key distinction from normal traffic
        "Idle Mean":                15000000.0,
        "Idle Std":                 5000000.0,
        "Idle Max":                 20000000.0,
        "Idle Min":                 5000000.0,
        "Active Mean":              500000.0,
        "Active Std":               100000.0,
        "Active Max":               800000.0,
        "Active Min":               100000.0,
        "Init_Win_bytes_forward":   65535.0,
        "Init_Win_bytes_backward":  65535.0,
        "act_data_pkt_fwd":         12.0,
        "Subflow Fwd Packets":      20.0,
        "Subflow Fwd Bytes":        5000.0,
        "Subflow Bwd Packets":      18.0,
        "Subflow Bwd Bytes":        12000.0,
    }


def simulate_bot_features() -> dict:
    """
    Bot / Botnet C2 communication
    Signature: periodic/regular traffic (C2 heartbeat), unusual ports (IRC: 6667),
    very consistent packet sizes (templated C2 messages), regular timing intervals,
    low but steady traffic rate, both directions (bot talks to C2, gets commands).
    """
    return {
        "Destination Port":         6667.0,     # IRC — classic botnet C2
        "Flow Duration":            60000000.0, # long persistent connection
        "Total Fwd Packets":        50.0,
        "Total Backward Packets":   50.0,       # symmetric — bot + C2 talk equally
        "Total Length of Fwd Packets": 5000.0,
        "Total Length of Bwd Packets": 5000.0,
        "Fwd Packet Length Max":    200.0,      # small C2 commands
        "Fwd Packet Length Min":    100.0,
        "Fwd Packet Length Mean":   100.0,
        "Fwd Packet Length Std":    10.0,       # very consistent (templated)
        "Bwd Packet Length Max":    200.0,
        "Bwd Packet Length Min":    100.0,
        "Bwd Packet Length Mean":   100.0,
        "Bwd Packet Length Std":    10.0,       # very consistent both ways
        "Flow Bytes/s":             166.7,      # low steady rate
        "Flow Packets/s":           1.67,       # ~1-2 packets/sec heartbeat
        # Regular timing — defining feature of bot C2 heartbeat
        "Flow IAT Mean":            600000.0,   # regular 0.6s interval
        "Flow IAT Std":             5000.0,     # very low std = regular timing
        "Flow IAT Max":             620000.0,
        "Flow IAT Min":             580000.0,
        "Fwd IAT Mean":             1200000.0,
        "Fwd IAT Std":              10000.0,    # extremely regular
        "Fwd IAT Max":              1220000.0,
        "Fwd IAT Min":              1180000.0,
        "Bwd IAT Mean":             1200000.0,
        "Bwd IAT Std":              10000.0,
        "PSH Flag Count":           1.0,
        "ACK Flag Count":           1.0,
        "SYN Flag Count":           1.0,
        "FIN Flag Count":           0.0,        # persistent — never closes
        "Fwd Packets/s":            0.833,
        "Bwd Packets/s":            0.833,
        "Min Packet Length":        100.0,
        "Max Packet Length":        200.0,
        "Packet Length Mean":       100.0,
        "Packet Length Std":        10.0,
        "Packet Length Variance":   100.0,
        "Average Packet Size":      100.0,
        "Down/Up Ratio":            1.0,        # symmetric C2 channel
        "Init_Win_bytes_forward":   65535.0,
        "Init_Win_bytes_backward":  65535.0,
        "act_data_pkt_fwd":         40.0,
        # Active/Idle pattern — bot wakes up, sends heartbeat, goes idle
        "Active Mean":              60000.0,
        "Active Std":               5000.0,
        "Active Max":               70000.0,
        "Active Min":               50000.0,
        "Idle Mean":                1140000.0,  # long idle between heartbeats
        "Idle Std":                 10000.0,
        "Idle Max":                 1160000.0,
        "Idle Min":                 1120000.0,
        "Subflow Fwd Packets":      50.0,
        "Subflow Fwd Bytes":        5000.0,
        "Subflow Bwd Packets":      50.0,
        "Subflow Bwd Bytes":        5000.0,
    }


# ── Simulator registry ────────────────────────────────────────
# Used by main.py to look up the right simulator by attack type name.
# Add new simulators here — main.py picks them up automatically.

SIMULATORS = {
    "DoS":          simulate_dos_features,
    "DDoS":         simulate_ddos_features,
    "PortScan":     simulate_portscan_features,
    "Brute Force":  simulate_bruteforce_features,
    "Web Attack":   simulate_webattack_features,
    "Infiltration": simulate_infiltration_features,
    "Bot":          simulate_bot_features,
}


def get_simulator(attack_type: str):
    """
    Return the simulator function for the given attack type.
    Falls back to DoS if the type is not found (should not happen).
    """
    fn = SIMULATORS.get(attack_type)
    if fn is None:
        print(f"⚠ No simulator for '{attack_type}' — falling back to DoS features")
        fn = simulate_dos_features
    return fn