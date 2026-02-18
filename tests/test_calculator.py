"""
Test Premium Calculator against Excel sample data
"""
import csv
import io
import sys
from pathlib import Path

# Add src to path
src_path = Path(__file__).parent.parent / "src"
sys.path.insert(0, str(src_path))

from premium_calculator.core.calculator import PremiumCalculator
from premium_calculator.core.csv_processor import CSVProcessor, InputValidator


def _get_sample_input():
    """Return sample input data from Excel Row 5"""
    return {
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


def test_basic_calculation():
    """Test calculator with Excel sample data (Row 5) - with assertions"""
    calc = PremiumCalculator()
    input_data = _get_sample_input()
    result = calc.calculate(input_data)

    # Verify result structure has all 3 sections
    assert "inputs" in result
    assert "calculations" in result
    assert "display" in result
    assert "summary" in result

    c = result["calculations"]

    # AA - Vehicle age
    assert c["age_years"] >= 1

    # AB - OD base rate for Zone A, 1000cc-1500cc, age 1
    assert c["od_base_rate_percent"] == 3.283

    # AC - Basic OD = IDV * rate / 100 = 125000 * 3.283 / 100 = 4103.75
    assert c["basic_od_premium"] == 4103.75

    # AD - Nil dep (20% of basic OD for age 1-2)
    assert c["nil_dep_premium"] == 820.75

    # AE - Engine protection (0.16% of IDV for age 1-2)
    assert c["engine_protection_premium"] == 200.0

    # AF - Road side assistance (flat 50)
    assert c["road_side_assistance_premium"] == 50.0

    # AG - Return to invoice (0.20% of IDV for age 1-2)
    assert c["return_to_invoice_premium"] == 250.0

    # AH - NCB protect (0.15% of IDV)
    assert c["ncb_protect_premium"] == 187.5

    # AI - Consumables (0.12% of IDV for age 1-2)
    assert c["consumables_premium"] == 150.0

    # AJ - Geo extension OD (flat 400)
    assert c["geo_extension_od_premium"] == 400.0

    # AK - Built-in CNG OD (2% of basic OD for age 1-2)
    assert c["builtin_cng_od_premium"] == 82.08

    # AL - CNG/LPG OD (0 since cng_lpg_si=0)
    assert c["cng_lpg_od_premium"] == 0

    # AM - Loss of key (flat 750)
    assert c["loss_of_key_premium"] == 750.0

    # AN - Towing (flat 75)
    assert c["towing_charges_premium"] == 75.0

    # AO - Medical expenses (325 for age 1-5)
    assert c["medical_expenses_premium"] == 325.0

    # AP - Tyre & RIM (4000 for SI=100000)
    assert c["tyre_rim_premium"] == 4000.0

    # AQ - Personal effects (flat 500)
    assert c["personal_effects_premium"] == 500.0

    # AR - Courtesy car (450 for age 1-5)
    assert c["courtesy_car_premium"] == 450.0

    # AS - Road tax (0 since road_tax_cover=0)
    assert c["road_tax_premium"] == 0

    # AT - Basic TP (3416 for 1000cc-1500cc)
    assert c["basic_tp_premium"] == 3416.0

    # AU - CPA owner driver (flat 275)
    assert c["cpa_owner_premium"] == 275.0

    # AV - LL paid driver (flat 50)
    assert c["ll_paid_driver_premium"] == 50.0

    # AW - CNG/LPG TP (60 since builtin_cng_lpg=1)
    assert c["cng_lpg_tp_premium"] == 60.0

    # AX - Geo extension TP (flat 100)
    assert c["geo_extension_tp_premium"] == 100.0

    # AY - OD discount = basic_od * 60% = 4103.75 * 0.6 = 2462.25
    assert c["od_discount_amount"] == 2462.25

    # AZ - NCB discount: ((basic_od - od_disc) + nil_dep + rti + geo_od + cng_od) * 0.2
    # = ((4103.75 - 2462.25) + 820.75 + 250.0 + 400.0 + 82.08) * 0.2
    # = 3194.33 * 0.2 = 638.87
    assert c["ncb_discount_amount"] == 638.87

    # BA - Net premium
    assert c["net_premium"] > 0

    # BB-BC - GST
    assert c["cgst"] > 0
    assert c["sgst"] > 0

    # BD - Total premium
    assert c["total_premium"] > c["net_premium"]


def test_result_has_all_86_fields():
    """Test that calculator returns all 86 fields (26 input + 30 calc + 30 display)"""
    calc = PremiumCalculator()
    result = calc.calculate(_get_sample_input())

    # 30 calculation fields (AA-BD)
    expected_calc_fields = [
        "age_years", "od_base_rate_percent", "basic_od_premium",
        "nil_dep_premium", "engine_protection_premium", "road_side_assistance_premium",
        "return_to_invoice_premium", "ncb_protect_premium", "consumables_premium",
        "geo_extension_od_premium", "builtin_cng_od_premium", "cng_lpg_od_premium",
        "loss_of_key_premium", "towing_charges_premium", "medical_expenses_premium",
        "tyre_rim_premium", "personal_effects_premium", "courtesy_car_premium",
        "road_tax_premium", "basic_tp_premium", "cpa_owner_premium",
        "ll_paid_driver_premium", "cng_lpg_tp_premium", "geo_extension_tp_premium",
        "od_discount_amount", "ncb_discount_amount", "net_premium",
        "cgst", "sgst", "total_premium"
    ]
    assert len(expected_calc_fields) == 30

    for field in expected_calc_fields:
        assert field in result["calculations"], f"Missing calculation field: {field}"

    # 30 display fields (BE-CH)
    for field in expected_calc_fields:
        display_field = field + "_display"
        assert display_field in result["display"], f"Missing display field: {display_field}"
        assert result["display"][display_field] == result["calculations"][field], \
            f"Display field {display_field} doesn't match calculation"

    # 26 input fields (A-Z)
    expected_input_fields = [
        "policy_type", "vehicle_type", "cc_category", "zone", "purchase_date", "idv",
        "ncb_percent", "od_discount_percent", "builtin_cng_lpg", "cng_lpg_si",
        "nil_dep", "return_to_invoice", "ncb_protect", "engine_protection",
        "consumables", "road_side_assistance", "geo_extension", "road_tax_cover",
        "courtesy_car", "additional_towing", "medical_expenses", "loss_of_key",
        "tyre_rim_si", "personal_effects", "cpa_owner_driver", "ll_paid_driver"
    ]
    assert len(expected_input_fields) == 26

    for field in expected_input_fields:
        assert field in result["inputs"], f"Missing input field: {field}"


def test_third_party_only():
    """Test Third Party only policy - OD fields should be zero"""
    calc = PremiumCalculator()
    input_data = _get_sample_input()
    input_data["policy_type"] = "Third Party"

    result = calc.calculate(input_data)
    c = result["calculations"]

    # OD premiums should be zero
    assert c["basic_od_premium"] == 0
    assert c["od_base_rate_percent"] == 0
    assert c["nil_dep_premium"] == 0
    assert c["engine_protection_premium"] == 0
    assert c["od_discount_amount"] == 0
    assert c["ncb_discount_amount"] == 0

    # TP premiums should be non-zero
    assert c["basic_tp_premium"] == 3416.0
    assert c["cpa_owner_premium"] == 275.0


def test_standalone_od():
    """Test Standalone OD policy - TP fields should be zero"""
    calc = PremiumCalculator()
    input_data = _get_sample_input()
    input_data["policy_type"] = "Standalone OD"

    result = calc.calculate(input_data)
    c = result["calculations"]

    # OD premiums should be non-zero
    assert c["basic_od_premium"] > 0

    # TP premiums should be zero
    assert c["basic_tp_premium"] == 0
    assert c["cpa_owner_premium"] == 0
    assert c["ll_paid_driver_premium"] == 0
    assert c["cng_lpg_tp_premium"] == 0
    assert c["geo_extension_tp_premium"] == 0


def test_csv_processing_end_to_end():
    """Test CSV upload → processing → export end-to-end"""
    csv_input = (
        "policy_type,vehicle_type,cc_category,zone,purchase_date,idv,"
        "ncb_percent,od_discount_percent,builtin_cng_lpg,cng_lpg_si,"
        "nil_dep,return_to_invoice,ncb_protect,engine_protection,"
        "consumables,road_side_assistance,geo_extension,road_tax_cover,"
        "courtesy_car,additional_towing,medical_expenses,loss_of_key,"
        "tyre_rim_si,personal_effects,cpa_owner_driver,ll_paid_driver\n"
        "Package,New,1000cc_1500cc,A,2025-01-01,125000,"
        "20,60,1,0,1,1,1,1,1,1,1,0,1,1,1,1,100000,1,1,1\n"
        "Third Party,Existing,above_1500cc,B,2020-01-01,200000,"
        "0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n"
    )

    proc = CSVProcessor()
    results = proc.process_csv_content(csv_input)

    # Both rows should process successfully
    assert results["total_rows"] == 2
    assert results["successful"] == 2
    assert results["failed"] == 0
    assert len(results["results"]) == 2

    # Generate output CSV
    output = proc.generate_output_csv(results["results"])

    # Parse with csv module for reliable column handling
    reader = csv.reader(io.StringIO(output))
    header_cols = next(reader)
    data_rows = list(reader)

    # Header + 2 data rows
    assert len(data_rows) == 2

    # Should have 88 columns (row_number + 27 input + 30 calc + 30 display)
    assert len(header_cols) == 88, f"Expected 88 columns, got {len(header_cols)}"

    # Verify column names include row_number, all inputs, calcs, and display fields
    assert header_cols[0] == "row_number"
    assert "total_premium" in header_cols
    assert "total_premium_display" in header_cols


def test_csv_input_validation():
    """Test CSV validation catches invalid data"""
    csv_input = (
        "cc_category,zone,purchase_date,idv\n"
        "invalid_cc,X,2025-01-01,125000\n"
    )

    proc = CSVProcessor()
    results = proc.process_csv_content(csv_input)

    assert results["failed"] == 1
    assert len(results["errors"]) == 1
    assert len(results["errors"][0]["errors"]) > 0


def test_no_addons():
    """Test calculation with no add-ons enabled"""
    calc = PremiumCalculator()
    input_data = {
        "policy_type": "Package",
        "vehicle_type": "New",
        "cc_category": "1000cc_1500cc",
        "zone": "A",
        "purchase_date": "2025-01-01",
        "idv": 125000,
        "ncb_percent": 0,
        "od_discount_percent": 0,
        "builtin_cng_lpg": 0,
        "cng_lpg_si": 0,
        "nil_dep": 0,
        "return_to_invoice": 0,
        "ncb_protect": 0,
        "engine_protection": 0,
        "consumables": 0,
        "road_side_assistance": 0,
        "geo_extension": 0,
        "road_tax_cover": 0,
        "courtesy_car": 0,
        "additional_towing": 0,
        "medical_expenses": 0,
        "loss_of_key": 0,
        "tyre_rim_si": 0,
        "personal_effects": 0,
        "cpa_owner_driver": 0,
        "ll_paid_driver": 0
    }

    result = calc.calculate(input_data)
    c = result["calculations"]

    # Only basic OD and TP should be non-zero
    assert c["basic_od_premium"] == 4103.75
    assert c["basic_tp_premium"] == 3416.0

    # All add-ons should be zero
    assert c["nil_dep_premium"] == 0
    assert c["engine_protection_premium"] == 0
    assert c["cng_lpg_od_premium"] == 0
    assert c["od_discount_amount"] == 0
    assert c["ncb_discount_amount"] == 0

    # Net = basic_od + basic_tp
    assert c["net_premium"] == 7519.75

    # Total = net + 9% CGST + 9% SGST
    assert c["total_premium"] == 8873.31


def test_renewal_date_age_calculation():
    """Test that renewal_date is used for age calculation when provided"""
    calc = PremiumCalculator()
    input_data = _get_sample_input()
    # Registration date: 2020-06-15, Renewal date: 2025-06-15 → age = 5
    input_data["purchase_date"] = "2020-06-15"
    input_data["renewal_date"] = "2025-06-15"

    result = calc.calculate(input_data)
    assert result["calculations"]["age_years"] == 5

    # Renewal date: 2023-06-15 → age = 3
    input_data["renewal_date"] = "2023-06-15"
    result = calc.calculate(input_data)
    assert result["calculations"]["age_years"] == 3

    # No renewal_date → falls back to today-based calculation
    input_data["renewal_date"] = ""
    result = calc.calculate(input_data)
    assert result["calculations"]["age_years"] >= 0


if __name__ == "__main__":
    test_basic_calculation()
    test_result_has_all_86_fields()
    test_third_party_only()
    test_standalone_od()
    test_csv_processing_end_to_end()
    test_csv_input_validation()
    test_no_addons()
    test_renewal_date_age_calculation()
    print("\n✅ All tests completed successfully!")
