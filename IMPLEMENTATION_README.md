# Private Car Premium Calculator

A dynamic, JSON-configured motor insurance premium calculator with no database dependencies.

## Features

- ✅ **100% JSON-Driven**: All rates and formulas in configuration files
- ✅ **No Database**: Uses JSON files for configuration storage
- ✅ **Zero-Code Rate Updates**: Update rates by editing JSON files
- ✅ **26 Input Fields**: Complete coverage of all premium components
- ✅ **20+ Add-ons**: All standard motor insurance add-ons supported
- ✅ **Dynamic Calculation**: Age-based, zone-based, and SI-based calculations
- ✅ **CLI Interface**: Easy command-line usage
- ✅ **Python API**: Programmatic access for integration

## Installation

```bash
# Install dependencies
pip install -r requirements.txt

# Or install in development mode
pip install -e .
```

## Quick Start

### Command Line Usage

Calculate premium for a vehicle:

```bash
python3 -m src.premium_calculator.cli \
  --cc-category 1000cc_1500cc \
  --zone A \
  --purchase-date 2025-01-01 \
  --idv 125000 \
  --ncb 20 \
  --od-discount 60 \
  --nil-dep \
  --engine-protection \
  --consumables
```

### Python API Usage

```python
from premium_calculator.core.calculator import PremiumCalculator

# Initialize calculator
calc = PremiumCalculator()

# Prepare input data
input_data = {
    "policy_type": "Package",
    "vehicle_type": "New",
    "cc_category": "1000cc_1500cc",
    "zone": "A",
    "purchase_date": "2025-01-01",
    "idv": 125000,
    "ncb_percent": 0.20,  # 20% NCB
    "od_discount_percent": 60,
    "builtin_cng_lpg": 1,
    "cng_lpg_si": 0,
    "nil_dep": 1,
    "return_to_invoice": 1,
    "ncb_protect": 1,
    "engine_protection": 1,
    "consumables": 1,
    "road_side_assistance": 1,
    "geo_extension": 1,
    "road_tax_cover": 0,
    "courtesy_car": 1,
    "additional_towing": 1,
    "medical_expenses": 1,
    "loss_of_key": 1,
    "tyre_rim_si": 100000,
    "personal_effects": 1,
    "cpa_owner_driver": 1,
    "ll_paid_driver": 1
}

# Calculate premium
result = calc.calculate(input_data)

# Access results
print(f"Total Premium: ₹{result['calculations']['total_premium']:,.2f}")
```

## Configuration

All rates and calculation rules are stored in JSON files in the `config/` directory:

### Configuration Files

| File | Description |
|------|-------------|
| `od_base_rates.json` | OD base rates by age, zone, and CC (18 combinations) |
| `tp_base_rates.json` | TP base rates by cubic capacity (3 rates) |
| `addon_premiums.json` | All add-on premium rates and calculation rules (20 add-ons) |
| `discount_rules.json` | Discount eligibility and application rules |
| `gst_config.json` | GST rate configuration |

### Updating Rates

To update rates, simply edit the JSON files:

```json
// config/od_base_rates.json
{
  "version": "2025-v1",
  "effective_date": "2025-01-01",
  "rates": [
    {
      "age_min": 0,
      "age_max": 5,
      "zone": "A",
      "cc_category": "1000cc_1500cc",
      "rate_percent": 3.283
    }
    // ... more rates
  ]
}
```

The calculator automatically uses the updated rates - no code changes needed!

## Input Fields

### Required Fields
- `cc_category`: Cubic capacity ("upto_1000cc", "1000cc_1500cc", "above_1500cc")
- `zone`: RTO zone ("A" or "B")
- `purchase_date`: Vehicle purchase date (YYYY-MM-DD)
- `idv`: Insured Declared Value (₹)

### Optional Fields
- `ncb_percent`: No Claim Bonus (0 to 0.5, i.e., 0-50%)
- `od_discount_percent`: Own Damage discount (0-100)
- All add-ons (boolean 0/1 or SI values)

### Add-On Fields

**OD Add-Ons:**
- `nil_dep`: Zero Depreciation
- `engine_protection`: Engine & Gearbox Protection
- `return_to_invoice`: Return to Invoice
- `ncb_protect`: NCB Protection
- `consumables`: Consumables Cover
- `road_side_assistance`: Road Side Assistance
- `geo_extension`: Geographical Extension
- `builtin_cng_lpg`: Built-in CNG/LPG
- `cng_lpg_si`: External CNG/LPG Sum Insured
- `courtesy_car`: Courtesy Car Cover
- `medical_expenses`: Medical Expenses
- `loss_of_key`: Loss of Key
- `tyre_rim_si`: Tyre & RIM Protector SI
- `personal_effects`: Personal Effects
- `additional_towing`: Additional Towing
- `road_tax_cover`: Road Tax Cover

**TP Add-Ons:**
- `cpa_owner_driver`: CPA Owner Driver
- `ll_paid_driver`: Legal Liability to Paid Driver

## Architecture

### Layer Structure

```
┌─────────────────────────────────────┐
│   CLI / API Interface               │
├─────────────────────────────────────┤
│   Premium Calculator                │  (core/calculator.py)
├─────────────────────────────────────┤
│   Rate Lookup Service               │  (core/rate_lookup.py)
├─────────────────────────────────────┤
│   Configuration Loader              │  (config/loader.py)
├─────────────────────────────────────┤
│   JSON Configuration Files          │  (config/*.json)
└─────────────────────────────────────┘
```

### Key Components

**ConfigurationLoader** (`config/loader.py`)
- Loads JSON configuration files
- Caches configurations for performance
- Supports dynamic reloading

**RateLookupService** (`core/rate_lookup.py`)
- Queries rates from configuration
- Handles 6 different calculation types
- Age-based, SI-based, and flat rate lookups

**PremiumCalculator** (`core/calculator.py`)
- Main calculation engine
- Processes all 26 input fields
- Calculates 30+ premium components
- Applies discounts in correct order
- Computes GST and final premium

## Calculation Logic

### Premium Calculation Flow

1. **Calculate Vehicle Age** from purchase date
2. **Lookup OD Base Rate** (age × zone × CC)
3. **Calculate Basic OD Premium** = IDV × OD Rate
4. **Calculate All Add-On Premiums** (20+ add-ons)
5. **Calculate TP Premiums**
6. **Apply Discounts:**
   - OD Discount (on Basic OD)
   - NCB Discount (on eligible components)
7. **Calculate Net Premium** = Sum - Discounts
8. **Add GST** (CGST 9% + SGST 9%)
9. **Final Total Premium**

### Discount Hierarchy

```
Basic OD Premium
    ↓
Apply OD Discount
    ↓
Add Eligible Add-Ons (Nil Dep, RTI, Geo Ext, CNG OD)
    ↓
Apply NCB Discount
    ↓
Net Premium
```

## Testing

Run the test:

```bash
python3 tests/test_calculator.py
```

## Example Output

```
================================================================================
PREMIUM CALCULATION SUMMARY
================================================================================

Vehicle Age: 1 years
OD Base Rate: 3.283%
Basic OD Premium: ₹4,103.75

OD Discount: -₹2,462.25
NCB Discount: -₹638.87

Net Premium: ₹13,143.96
CGST @ 9%: ₹1,182.96
SGST @ 9%: ₹1,182.96

================================================================================
TOTAL PREMIUM: ₹15,509.88
================================================================================
```

## Project Structure

```
pvt-car-premium-calc/
├── config/                      # JSON configuration files
│   ├── od_base_rates.json
│   ├── tp_base_rates.json
│   ├── addon_premiums.json
│   ├── discount_rules.json
│   └── gst_config.json
├── src/
│   └── premium_calculator/
│       ├── __init__.py
│       ├── cli.py              # Command-line interface
│       ├── config/
│       │   ├── __init__.py
│       │   └── loader.py       # Configuration loader
│       ├── core/
│       │   ├── __init__.py
│       │   ├── calculator.py   # Main calculator
│       │   └── rate_lookup.py  # Rate lookup service
│       └── utils/
│           └── __init__.py
├── tests/
│   └── test_calculator.py      # Tests
├── scripts/
│   └── extract_rates.py        # Excel to JSON converter
├── requirements.txt
├── setup.py
└── README.md
```

## Version Information

- **Version**: 0.1.0
- **Configuration Version**: 2025-v1
- **Python**: 3.9+

## License

This project is for educational and evaluation purposes.

## Future Enhancements

- [ ] CSV bulk processing
- [ ] Web API interface
- [ ] Additional validations
- [ ] Rate history tracking
- [ ] Multi-version support
