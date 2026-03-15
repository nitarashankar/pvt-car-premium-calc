"""
Tests for GCV Premium Calculator
Verifies calculation formulas match the GCV Calculator Excel exactly
"""
import pytest
from src.premium_calculator.core.gcv_calculator import GCVPremiumCalculator


@pytest.fixture
def calculator():
    return GCVPremiumCalculator()


def test_gcv_basic_calculation(calculator):
    """Test basic GCV calculation matches Excel example"""
    input_data = {
        "policy_type": "Package",
        "vehicle_type": "Preowned",
        "gvw": 2735,
        "zone": "C",
        "purchase_date": "2023-12-14",
        "renewal_date": "2026-03-15",
        "idv": 750000,
        "ncb_percent": 0.45,
        "od_discount_percent": 70,
        "builtin_cng_lpg": 1,
        "cng_lpg_si": 0,
        "nil_dep": 1,
        "return_to_invoice": 1,
        "consumables": 1,
        "road_side_assistance": 1,
        "additional_towing": 1,
        "additional_towing_si": 20000,
        "imt23_cover": 1,
        "electrical_accessories_si": 28000,
        "non_electrical_accessories_si": 35000,
        "cpa_owner_driver": 1,
        "ll_paid_driver": 1,
        "nfpp": 0,
    }
    result = calculator.calculate(input_data)
    c = result["calculations"]

    # Verify age
    assert c["age_years"] > 2.0
    assert c["age_years"] < 3.0

    # Verify OD base rate for Zone C, age <= 5
    assert c["od_base_rate_percent"] == 1.726

    # Verify basic OD = IDV * 1.726% (no GVW surcharge as GVW < 12000)
    expected_basic_od = round(750000 * 1.726 / 100, 2)
    assert c["basic_od_premium"] == expected_basic_od

    # Verify electrical accessories = 28000 * 4%
    assert c["electrical_accessories_premium"] == 1120.0

    # Verify non-electrical accessories = 35000 * 1.726%
    assert c["non_electrical_accessories_premium"] == 604.10

    # Verify TP premium for GVW <= 7500
    assert c["basic_tp_premium"] == 16049

    # Verify CPA = 275
    assert c["cpa_owner_premium"] == 275.0

    # Verify LL = 50 * 1 = 50
    assert c["ll_paid_driver_premium"] == 50.0

    # Verify CNG TP = 60 (builtin_cng_lpg is 1)
    assert c["cng_lpg_tp_premium"] == 60.0

    # Verify total premium is positive
    assert c["total_premium"] > 0

    # Verify result structure
    assert "inputs" in result
    assert "calculations" in result
    assert "display" in result
    assert "summary" in result


def test_gcv_tp_rates(calculator):
    """Test TP rates for various GVW slabs"""
    base = {
        "policy_type": "Third Party",
        "vehicle_type": "New",
        "zone": "C",
        "purchase_date": "2025-01-01",
        "idv": 100000,
    }

    # GVW <= 7500
    result = calculator.calculate({**base, "gvw": 5000})
    assert result["calculations"]["basic_tp_premium"] == 16049

    # GVW <= 12000
    result = calculator.calculate({**base, "gvw": 10000})
    assert result["calculations"]["basic_tp_premium"] == 27186

    # GVW <= 20000
    result = calculator.calculate({**base, "gvw": 15000})
    assert result["calculations"]["basic_tp_premium"] == 35313

    # GVW <= 40000
    result = calculator.calculate({**base, "gvw": 30000})
    assert result["calculations"]["basic_tp_premium"] == 43950

    # GVW > 40000
    result = calculator.calculate({**base, "gvw": 50000})
    assert result["calculations"]["basic_tp_premium"] == 44242


def test_gcv_od_rates_by_zone(calculator):
    """Test OD rates vary by zone"""
    base = {
        "policy_type": "Package",
        "vehicle_type": "New",
        "gvw": 5000,
        "purchase_date": "2024-01-01",
        "renewal_date": "2025-01-01",
        "idv": 100000,
    }

    # Zone A, age ~1 year (<=5)
    result_a = calculator.calculate({**base, "zone": "A"})
    assert result_a["calculations"]["od_base_rate_percent"] == 1.751

    # Zone B
    result_b = calculator.calculate({**base, "zone": "B"})
    assert result_b["calculations"]["od_base_rate_percent"] == 1.743

    # Zone C
    result_c = calculator.calculate({**base, "zone": "C"})
    assert result_c["calculations"]["od_base_rate_percent"] == 1.726


def test_gcv_gvw_surcharge(calculator):
    """Test GVW surcharge for vehicles > 12000 kg"""
    base = {
        "policy_type": "Standalone OD",
        "vehicle_type": "New",
        "zone": "C",
        "purchase_date": "2024-06-01",
        "renewal_date": "2025-06-01",
        "idv": 1000000,
        "gvw": 15000,
    }
    result = calculator.calculate(base)
    c = result["calculations"]

    # Basic OD = IDV * rate% + CEILING((15000-12000)/100)*27
    import math
    expected_surcharge = math.ceil((15000 - 12000) / 100) * 27
    expected_od = round(1000000 * 1.726 / 100 + expected_surcharge, 2)
    assert c["basic_od_premium"] == expected_od
    assert expected_surcharge == 810  # 30 * 27 = 810


def test_gcv_no_gvw_surcharge(calculator):
    """Test no GVW surcharge for vehicles <= 12000 kg"""
    base = {
        "policy_type": "Standalone OD",
        "vehicle_type": "New",
        "zone": "C",
        "purchase_date": "2024-06-01",
        "renewal_date": "2025-06-01",
        "idv": 500000,
        "gvw": 10000,
    }
    result = calculator.calculate(base)
    c = result["calculations"]

    expected_od = round(500000 * 1.726 / 100, 2)
    assert c["basic_od_premium"] == expected_od


def test_gcv_nil_dep_age_slabs(calculator):
    """Test Nil Dep premium varies by age"""
    base = {
        "policy_type": "Standalone OD",
        "vehicle_type": "New",
        "zone": "C",
        "idv": 100000,
        "gvw": 5000,
        "nil_dep": 1,
    }

    # Age < 0.5 → 10% of (basic_od + elec + non_elec)
    result = calculator.calculate({
        **base, "purchase_date": "2025-12-01", "renewal_date": "2026-03-01"
    })
    basic_od = result["calculations"]["basic_od_premium"]
    assert result["calculations"]["nil_dep_premium"] == round(basic_od * 0.10, 2)

    # Age ~1.0 (< 1.5) → 20%
    result = calculator.calculate({
        **base, "purchase_date": "2025-01-01", "renewal_date": "2026-02-01"
    })
    basic_od = result["calculations"]["basic_od_premium"]
    assert result["calculations"]["nil_dep_premium"] == round(basic_od * 0.20, 2)

    # Age > 1.5 → 30%
    result = calculator.calculate({
        **base, "purchase_date": "2023-01-01", "renewal_date": "2025-06-01"
    })
    basic_od = result["calculations"]["basic_od_premium"]
    assert result["calculations"]["nil_dep_premium"] == round(basic_od * 0.30, 2)


def test_gcv_imt23(calculator):
    """Test IMT 23 Cover premium"""
    input_data = {
        "policy_type": "Standalone OD",
        "vehicle_type": "New",
        "gvw": 5000,
        "zone": "C",
        "purchase_date": "2024-01-01",
        "renewal_date": "2025-06-01",
        "idv": 500000,
        "imt23_cover": 1,
        "electrical_accessories_si": 10000,
        "non_electrical_accessories_si": 5000,
        "od_discount_percent": 0,
    }
    result = calculator.calculate(input_data)
    c = result["calculations"]

    # IMT 23 = (basic_od + elec + non_elec - od_discount) * 15%
    expected_base = c["basic_od_premium"] + c["electrical_accessories_premium"] + c["non_electrical_accessories_premium"] - c["od_discount_amount"]
    # Allow minor rounding tolerance due to ROUND_HALF_UP
    assert abs(c["imt23_premium"] - expected_base * 0.15) < 0.02


def test_gcv_towing_tiers(calculator):
    """Test Additional Towing with two SI tiers"""
    base = {
        "policy_type": "Standalone OD",
        "vehicle_type": "New",
        "gvw": 5000,
        "zone": "C",
        "purchase_date": "2024-01-01",
        "renewal_date": "2025-06-01",
        "idv": 500000,
        "additional_towing": 1,
    }

    # SI <= 10000 → 5%
    result = calculator.calculate({**base, "additional_towing_si": 8000})
    assert result["calculations"]["towing_charges_premium"] == 400.0  # 8000 * 5%

    # SI > 10000 → 7.5%
    result = calculator.calculate({**base, "additional_towing_si": 20000})
    assert result["calculations"]["towing_charges_premium"] == 1500.0  # 20000 * 7.5%


def test_gcv_gst_split(calculator):
    """Test GCV uses split IGST: OD @18% and TP @5%"""
    input_data = {
        "policy_type": "Package",
        "vehicle_type": "New",
        "gvw": 5000,
        "zone": "C",
        "purchase_date": "2024-01-01",
        "renewal_date": "2025-06-01",
        "idv": 500000,
        "cpa_owner_driver": 1,
        "ll_paid_driver": 1,
    }
    result = calculator.calculate(input_data)
    c = result["calculations"]

    # IGST OD = (net_od + CPA + LL) * 18%
    expected_igst_od = round((c["net_od_premium"] + c["cpa_owner_premium"] + c["ll_paid_driver_premium"]) * 0.18, 2)
    assert c["igst_od"] == expected_igst_od

    # IGST TP = (basic_tp + cng_tp) * 5%
    expected_igst_tp = round((c["basic_tp_premium"] + c["cng_lpg_tp_premium"]) * 0.05, 2)
    assert c["igst_tp"] == expected_igst_tp


def test_gcv_third_party_only(calculator):
    """Test Third Party Only mode - no OD components"""
    input_data = {
        "policy_type": "Third Party",
        "vehicle_type": "New",
        "gvw": 5000,
        "zone": "C",
        "purchase_date": "2024-01-01",
        "idv": 500000,
        "nil_dep": 1,
        "cpa_owner_driver": 1,
        "ll_paid_driver": 2,
    }
    result = calculator.calculate(input_data)
    c = result["calculations"]

    assert c["basic_od_premium"] == 0
    assert c["nil_dep_premium"] == 0
    assert c["net_od_premium"] == 0
    assert c["basic_tp_premium"] == 16049
    assert c["cpa_owner_premium"] == 275.0
    assert c["ll_paid_driver_premium"] == 100.0
    assert c["total_premium"] > 0


def test_gcv_standalone_od(calculator):
    """Test Standalone OD mode - no TP components"""
    input_data = {
        "policy_type": "Standalone OD",
        "vehicle_type": "New",
        "gvw": 5000,
        "zone": "C",
        "purchase_date": "2024-01-01",
        "renewal_date": "2025-06-01",
        "idv": 500000,
        "cpa_owner_driver": 1,
    }
    result = calculator.calculate(input_data)
    c = result["calculations"]

    assert c["basic_od_premium"] > 0
    assert c["basic_tp_premium"] == 0
    assert c["cpa_owner_premium"] == 0
    assert c["net_tp_premium"] == 0
    assert c["total_premium"] > 0


def test_gcv_od_discount_formula(calculator):
    """Test OD discount = ((basic_od + non_electrical) * od_discount%) / 100"""
    input_data = {
        "policy_type": "Standalone OD",
        "vehicle_type": "New",
        "gvw": 5000,
        "zone": "C",
        "purchase_date": "2024-01-01",
        "renewal_date": "2025-06-01",
        "idv": 500000,
        "od_discount_percent": 50,
        "non_electrical_accessories_si": 20000,
    }
    result = calculator.calculate(input_data)
    c = result["calculations"]

    # OD discount base is basic_od + non_electrical, NOT including electrical
    expected_discount = round(
        (c["basic_od_premium"] + c["non_electrical_accessories_premium"]) * 50 / 100, 2
    )
    assert c["od_discount_amount"] == expected_discount


def test_gcv_nfpp_employee(calculator):
    """Test NFPP Employee premium = 75 * count"""
    input_data = {
        "policy_type": "Package",
        "vehicle_type": "New",
        "gvw": 5000,
        "zone": "C",
        "purchase_date": "2024-01-01",
        "renewal_date": "2025-06-01",
        "idv": 500000,
        "nfpp_employee": 5,
        "nfpp_non_employee": 0,
    }
    result = calculator.calculate(input_data)
    c = result["calculations"]

    assert c["nfpp_employee_premium"] == 375.0  # 75 * 5
    assert c["nfpp_non_employee_premium"] == 0
    # NFPP included in net TP
    assert c["nfpp_employee_premium"] > 0


def test_gcv_nfpp_non_employee(calculator):
    """Test NFPP Non-Employee premium = 75 * count"""
    input_data = {
        "policy_type": "Package",
        "vehicle_type": "New",
        "gvw": 5000,
        "zone": "C",
        "purchase_date": "2024-01-01",
        "renewal_date": "2025-06-01",
        "idv": 500000,
        "nfpp_employee": 0,
        "nfpp_non_employee": 3,
    }
    result = calculator.calculate(input_data)
    c = result["calculations"]

    assert c["nfpp_non_employee_premium"] == 225.0  # 75 * 3
    assert c["nfpp_employee_premium"] == 0


def test_gcv_nfpp_both_types(calculator):
    """Test both NFPP types together, included in TP and IGST @18%"""
    input_data = {
        "policy_type": "Package",
        "vehicle_type": "New",
        "gvw": 5000,
        "zone": "C",
        "purchase_date": "2024-01-01",
        "renewal_date": "2025-06-01",
        "idv": 500000,
        "nfpp_employee": 4,
        "nfpp_non_employee": 2,
        "cpa_owner_driver": 0,
        "ll_paid_driver": 0,
    }
    result = calculator.calculate(input_data)
    c = result["calculations"]

    assert c["nfpp_employee_premium"] == 300.0  # 75 * 4
    assert c["nfpp_non_employee_premium"] == 150.0  # 75 * 2

    # Net TP includes NFPP
    expected_net_tp = c["basic_tp_premium"] + c["nfpp_employee_premium"] + c["nfpp_non_employee_premium"] + c["cng_lpg_tp_premium"]
    assert abs(c["net_tp_premium"] - expected_net_tp) < 0.02

    # IGST @18% includes NFPP premiums
    expected_igst_od = round((c["net_od_premium"] + c["nfpp_employee_premium"] + c["nfpp_non_employee_premium"]) * 0.18, 2)
    assert abs(c["igst_od"] - expected_igst_od) < 0.02


def test_gcv_towing_cap_at_20000(calculator):
    """Test towing SI is capped at Rs.20,000 for GCV"""
    base = {
        "policy_type": "Standalone OD",
        "vehicle_type": "New",
        "gvw": 5000,
        "zone": "C",
        "purchase_date": "2024-06-01",
        "renewal_date": "2025-06-01",
        "idv": 500000,
        "additional_towing": 1,
    }

    # SI = 20000: exactly at cap, 7.5% rate
    result = calculator.calculate({**base, "additional_towing_si": 20000})
    assert result["calculations"]["towing_charges_premium"] == 1500.0  # 20000 * 7.5%

    # SI = 30000: should be capped at 20000, so still 1500
    result = calculator.calculate({**base, "additional_towing_si": 30000})
    assert result["calculations"]["towing_charges_premium"] == 1500.0  # capped at 20000 * 7.5%

    # SI = 50000: also capped at 20000
    result = calculator.calculate({**base, "additional_towing_si": 50000})
    assert result["calculations"]["towing_charges_premium"] == 1500.0  # capped at 20000 * 7.5%
