#!/usr/bin/env python3
"""
Example usage of the Premium Calculator
Demonstrates various calculation scenarios
"""
import sys
from pathlib import Path

# Add src to path
src_path = Path(__file__).parent / "src"
sys.path.insert(0, str(src_path))

from premium_calculator.core.calculator import PremiumCalculator


def example_new_car_full_coverage():
    """Example: New car with full coverage"""
    print("\n" + "=" * 80)
    print("EXAMPLE 1: New Car with Full Coverage")
    print("=" * 80)
    
    calc = PremiumCalculator()
    
    input_data = {
        "policy_type": "Package",
        "vehicle_type": "New",
        "cc_category": "1000cc_1500cc",
        "zone": "A",
        "purchase_date": "2025-01-01",
        "idv": 125000,
        "ncb_percent": 0,  # No NCB for new car
        "od_discount_percent": 60,
        "builtin_cng_lpg": 0,
        "cng_lpg_si": 0,
        "nil_dep": 1,
        "return_to_invoice": 1,
        "ncb_protect": 0,
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
        "ll_paid_driver": 0
    }
    
    result = calc.calculate(input_data)
    print_result(result)


def example_old_car_minimal_coverage():
    """Example: Old car with minimal coverage"""
    print("\n" + "=" * 80)
    print("EXAMPLE 2: Old Car (6 years) with Minimal Coverage")
    print("=" * 80)
    
    calc = PremiumCalculator()
    
    input_data = {
        "policy_type": "Package",
        "vehicle_type": "Existing",
        "cc_category": "upto_1000cc",
        "zone": "B",
        "purchase_date": "2020-03-15",
        "idv": 75000,
        "ncb_percent": 0.50,  # 50% NCB
        "od_discount_percent": 40,
        "builtin_cng_lpg": 0,
        "cng_lpg_si": 0,
        "nil_dep": 0,
        "return_to_invoice": 0,
        "ncb_protect": 1,
        "engine_protection": 0,
        "consumables": 0,
        "road_side_assistance": 1,
        "geo_extension": 0,
        "road_tax_cover": 0,
        "courtesy_car": 0,
        "additional_towing": 0,
        "medical_expenses": 0,
        "loss_of_key": 0,
        "tyre_rim_si": 0,
        "personal_effects": 0,
        "cpa_owner_driver": 1,
        "ll_paid_driver": 0
    }
    
    result = calc.calculate(input_data)
    print_result(result)


def example_car_with_cng():
    """Example: Car with CNG kit"""
    print("\n" + "=" * 80)
    print("EXAMPLE 3: Car with External CNG Kit")
    print("=" * 80)
    
    calc = PremiumCalculator()
    
    input_data = {
        "policy_type": "Package",
        "vehicle_type": "Existing",
        "cc_category": "1000cc_1500cc",
        "zone": "A",
        "purchase_date": "2023-06-01",
        "idv": 95000,
        "ncb_percent": 0.20,  # 20% NCB
        "od_discount_percent": 50,
        "builtin_cng_lpg": 0,
        "cng_lpg_si": 25000,  # External CNG kit worth 25k
        "nil_dep": 1,
        "return_to_invoice": 0,
        "ncb_protect": 1,
        "engine_protection": 1,
        "consumables": 1,
        "road_side_assistance": 1,
        "geo_extension": 0,
        "road_tax_cover": 0,
        "courtesy_car": 0,
        "additional_towing": 1,
        "medical_expenses": 1,
        "loss_of_key": 0,
        "tyre_rim_si": 50000,
        "personal_effects": 1,
        "cpa_owner_driver": 1,
        "ll_paid_driver": 1
    }
    
    result = calc.calculate(input_data)
    print_result(result)


def print_result(result):
    """Print calculation result"""
    calc = result["calculations"]
    inputs = result["inputs"]
    
    print(f"\nVehicle Details:")
    print(f"  Age: {calc['age_years']} years")
    print(f"  Zone: {inputs['zone']}")
    print(f"  CC Category: {inputs['cc_category']}")
    print(f"  IDV: ₹{inputs['idv']:,.0f}")
    print(f"  NCB: {inputs['ncb_percent']*100:.0f}%")
    print(f"  OD Discount: {inputs['od_discount_percent']:.0f}%")
    
    print(f"\nPremium Breakdown:")
    print(f"  Basic OD: ₹{calc['basic_od_premium']:,.2f}")
    print(f"  Basic TP: ₹{calc['basic_tp_premium']:,.2f}")
    print(f"  OD Add-ons: ₹{sum([
        calc['nil_dep_premium'],
        calc['engine_protection_premium'],
        calc['return_to_invoice_premium'],
        calc['ncb_protect_premium'],
        calc['consumables_premium'],
        calc['road_side_assistance_premium'],
        calc['geo_extension_od_premium'],
        calc['builtin_cng_od_premium'],
        calc['cng_lpg_od_premium'],
        calc['medical_expenses_premium'],
        calc['tyre_rim_premium'],
        calc['personal_effects_premium'],
        calc['courtesy_car_premium'],
        calc['towing_charges_premium'],
        calc['loss_of_key_premium'],
        calc['road_tax_premium']
    ]):,.2f}")
    print(f"  TP Add-ons: ₹{sum([
        calc['cpa_owner_premium'],
        calc['ll_paid_driver_premium'],
        calc['cng_lpg_tp_premium'],
        calc['geo_extension_tp_premium']
    ]):,.2f}")
    print(f"  Less: OD Discount: -₹{calc['od_discount_amount']:,.2f}")
    print(f"  Less: NCB Discount: -₹{calc['ncb_discount_amount']:,.2f}")
    
    print(f"\n  Net Premium: ₹{calc['net_premium']:,.2f}")
    print(f"  CGST (9%): ₹{calc['cgst']:,.2f}")
    print(f"  SGST (9%): ₹{calc['sgst']:,.2f}")
    print(f"\n  ┌{'─' * 35}┐")
    print(f"  │ TOTAL PREMIUM: ₹{calc['total_premium']:>17,.2f} │")
    print(f"  └{'─' * 35}┘")


def main():
    """Run all examples"""
    print("\n" + "🚗 " * 20)
    print("PREMIUM CALCULATOR - USAGE EXAMPLES")
    print("🚗 " * 20)
    
    example_new_car_full_coverage()
    example_old_car_minimal_coverage()
    example_car_with_cng()
    
    print("\n" + "=" * 80)
    print("✅ All examples completed successfully!")
    print("=" * 80)
    print("\nTo use the calculator:")
    print("  1. CLI: python3 -m src.premium_calculator.cli --help")
    print("  2. Python API: See IMPLEMENTATION_README.md")
    print("  3. Update rates: Edit JSON files in config/")
    print()


if __name__ == "__main__":
    main()
