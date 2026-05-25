import threading
import time
import os
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

LIVE_CAPTURE = os.getenv("LIVE_CAPTURE", "false").lower() == "true"
INTERFACE    = os.getenv("CAPTURE_INTERFACE", "eth0")

_capture_results = []
_capture_running = False
_capture_thread  = None
_capture_stats   = {"total": 0, "attacks": 0, "errors": 0}
_MAX_RESULTS     = 500   # increased so more packets show

def get_results():  return list(_capture_results)
def get_stats():    return dict(_capture_stats)
def is_running():   return _capture_running


def _get_protocol(packet) -> str:
    """Detect protocol from packet layers."""
    try:
        from scapy.all import TCP, UDP, ICMP
        if packet.haslayer(TCP):   return "TCP"
        if packet.haslayer(UDP):   return "UDP"
        if packet.haslayer(ICMP):  return "ICMP"   # ✅ ICMP now detected
    except: pass
    return "OTHER"


def _get_dst_port(packet) -> int:
    """Get destination port safely."""
    try:
        from scapy.all import TCP, UDP, ICMP
        if packet.haslayer(TCP):  return int(packet["TCP"].dport)
        if packet.haslayer(UDP):  return int(packet["UDP"].dport)
        if packet.haslayer(ICMP): return int(packet["ICMP"].type)  # use ICMP type as port
    except: pass
    return 0


def _process_packet(packet, predictor_fn, feature_extractor_fn):
    global _capture_stats
    try:
        from scapy.all import IP
        if not packet.haslayer(IP):
            return   # skip non-IP packets (ARP etc.)

        features = feature_extractor_fn(packet)
        result   = predictor_fn(features)
        protocol = _get_protocol(packet)
        dst_port = _get_dst_port(packet)

        entry = {
            "id":           time.time(),
            "timestamp":    datetime.now().isoformat(),
            "src_ip":       packet[IP].src,
            "dst_ip":       packet[IP].dst,
            "protocol":     protocol,
            "dst_port":     dst_port,
            "label":        result["multiclass_label"],
            "binary_label": result["binary_label"],
            "is_attack":    result["is_attack"],
            "confidence":   result["confidence"],
            "live":         True,
        }

        # Insert at front so newest shows first
        _capture_results.insert(0, entry)
        if len(_capture_results) > _MAX_RESULTS:
            _capture_results.pop()

        _capture_stats["total"] += 1
        if result["is_attack"]:
            _capture_stats["attacks"] += 1

        # Print to terminal so you can verify in real time
        flag = "⚠ ATTACK" if result["is_attack"] else "✓ OK"
        print(f"[{protocol:<4}] {packet[IP].src:<15} → {packet[IP].dst:<15} | {result['multiclass_label']:<20} | {flag}")

    except Exception as e:
        _capture_stats["errors"] += 1


def start_capture(predictor_fn, feature_extractor_fn):
    global _capture_running, _capture_thread

    if not LIVE_CAPTURE:
        print("ℹ️  Live capture disabled (LIVE_CAPTURE=false in .env)")
        return False

    if _capture_running:
        return True

    try:
        from scapy.all import sniff

        def _run():
            global _capture_running
            _capture_running = True
            print(f"🔴 Live capture started on interface: {INTERFACE}")
            print(f"   All captured packets will appear below:\n")
            sniff(
                iface=INTERFACE,
                prn=lambda pkt: _process_packet(pkt, predictor_fn, feature_extractor_fn),
                store=False,
            )

        _capture_thread = threading.Thread(target=_run, daemon=True)
        _capture_thread.start()
        return True

    except Exception as e:
        print(f"❌ Capture failed: {e}")
        _capture_running = False
        return False


def stop_capture():
    global _capture_running
    _capture_running = False
    print("⏹  Capture stopped.")
