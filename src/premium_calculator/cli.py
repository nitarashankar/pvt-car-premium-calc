"""
Command Line Interface for Premium Calculator
"""
import argparse
import json
import sys
from pathlib import Path

from .core.calculator import PremiumCalculator


def calculate_single(args):
    """Calculate premium for single input"""
    calc = PremiumCalculator(args.config_dir)
    
    # Build input data from args
    input_data = {
        "policy_type": args.policy_type,
        "vehicle_type": args.vehicle_type,
        "cc_category": args.cc_category,
        "zone": args.zone,
        "purchase_date": args.purchase_date,
        "idv": args.idv,
        "ncb_percent": args.ncb / 100 if args.ncb else 0,
        "od_discount_percent": args.od_discount,
        "builtin_cng_lpg": 1 if args.builtin_cng else 0,
        "cng_lpg_si": args.cng_lpg_si,
        "nil_dep": 1 if args.nil_dep else 0,
        "return_to_invoice": 1 if args.return_to_invoice else 0,
        "ncb_protect": 1 if args.ncb_protect else 0,
        "engine_protection": 1 if args.engine_protection else 0,
        "consumables": 1 if args.consumables else 0,
        "road_side_assistance": 1 if args.road_side_assistance else 0,
        "geo_extension": 1 if args.geo_extension else 0,
        "road_tax_cover": 0,
        "courtesy_car": 1 if args.courtesy_car else 0,
        "additional_towing": 1 if args.additional_towing else 0,
        "medical_expenses": 1 if args.medical_expenses else 0,
        "loss_of_key": 1 if args.loss_of_key else 0,
        "tyre_rim_si": args.tyre_rim_si,
        "personal_effects": 1 if args.personal_effects else 0,
        "cpa_owner_driver": 1 if args.cpa else 0,
        "ll_paid_driver": 1 if args.ll_driver else 0
    }
    
    # Calculate
    result = calc.calculate(input_data)
    
    # Print results
    if args.output_format == "json":
        print(json.dumps(result, indent=2))
    else:
        print_summary(result)


def print_summary(result):
    """Print calculation summary"""
    calc = result["calculations"]
    
    print("\n" + "=" * 80)
    print("PREMIUM CALCULATION SUMMARY")
    print("=" * 80)
    print(f"\nVehicle Age: {calc['age_years']} years")
    print(f"OD Base Rate: {calc['od_base_rate_percent']}%")
    print(f"Basic OD Premium: ₹{calc['basic_od_premium']:,.2f}")
    print(f"\nOD Discount: -₹{calc['od_discount_amount']:,.2f}")
    print(f"NCB Discount: -₹{calc['ncb_discount_amount']:,.2f}")
    print(f"\nNet Premium: ₹{calc['net_premium']:,.2f}")
    print(f"CGST @ 9%: ₹{calc['cgst']:,.2f}")
    print(f"SGST @ 9%: ₹{calc['sgst']:,.2f}")
    print(f"\n{'='*80}")
    print(f"TOTAL PREMIUM: ₹{calc['total_premium']:,.2f}")
    print("=" * 80 + "\n")


def main():
    """Main CLI entry point"""
    parser = argparse.ArgumentParser(
        description="Private Car Premium Calculator",
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    
    # Basic vehicle info
    parser.add_argument("--policy-type", default="Package", help="Policy type")
    parser.add_argument("--vehicle-type", default="New", choices=["New", "Existing"], help="Vehicle type")
    parser.add_argument("--cc-category", required=True, 
                       choices=["upto_1000cc", "1000cc_1500cc", "above_1500cc"],
                       help="Cubic capacity category")
    parser.add_argument("--zone", required=True, choices=["A", "B"], help="RTO zone")
    parser.add_argument("--purchase-date", required=True, help="Purchase date (YYYY-MM-DD)")
    parser.add_argument("--idv", type=float, required=True, help="Insured Declared Value")
    
    # Discounts
    parser.add_argument("--ncb", type=float, default=0, help="NCB percentage (0-50)")
    parser.add_argument("--od-discount", type=float, default=0, help="OD discount percentage")
    
    # CNG/LPG
    parser.add_argument("--builtin-cng", action="store_true", help="Built-in CNG/LPG")
    parser.add_argument("--cng-lpg-si", type=float, default=0, help="External CNG/LPG Sum Insured")
    
    # Add-ons (OD)
    parser.add_argument("--nil-dep", action="store_true", help="Zero Depreciation")
    parser.add_argument("--return-to-invoice", action="store_true", help="Return to Invoice")
    parser.add_argument("--ncb-protect", action="store_true", help="NCB Protection")
    parser.add_argument("--engine-protection", action="store_true", help="Engine Protection")
    parser.add_argument("--consumables", action="store_true", help="Consumables")
    parser.add_argument("--road-side-assistance", action="store_true", help="Road Side Assistance")
    parser.add_argument("--geo-extension", action="store_true", help="Geographical Extension")
    parser.add_argument("--courtesy-car", action="store_true", help="Courtesy Car")
    parser.add_argument("--additional-towing", action="store_true", help="Additional Towing")
    parser.add_argument("--medical-expenses", action="store_true", help="Medical Expenses")
    parser.add_argument("--loss-of-key", action="store_true", help="Loss of Key")
    parser.add_argument("--tyre-rim-si", type=float, default=0, 
                       choices=[0, 25000, 50000, 100000, 200000],
                       help="Tyre & RIM SI")
    parser.add_argument("--personal-effects", action="store_true", help="Personal Effects")
    
    # Add-ons (TP)
    parser.add_argument("--cpa", action="store_true", help="CPA Owner Driver")
    parser.add_argument("--ll-driver", action="store_true", help="LL to Paid Driver")
    
    # Config
    parser.add_argument("--config-dir", help="Configuration directory path")
    parser.add_argument("--output-format", choices=["text", "json"], default="text",
                       help="Output format")
    
    args = parser.parse_args()
    
    try:
        calculate_single(args)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
