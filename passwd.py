#!/usr/bin/env python3
"""
Password Strength Analyzer CLI
Author: Your Name
"""

from __future__ import annotations
import math
import re
from getpass import getpass
from typing import Dict, Tuple, List

from rich.console import Console
from rich.table import Table
from rich import box

console = Console()

# -----------------------------
# Constants
# -----------------------------
COMMON_PATTERNS = [
    "password", "123456", "qwerty", "admin", "letmein", "welcome"
]

SEQUENCES = [
    "abcdefghijklmnopqrstuvwxyz",
    "0123456789"
]

GUESSES_PER_SECOND = 10_000_000_000  # 10 billion


# -----------------------------
# Utility Functions
# -----------------------------
def check_character_types(password: str) -> Dict[str, bool]:
    """Check presence of character types."""
    return {
        "lowercase": bool(re.search(r"[a-z]", password)),
        "uppercase": bool(re.search(r"[A-Z]", password)),
        "digits": bool(re.search(r"\d", password)),
        "special": bool(re.search(r"[!@#$%^&*(),.?\":{}|<>]", password)),
    }


def detect_patterns(password: str) -> List[str]:
    """Detect weak patterns."""
    found = []
    pwd_lower = password.lower()

    # Common words
    for pattern in COMMON_PATTERNS:
        if pattern in pwd_lower:
            found.append(f"Contains common word: {pattern}")

    # Sequential patterns
    for seq in SEQUENCES:
        for i in range(len(seq) - 3):
            if seq[i:i+4] in pwd_lower:
                found.append("Contains sequential characters")

    # Repeated chars
    if re.search(r"(.)\1{2,}", password):
        found.append("Contains repeated characters")

    return found


def calculate_charset_size(types: Dict[str, bool]) -> int:
    """Estimate charset size."""
    size = 0
    if types["lowercase"]:
        size += 26
    if types["uppercase"]:
        size += 26
    if types["digits"]:
        size += 10
    if types["special"]:
        size += 32  # approx
    return size


def calculate_entropy(password: str, charset_size: int) -> float:
    """Calculate Shannon entropy."""
    if charset_size == 0:
        return 0.0
    return len(password) * math.log2(charset_size)


def estimate_crack_time(password: str, charset_size: int) -> float:
    """Estimate brute-force crack time in seconds."""
    combinations = charset_size ** len(password)
    return combinations / GUESSES_PER_SECOND


def format_time(seconds: float) -> str:
    """Convert seconds into human-readable time."""
    units = [
        ("centuries", 60 * 60 * 24 * 365 * 100),
        ("years", 60 * 60 * 24 * 365),
        ("days", 60 * 60 * 24),
        ("hours", 60 * 60),
        ("minutes", 60),
        ("seconds", 1),
    ]

    for name, count in units:
        if seconds >= count:
            value = seconds / count
            return f"{value:.2f} {name}"
    return "instant"


def calculate_score(password: str,
                    types: Dict[str, bool],
                    patterns: List[str]) -> int:
    """Calculate strength score (0–100)."""
    score = 0
    length = len(password)

    # Length score
    score += min(length * 4, 40)

    # Diversity score
    score += sum(types.values()) * 10

    # Penalty for patterns
    score -= len(patterns) * 10

    # Penalty for short passwords
    if length < 8:
        score -= 15

    return max(0, min(score, 100))


def classify_strength(score: int) -> Tuple[str, str]:
    """Classify strength level."""
    if score < 30:
        return "Weak", "red"
    elif score < 60:
        return "Medium", "yellow"
    elif score < 80:
        return "Strong", "green"
    else:
        return "Very Strong", "bold green"


def generate_suggestions(password: str,
                         types: Dict[str, bool],
                         patterns: List[str]) -> List[str]:
    """Generate improvement suggestions."""
    suggestions = []

    if len(password) < 12:
        suggestions.append("Increase length to at least 12 characters")

    if not types["uppercase"]:
        suggestions.append("Add uppercase letters")

    if not types["lowercase"]:
        suggestions.append("Add lowercase letters")

    if not types["digits"]:
        suggestions.append("Include numbers")

    if not types["special"]:
        suggestions.append("Add special characters (!@#$...)")

    if patterns:
        suggestions.append("Avoid common words and sequences")

    return suggestions


def get_analysis_data(password: str) -> Dict:
    """Analyze password and return all metrics as a dictionary."""
    if not password:
        return {
            "types": {"lowercase": False, "uppercase": False, "digits": False, "special": False},
            "patterns": [],
            "entropy": 0.0,
            "crack_time_seconds": 0.0,
            "crack_time_formatted": "instant",
            "score": 0,
            "strength": "Weak",
            "color": "red",
            "suggestions": ["Password cannot be empty"]
        }
    
    types = check_character_types(password)
    patterns = detect_patterns(password)
    charset_size = calculate_charset_size(types)
    entropy = calculate_entropy(password, charset_size)
    crack_time_sec = estimate_crack_time(password, charset_size)
    score = calculate_score(password, types, patterns)
    strength, color = classify_strength(score)
    suggestions = generate_suggestions(password, types, patterns)
    
    return {
        "types": types,
        "patterns": patterns,
        "entropy": round(entropy, 2),
        "crack_time_seconds": crack_time_sec,
        "crack_time_formatted": format_time(crack_time_sec),
        "score": score,
        "strength": strength,
        "color": color,
        "suggestions": suggestions
    }


# -----------------------------
# Main Analyzer
# -----------------------------
def analyze_password(password: str) -> None:
    if not password:
        console.print("[red]Password cannot be empty![/red]")
        return

    types = check_character_types(password)
    patterns = detect_patterns(password)
    charset_size = calculate_charset_size(types)

    entropy = calculate_entropy(password, charset_size)
    crack_time_sec = estimate_crack_time(password, charset_size)
    score = calculate_score(password, types, patterns)
    strength, color = classify_strength(score)
    suggestions = generate_suggestions(password, types, patterns)

    # -----------------------------
    # Output Table
    # -----------------------------
    table = Table(title="🔐 Password Strength Analysis", box=box.ROUNDED)

    table.add_column("Criteria", style="cyan")
    table.add_column("Result", justify="center")

    for key, value in types.items():
        table.add_row(key.capitalize(), "✅" if value else "❌")

    table.add_row("Patterns Detected", str(len(patterns)))
    table.add_row("Entropy (bits)", f"{entropy:.2f}")
    table.add_row("Time to Crack", format_time(crack_time_sec))
    table.add_row("Score", f"{score}/100")
    table.add_row("Strength", f"[{color}]{strength}[/{color}]")

    console.print(table)

    # Suggestions
    if suggestions:
        console.print("\n[yellow]Suggestions:[/yellow]")
        for s in suggestions:
            console.print(f" - {s}")


# -----------------------------
# Entry Point
# -----------------------------
def main():
    console.print("[bold cyan]Password Strength Analyzer CLI[/bold cyan]\n")
    password = getpass("Enter password: ")
    analyze_password(password)


if __name__ == "__main__":
    main()