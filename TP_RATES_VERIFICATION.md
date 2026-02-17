# TP Rates Verification - Vehicle Type Analysis

## Question
**Are TP (Third Party) rates the same if vehicle type is new?**

## Answer
**YES** - TP rates are **EXACTLY THE SAME** regardless of whether the vehicle is new or old.

---

## Executive Summary

✅ **TP rates depend ONLY on Cubic Capacity (CC), NOT on vehicle type or age**  
✅ **Implementation is correct and matches Excel exactly**  
✅ **No code changes needed**

---

## Detailed Analysis

### Excel Formula Investigation

**Extracted TP Formula from Excel (Column AT, Row 5):**
```excel
=IF(C5="Upto 1000cc",2094,IF(C5="1000cc - 1500cc",3416,7897))
```

**Formula Breakdown:**
- **C5**: Cubic Capacity (CC) category
- **Returns:** 
  - ₹2,094 if CC is "Upto 1000cc"
  - ₹3,416 if CC is "1000cc - 1500cc"
  - ₹7,897 if CC is "Above 1500cc"

**Key Observation:**
- Formula references **ONLY Column C** (CC category)
- Formula does **NOT reference Column B** (Vehicle Type)
- Formula does **NOT reference Column E** (Purchase Date/Age)

**Conclusion:** Excel formula proves TP rates are independent of vehicle type/age.

---

## Code Implementation Review

### Rate Lookup Service (`rate_lookup.py`)

**Method: `get_tp_base_rate()`**
```python
def get_tp_base_rate(self, cc_category: str) -> float:
    """
    Lookup TP base rate
    
    Args:
        cc_category: Cubic capacity category
        
    Returns:
        TP premium amount
    """
    for rate in self.tp_rates:
        if rate["cc_category"] == cc_category:
            return rate["premium"]
    
    raise ValueError(f"No TP rate found for cc_category={cc_category}")
```

**Parameters:**
- ✅ Takes only `cc_category`
- ✅ Does NOT take `vehicle_type` or `age`

**Configuration File: `tp_base_rates.json`**
```json
{
  "version": "2025-v1",
  "effective_date": "2025-01-01",
  "description": "Third Party Base Rates by cubic capacity",
  "rates": [
    {"cc_category": "upto_1000cc", "premium": 2094},
    {"cc_category": "1000cc_1500cc", "premium": 3416},
    {"cc_category": "above_1500cc", "premium": 7897}
  ]
}
```

**Structure:**
- ✅ Only `cc_category` and `premium` fields
- ✅ No `vehicle_type` or `age` fields

**Conclusion:** Code implementation correctly matches Excel logic.

---

## Test Results

### Test Scenario: Same CC, Different Ages

| Test | Vehicle Type | Age (Years) | CC Category | TP Premium |
|------|--------------|-------------|-------------|------------|
| 1 | New | 2 | 1000cc_1500cc | ₹3,416.00 |
| 2 | Old | 7 | 1000cc_1500cc | ₹3,416.00 |
| 3 | Very Old | 10 | 1000cc_1500cc | ₹3,416.00 |

**Result:** ✅ All have IDENTICAL TP premium of ₹3,416.00

### TP Rates by CC Category

| CC Category | TP Premium |
|-------------|------------|
| upto_1000cc | ₹2,094 |
| 1000cc_1500cc | ₹3,416 |
| above_1500cc | ₹7,897 |

**Result:** ✅ TP rates vary ONLY by CC category, as expected

---

## Verification Checklist

- [x] Checked Excel formula for TP calculation
- [x] Confirmed formula uses only CC category
- [x] Verified formula does NOT use vehicle type
- [x] Verified formula does NOT use vehicle age
- [x] Reviewed code implementation
- [x] Confirmed code matches Excel logic
- [x] Tested with multiple vehicle ages
- [x] Confirmed all ages have same TP rate
- [x] Tested with different CC categories
- [x] Confirmed CC categories have different TP rates
- [x] Documented findings

---

## Why This Makes Sense

**Third Party (TP) Insurance:**
- Covers damage to **other people/vehicles**
- Risk is based on potential damage vehicle can cause
- Larger engines (higher CC) → potentially higher speeds → higher risk
- **Age does NOT affect third-party risk** - a 10-year-old car can cause the same damage as a new car

**Own Damage (OD) Insurance:**
- Covers damage to **your own vehicle**
- Risk is based on vehicle's current value and repair costs
- **Age DOES affect OD rates** - older vehicles depreciate and have lower values

**This is standard insurance practice in India and worldwide.**

---

## Regulatory Context

**IRDAI (Insurance Regulatory and Development Authority of India):**
- Third Party rates are **mandated by government**
- Rates are **uniform across all insurers**
- Rates depend on **vehicle category and CC**
- Rates do **NOT vary by vehicle age**

**Own Damage rates:**
- Set by individual insurers (within guidelines)
- Vary by vehicle age, make, model, zone
- Market-driven pricing

---

## Conclusion

### Summary

1. ✅ **Excel Formula Analysis:** TP formula uses only CC category
2. ✅ **Code Implementation:** Correctly implements CC-based lookup
3. ✅ **Test Results:** Confirmed same TP for all vehicle ages
4. ✅ **Insurance Logic:** Matches industry standards
5. ✅ **Regulatory Compliance:** Aligns with IRDAI guidelines

### Final Answer

**TP rates are THE SAME for new and old vehicles** (as long as they have the same CC category).

**No code changes needed** - implementation is correct and matches Excel exactly.

---

## Additional Information

### How to Verify This Yourself

**Using the Calculator:**
```python
from src.premium_calculator.core.calculator import PremiumCalculator

calc = PremiumCalculator()

# Test new vehicle
new_vehicle = {
    "cc_category": "1000cc_1500cc",
    "purchase_date": "2024-01-01",  # New
    # ... other fields
}
result_new = calc.calculate(new_vehicle)

# Test old vehicle
old_vehicle = {
    "cc_category": "1000cc_1500cc",
    "purchase_date": "2015-01-01",  # 9 years old
    # ... other fields
}
result_old = calc.calculate(old_vehicle)

# Compare TP premiums
print(f"New vehicle TP: ₹{result_new['calculations']['basic_tp_premium']}")
print(f"Old vehicle TP: ₹{result_old['calculations']['basic_tp_premium']}")
# Both will show: ₹3,416.00
```

### Configuration Files to Check

- `config/tp_base_rates.json` - TP rate configuration
- No age or vehicle_type fields present
- Only cc_category determines rate

---

**Date:** 2026-02-17  
**Status:** ✅ VERIFIED AND DOCUMENTED  
**Accuracy:** 100% (Matches Excel)  
**Action Required:** None - Implementation is correct
