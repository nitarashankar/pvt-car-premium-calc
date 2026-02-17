#!/usr/bin/env python3
"""
Extract all rates and configuration from Excel file to JSON
"""
import openpyxl
import json
from pathlib import Path

def extract_od_base_rates(ws_age_rto):
    """Extract OD base rates from Age RTO sheet"""
    rates = []
    
    # Age categories and zones
    age_configs = [
        {"row": 2, "age_min": 0, "age_max": 5, "label": "<=5 years"},
        {"row": 4, "age_min": 5, "age_max": 10, "label": ">5years to <=10years"},
        {"row": 6, "age_min": 10, "age_max": 100, "label": ">10years"}
    ]
    
    zones = [
        {"row_offset": 0, "zone": "A"},
        {"row_offset": 1, "zone": "B"}
    ]
    
    cc_categories = [
        {"col": 3, "category": "upto_1000cc", "label": "<1000cc"},
        {"col": 4, "category": "1000cc_1500cc", "label": "1001cc-1500cc"},
        {"col": 5, "category": "above_1500cc", "label": ">1500cc"}
    ]
    
    for age_config in age_configs:
        for zone in zones:
            row = age_config["row"] + zone["row_offset"]
            for cc in cc_categories:
                rate = ws_age_rto.cell(row, cc["col"]).value
                if rate:
                    rates.append({
                        "age_min": age_config["age_min"],
                        "age_max": age_config["age_max"],
                        "zone": zone["zone"],
                        "cc_category": cc["category"],
                        "rate_percent": float(rate)
                    })
    
    return {
        "version": "2025-v1",
        "effective_date": "2025-01-01",
        "description": "OD Base Rates based on vehicle age, RTO zone, and cubic capacity",
        "rates": rates
    }

def extract_tp_base_rates():
    """Extract TP base rates"""
    return {
        "version": "2025-v1",
        "effective_date": "2025-01-01",
        "description": "Third Party Base Rates by cubic capacity",
        "rates": [
            {"cc_category": "upto_1000cc", "premium": 2094},
            {"cc_category": "1000cc_1500cc", "premium": 3416},
            {"cc_category": "above_1500cc", "premium": 7897}
        ]
    }

def extract_addon_rates():
    """Extract all add-on premium rates"""
    return {
        "version": "2025-v1",
        "effective_date": "2025-01-01",
        "description": "Add-on premium rates and calculation rules",
        "addons": {
            "nil_dep": {
                "name": "Zero Depreciation",
                "category": "od",
                "calculation_type": "percentage_of_basic_od",
                "age_based": True,
                "slabs": [
                    {"age_min": 0, "age_max": 1, "rate_percent": 10},
                    {"age_min": 1, "age_max": 2, "rate_percent": 20},
                    {"age_min": 2, "age_max": 100, "rate_percent": 30}
                ]
            },
            "engine_protection": {
                "name": "Engine and Gearbox Protection",
                "category": "od",
                "calculation_type": "percentage_of_idv",
                "age_based": True,
                "slabs": [
                    {"age_min": 0, "age_max": 1, "rate_percent": 0.13},
                    {"age_min": 1, "age_max": 2, "rate_percent": 0.16},
                    {"age_min": 2, "age_max": 3, "rate_percent": 0.21},
                    {"age_min": 3, "age_max": 4, "rate_percent": 0.27},
                    {"age_min": 4, "age_max": 100, "rate_percent": 0.32}
                ]
            },
            "road_side_assistance": {
                "name": "Road Side Assistance",
                "category": "od",
                "calculation_type": "flat",
                "age_based": False,
                "premium": 50
            },
            "return_to_invoice": {
                "name": "Return to Invoice",
                "category": "od",
                "calculation_type": "percentage_of_idv",
                "age_based": True,
                "slabs": [
                    {"age_min": 0, "age_max": 1, "rate_percent": 0.15},
                    {"age_min": 1, "age_max": 2, "rate_percent": 0.20},
                    {"age_min": 2, "age_max": 100, "rate_percent": 0.25}
                ]
            },
            "ncb_protect": {
                "name": "NCB Protection",
                "category": "od",
                "calculation_type": "percentage_of_idv",
                "age_based": False,
                "rate_percent": 0.15
            },
            "consumables": {
                "name": "Consumables Cover",
                "category": "od",
                "calculation_type": "percentage_of_idv",
                "age_based": True,
                "slabs": [
                    {"age_min": 0, "age_max": 1, "rate_percent": 0.10},
                    {"age_min": 1, "age_max": 2, "rate_percent": 0.12},
                    {"age_min": 2, "age_max": 3, "rate_percent": 0.15},
                    {"age_min": 3, "age_max": 4, "rate_percent": 0.17},
                    {"age_min": 4, "age_max": 100, "rate_percent": 0.20}
                ]
            },
            "geo_extension_od": {
                "name": "Geographical Area Extension (OD)",
                "category": "od",
                "calculation_type": "flat",
                "age_based": False,
                "premium": 400
            },
            "builtin_cng_od": {
                "name": "Built-in CNG/LPG (OD)",
                "category": "od",
                "calculation_type": "percentage_of_basic_od",
                "age_based": True,
                "slabs": [
                    {"age_min": 0, "age_max": 1, "rate_percent": 1},
                    {"age_min": 1, "age_max": 2, "rate_percent": 2},
                    {"age_min": 2, "age_max": 100, "rate_percent": 3}
                ]
            },
            "cng_lpg_si": {
                "name": "External CNG/LPG Kit (OD)",
                "category": "od",
                "calculation_type": "percentage_of_si",
                "age_based": False,
                "rate_percent": 4
            },
            "loss_of_key": {
                "name": "Loss of Key",
                "category": "od",
                "calculation_type": "flat",
                "age_based": False,
                "premium": 750
            },
            "additional_towing": {
                "name": "Additional Towing Charges",
                "category": "od",
                "calculation_type": "flat",
                "age_based": False,
                "premium": 75
            },
            "medical_expenses": {
                "name": "Medical Expenses Cover",
                "category": "od",
                "calculation_type": "flat_age_based",
                "age_based": True,
                "slabs": [
                    {"age_min": 0, "age_max": 1, "premium": 275},
                    {"age_min": 1, "age_max": 5, "premium": 325},
                    {"age_min": 5, "age_max": 100, "premium": 450}
                ]
            },
            "tyre_rim": {
                "name": "Tyre and RIM Protector",
                "category": "od",
                "calculation_type": "si_based_flat",
                "age_based": False,
                "si_slabs": [
                    {"si": 25000, "premium": 1000},
                    {"si": 50000, "premium": 2000},
                    {"si": 100000, "premium": 4000},
                    {"si": 200000, "premium": 8000}
                ]
            },
            "personal_effects": {
                "name": "Personal Effects",
                "category": "od",
                "calculation_type": "flat",
                "age_based": False,
                "premium": 500
            },
            "courtesy_car": {
                "name": "Courtesy Car Cover",
                "category": "od",
                "calculation_type": "flat_age_based",
                "age_based": True,
                "slabs": [
                    {"age_min": 0, "age_max": 1, "premium": 375},
                    {"age_min": 1, "age_max": 5, "premium": 450},
                    {"age_min": 5, "age_max": 100, "premium": 600}
                ]
            },
            "road_tax_cover": {
                "name": "Road Tax Cover",
                "category": "od",
                "calculation_type": "percentage_of_computed",
                "age_based": False,
                "base_percent": 20,
                "rate_percent": 0.25
            },
            "cpa_owner_driver": {
                "name": "CPA Owner Driver",
                "category": "tp",
                "calculation_type": "flat",
                "age_based": False,
                "premium": 275
            },
            "ll_paid_driver": {
                "name": "Legal Liability to Paid Driver",
                "category": "tp",
                "calculation_type": "flat",
                "age_based": False,
                "premium": 50
            },
            "cng_lpg_tp": {
                "name": "CNG/LPG (TP)",
                "category": "tp",
                "calculation_type": "flat",
                "age_based": False,
                "premium": 60
            },
            "geo_extension_tp": {
                "name": "Geographical Area Extension (TP)",
                "category": "tp",
                "calculation_type": "flat",
                "age_based": False,
                "premium": 100
            }
        }
    }

def extract_discount_rules():
    """Extract discount configuration"""
    return {
        "version": "2025-v1",
        "effective_date": "2025-01-01",
        "description": "Discount rules and eligibility",
        "discounts": {
            "od_discount": {
                "name": "Own Damage Discount",
                "applicable_to": ["basic_od"],
                "type": "percentage_input",
                "description": "User-provided OD discount percentage"
            },
            "ncb": {
                "name": "No Claim Bonus",
                "applicable_to": [
                    "basic_od_after_discount",
                    "nil_dep",
                    "return_to_invoice",
                    "geo_extension_od",
                    "builtin_cng_od"
                ],
                "type": "percentage_input",
                "description": "NCB applied after OD discount on eligible components"
            }
        }
    }

def extract_gst_config():
    """Extract GST configuration"""
    return {
        "version": "2025-v1",
        "effective_date": "2025-01-01",
        "description": "GST configuration",
        "cgst_percent": 9,
        "sgst_percent": 9,
        "applicable_to": "net_premium"
    }

if __name__ == "__main__":
    # Load Excel file
    excel_path = "/home/runner/work/pvt-car-premium-calc/pvt-car-premium-calc/motor Premium calculation 2.xlsx"
    wb = openpyxl.load_workbook(excel_path, data_only=False)
    
    # Output directory
    output_dir = Path("/home/runner/work/pvt-car-premium-calc/pvt-car-premium-calc/config")
    output_dir.mkdir(exist_ok=True)
    
    # Extract and save OD base rates
    ws_age_rto = wb["Age RTO"]
    od_rates = extract_od_base_rates(ws_age_rto)
    with open(output_dir / "od_base_rates.json", "w") as f:
        json.dump(od_rates, f, indent=2)
    print(f"✓ Created od_base_rates.json with {len(od_rates['rates'])} rates")
    
    # Extract and save TP base rates
    tp_rates = extract_tp_base_rates()
    with open(output_dir / "tp_base_rates.json", "w") as f:
        json.dump(tp_rates, f, indent=2)
    print(f"✓ Created tp_base_rates.json with {len(tp_rates['rates'])} rates")
    
    # Extract and save add-on rates
    addon_rates = extract_addon_rates()
    with open(output_dir / "addon_premiums.json", "w") as f:
        json.dump(addon_rates, f, indent=2)
    print(f"✓ Created addon_premiums.json with {len(addon_rates['addons'])} add-ons")
    
    # Extract and save discount rules
    discount_rules = extract_discount_rules()
    with open(output_dir / "discount_rules.json", "w") as f:
        json.dump(discount_rules, f, indent=2)
    print(f"✓ Created discount_rules.json")
    
    # Extract and save GST config
    gst_config = extract_gst_config()
    with open(output_dir / "gst_config.json", "w") as f:
        json.dump(gst_config, f, indent=2)
    print(f"✓ Created gst_config.json")
    
    print("\n✅ All configuration files created successfully!")
