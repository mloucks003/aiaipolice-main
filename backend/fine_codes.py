# Violation codes with automatic fine amounts
VIOLATION_FINES = {
    # Traffic Violations
    'VC-22350': 238.00,  # Speeding - Basic Speed Law
    'VC-21453': 490.00,  # Failure to Stop at Red Light
    'VC-22454': 238.00,  # Failure to Stop at Stop Sign
    'VC-23152': 1800.00, # DUI - Driving Under the Influence
    'VC-12500': 234.00,  # Driving Without Valid License
    'VC-16028': 900.00,  # No Proof of Insurance
    'VC-22349': 367.00,  # Exceeding Maximum Speed Limit
    'VC-21658': 238.00,  # Unsafe Lane Change
    'VC-22107': 238.00,  # Unsafe Turn or Stop
    'VC-23103': 490.00,  # Reckless Driving
    'VC-27360': 162.00,  # Seat Belt Violation
    'VC-23123': 162.00,  # Cell Phone While Driving
    
    # Criminal Violations
    'PC-459': 0.00,      # Burglary (court determines)
    'PC-487': 0.00,      # Grand Theft (court determines)
    'PC-484': 500.00,    # Petty Theft
    'PC-242': 1000.00,   # Battery
    'PC-415': 400.00,    # Disturbing the Peace
    'PC-148': 1000.00,   # Resisting Arrest
    'PC-243': 2000.00,   # Battery on Peace Officer
    'PC-594': 1000.00,   # Vandalism
}

def get_fine_amount(violation_code: str) -> float:
    """Get automatic fine amount for violation code."""
    return VIOLATION_FINES.get(violation_code, 0.00)
