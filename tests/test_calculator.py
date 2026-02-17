"""
Test Premium Calculator against Excel sample data
"""
import sys
from pathlib import Path

# Add src to path
src_path = Path(__file__).parent.parent / "src"
sys.path.insert(0, str(src_path))

from premium_calculator.core.calculator import PremiumCalculator


def test_basic_calculation():
    """Test calculator with Excel sample data (Row 5)"""
    
    # Initialize calculator
    calc = PremiumCalculator()
    
    # Input data from Excel Row 5
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
    
    # Print results
    print("=" * 80)
    print("PREMIUM CALCULATION RESULTS")
    print("=" * 80)
    print()
    
    print("INPUT DATA:")
    print(f"  Vehicle Age: {result['calculations']['age_years']} years")
    print(f"  Zone: {input_data['zone']}")
    print(f"  CC Category: {input_data['cc_category']}")
    print(f"  IDV: ₹{input_data['idv']:,.2f}")
    print(f"  NCB: {input_data['ncb_percent']*100}%")
    print(f"  OD Discount: {input_data['od_discount_percent']}%")
    print()
    
    calc_data = result['calculations']
    
    print("CALCULATED VALUES:")
    print(f"  OD Base Rate: {calc_data['od_base_rate_percent']}%")
    print(f"  Basic OD Premium: ₹{calc_data['basic_od_premium']:,.2f}")
    print()
    
    print("OD ADD-ONS:")
    print(f"  Nil Depreciation: ₹{calc_data['nil_dep_premium']:,.2f}")
    print(f"  Engine Protection: ₹{calc_data['engine_protection_premium']:,.2f}")
    print(f"  Return to Invoice: ₹{calc_data['return_to_invoice_premium']:,.2f}")
    print(f"  NCB Protection: ₹{calc_data['ncb_protect_premium']:,.2f}")
    print(f"  Consumables: ₹{calc_data['consumables_premium']:,.2f}")
    print(f"  Road Side Assistance: ₹{calc_data['road_side_assistance_premium']:,.2f}")
    print(f"  Geo Extension (OD): ₹{calc_data['geo_extension_od_premium']:,.2f}")
    print(f"  Built-in CNG (OD): ₹{calc_data['builtin_cng_od_premium']:,.2f}")
    print(f"  Medical Expenses: ₹{calc_data['medical_expenses_premium']:,.2f}")
    print(f"  Tyre & RIM: ₹{calc_data['tyre_rim_premium']:,.2f}")
    print(f"  Personal Effects: ₹{calc_data['personal_effects_premium']:,.2f}")
    print(f"  Courtesy Car: ₹{calc_data['courtesy_car_premium']:,.2f}")
    print(f"  Towing Charges: ₹{calc_data['towing_charges_premium']:,.2f}")
    print(f"  Loss of Key: ₹{calc_data['loss_of_key_premium']:,.2f}")
    print()
    
    print("TP PREMIUMS:")
    print(f"  Basic TP: ₹{calc_data['basic_tp_premium']:,.2f}")
    print(f"  CPA Owner Driver: ₹{calc_data['cpa_owner_premium']:,.2f}")
    print(f"  LL to Paid Driver: ₹{calc_data['ll_paid_driver_premium']:,.2f}")
    print(f"  CNG/LPG (TP): ₹{calc_data['cng_lpg_tp_premium']:,.2f}")
    print(f"  Geo Extension (TP): ₹{calc_data['geo_extension_tp_premium']:,.2f}")
    print()
    
    print("DISCOUNTS:")
    print(f"  OD Discount: ₹{calc_data['od_discount_amount']:,.2f}")
    print(f"  NCB Discount: ₹{calc_data['ncb_discount_amount']:,.2f}")
    print()
    
    print("FINAL PREMIUM:")
    print(f"  Net Premium: ₹{calc_data['net_premium']:,.2f}")
    print(f"  CGST @ 9%: ₹{calc_data['cgst']:,.2f}")
    print(f"  SGST @ 9%: ₹{calc_data['sgst']:,.2f}")
    print(f"  TOTAL PREMIUM: ₹{calc_data['total_premium']:,.2f}")
    print()
    print("=" * 80)
    
    return result


if __name__ == "__main__":
    result = test_basic_calculation()
    print("\n✅ Test completed successfully!")
