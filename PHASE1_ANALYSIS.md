# Phase 1: Private Car Premium Calculator - Detailed Analysis

## Executive Summary

This document provides a comprehensive analysis of the **Private Car Premium Calculator** from the "Motor Premium Calculation 2.xlsx" file. The calculator computes motor insurance premiums based on various input parameters, applying complex conditional logic, rate tables, discounts, and loadings.

---

## 1. INPUT FIELDS (User-Entered Values)

### 1.1 Policy & Vehicle Information
| Field | Column | Description | Example Value | Data Type |
|-------|--------|-------------|---------------|-----------|
| **Policy Type** | A | Type of insurance policy | Package | Text |
| **Type of Vehicle** | B | Vehicle status (New/Existing) | New | Text |
| **Cubic Capacity** | C | Engine displacement category | 1000cc - 1500cc | Text (Categorical) |
| **Zone** | D | RTO Zone (A or B) | A | Text |
| **Date of Purchase** | E | Vehicle purchase date | 2025-01-01 | Date |
| **IDV** | F | Insured Declared Value | 125000 | Numeric |

### 1.2 NCB & Discounts
| Field | Column | Description | Example Value | Data Type |
|-------|--------|-------------|---------------|-----------|
| **NCB** | G | No Claim Bonus percentage | 0.2 (20%) | Numeric (0-1) |
| **OD Discount** | H | Own Damage discount percentage | 60 | Numeric |

### 1.3 CNG/LPG Coverage
| Field | Column | Description | Example Value | Data Type |
|-------|--------|-------------|---------------|-----------|
| **Built in CNG/LPG** | I | Built-in CNG/LPG kit flag | 1 (Yes) | Boolean (0/1) |
| **CNG/LPG SI** | J | CNG/LPG Sum Insured | 0 | Numeric |

### 1.4 Add-On Covers (Own Damage)
| Field | Column | Description | Example Value | Data Type |
|-------|--------|-------------|---------------|-----------|
| **Nil Dep** | K | Zero Depreciation cover | 1 (Yes) | Boolean (0/1) |
| **Return to Invoice** | L | Return to Invoice cover | 1 (Yes) | Boolean (0/1) |
| **NCB Protect** | M | NCB Protection cover | 1 (Yes) | Boolean (0/1) |
| **Engine and Gearbox Protection** | N | Engine & Gearbox cover | 1 (Yes) | Boolean (0/1) |
| **Consumables** | O | Consumables cover | 1 (Yes) | Boolean (0/1) |
| **Road Side Assistance** | P | RSA cover | 1 (Yes) | Boolean (0/1) |
| **Geographical Area Extension** | Q | Geographical extension | 1 (Yes) | Boolean (0/1) |
| **Road Tax Cover** | R | Road tax coverage | 0 (No) | Boolean (0/1) |
| **Courtesy Car Cover** | S | Courtesy car provision | 1 (Yes) | Boolean (0/1) |
| **Additional Towing Charges** | T | Extra towing charges | 1 (Yes) | Boolean (0/1) |
| **Medical Expenses** | U | Medical expense cover | 1 (Yes) | Boolean (0/1) |
| **Loss of Key** | V | Key replacement cover | 1 (Yes) | Boolean (0/1) |
| **Tyre and RIM Protector** | W | Sum Insured for tyre/rim | 100000 | Numeric |
| **Personal Effects** | X | Personal effects cover | 1 (Yes) | Boolean (0/1) |

### 1.5 Third Party Covers
| Field | Column | Description | Example Value | Data Type |
|-------|--------|-------------|---------------|-----------|
| **CPA Owner Driver** | Y | CPA for owner driver | 1 (Yes) | Boolean (0/1) |
| **LL to Paid Driver** | Z | Legal liability to driver | 1 (Yes) | Boolean (0/1) |

**Total Input Fields: 26**

---

## 2. CALCULATION FIELDS (Derived/Intermediate Values)

### 2.1 Age Calculation
| Field | Column | Formula | Description |
|-------|--------|---------|-------------|
| **Age of Vehicle (Years)** | AA | `=DATEDIF(E5,TODAY(),"y")` | Calculates vehicle age from purchase date |

### 2.2 OD Rate Determination
| Field | Column | Formula | Description |
|-------|--------|---------|-------------|
| **OD Basic Rate** | AB | Complex nested IF | Determines base OD rate % based on Age, Zone, and Cubic Capacity |

**Formula Logic:**
```
IF Age <= 5 years:
    IF Zone = A:
        IF CC = "Upto 1000cc": 3.127%
        IF CC = "1000cc - 1500cc": 3.283%
        IF CC = ">1500cc": 3.44%
    IF Zone = B:
        IF CC = "Upto 1000cc": 3.039%
        IF CC = "1000cc - 1500cc": 3.191%
        IF CC = ">1500cc": 3.343%
        
IF Age > 5 and <= 10 years:
    [Similar structure with higher rates]
    
IF Age > 10 years:
    [Similar structure with even higher rates]
```

### 2.3 Own Damage (OD) Premium Calculations

| Field | Column | Formula | Calculation Logic |
|-------|--------|---------|-------------------|
| **Basic OD Premium** | AC | `=F5*AB5%` | IDV × OD Basic Rate |
| **Nil Dep Premium** | AD | Age-based % of Basic OD | Age <1: 10%, Age 1-2: 20%, Age >2: 30% |
| **Engine Protection Premium** | AE | Age-based % of IDV | Age-tiered: 0.13% to 0.32% |
| **Road Side Assistance** | AF | `=IF(P5=1,50,0)` | Flat ₹50 if selected |
| **Return to Invoice Premium** | AG | Age-based % of IDV | Age <1: 0.15%, Age 1-2: 0.2%, Age >2: 0.25% |
| **NCB Protect Premium** | AH | `=IF(M5=1,F5*0.15%,0)` | 0.15% of IDV if selected |
| **Consumables Premium** | AI | Age-based % of IDV | Age-tiered: 0.1% to 0.2% |
| **Geo Extension OD** | AJ | `=IF(Q5=1,400,0)` | Flat ₹400 if selected |
| **Built-in CNG OD** | AK | Age-based % of Basic OD | Age <1: 1%, Age 1-2: 2%, Age >2: 3% |
| **CNG/LPG OD Premium** | AL | `=J5*4%` | 4% of CNG/LPG SI |
| **Loss of Key Premium** | AM | `=IF(V5=1,750,0)` | Flat ₹750 if selected |
| **Towing Charges Premium** | AN | `=IF(T5=1,75,0)` | Flat ₹75 if selected |
| **Medical Expenses Premium** | AO | Age-based flat amounts | Age <1: ₹275, Age 1-5: ₹325, Age >5: ₹450 |
| **Tyre & RIM Premium** | AP | SI-based flat amounts | ₹1000-₹8000 based on SI |
| **Personal Effects Premium** | AQ | `=IF(X5=1,500,0)` | Flat ₹500 if selected |
| **Courtesy Car Premium** | AR | Age-based flat amounts | Age <1: ₹375, Age 1-5: ₹450, Age >5: ₹600 |
| **Road Tax Premium** | AS | `=IF(R5=1,(F5*0.2)*0.25%,0)` | 0.25% of 20% of IDV |

### 2.4 Third Party (TP) Premium Calculations

| Field | Column | Formula | Calculation Logic |
|-------|--------|---------|-------------------|
| **Basic TP** | AT | CC-based flat amounts | <1000cc: ₹2094, 1000-1500cc: ₹3416, >1500cc: ₹7897 |
| **CPA Owner Driver** | AU | `=IF(Y5=1,275,0)` | Flat ₹275 if selected |
| **LL to Paid Driver** | AV | `=IF(Z5=1,50,0)` | Flat ₹50 if selected |
| **CNG/LPG TP Premium** | AW | Built-in or SI-based | Flat ₹60 if applicable |
| **Geo Extension TP** | AX | `=IF(Q5=1,100,0)` | Flat ₹100 if selected |

### 2.5 Discount Calculations

| Field | Column | Formula | Description |
|-------|--------|---------|-------------|
| **OD Discount** | AY | `=(AC5*H5)/100` | Applies OD discount % to Basic OD |
| **NCB Discount** | AZ | `=((AC5-AY5)+AD5+AG5+AJ5+AK5)*G5` | NCB % applied to eligible OD premiums |

### 2.6 Final Premium Calculations

| Field | Column | Formula | Description |
|-------|--------|---------|-------------|
| **Net Premium** | BA | `=SUM(AC5:AX5)-AY5-AZ5` | Sum of all premiums minus discounts |
| **CGST @9%** | BB | `=BA5*9%` | 9% GST |
| **SGST @9%** | BC | `=BA5*9%` | 9% GST |
| **Total Premium** | BD | `=BC5+BB5+BA5` | Final payable amount |

**Additional columns BE-CH appear to be output/display fields that reference the calculated values.**

---

## 3. RATE TABLES

### 3.1 OD Base Rate Table (from "Age RTO" Sheet)

| Age Category | Zone | Upto 1000cc | 1000cc-1500cc | >1500cc |
|-------------|------|-------------|---------------|---------|
| **≤ 5 years** | A | 3.127% | 3.283% | 3.44% |
| | B | 3.039% | 3.191% | 3.343% |
| **5-10 years** | A | 3.283% | 3.447% | 3.612% |
| | B | 3.191% | 3.351% | 3.51% |
| **> 10 years** | A | 3.362% | 3.529% | 3.698% |
| | B | 3.267% | 3.43% | 3.596% |

### 3.2 Third Party Base Rate Table

| Cubic Capacity | TP Premium (₹) |
|---------------|----------------|
| Upto 1000cc | 2,094 |
| 1000cc - 1500cc | 3,416 |
| > 1500cc | 7,897 |

### 3.3 Add-On Premium Rate Tables

#### 3.3.1 Age-Based Percentage Rates (% of IDV)

| Add-On | Age <1 | Age 1-2 | Age 2-3 | Age 3-4 | Age 4-5 | Age >5 |
|--------|--------|---------|---------|---------|---------|--------|
| **Nil Dep** (% of Basic OD) | 10% | 20% | 30% | 30% | 30% | 30% |
| **Engine Protection** | 0.13% | 0.16% | 0.21% | 0.27% | 0.32% | 0.32% |
| **Return to Invoice** | 0.15% | 0.20% | 0.25% | 0.25% | 0.25% | 0.25% |
| **Consumables** | 0.10% | 0.12% | 0.15% | 0.17% | 0.20% | 0.20% |
| **NCB Protect** | 0.15% | 0.15% | 0.15% | 0.15% | 0.15% | 0.15% |
| **Built-in CNG OD** (% of OD) | 1% | 2% | 3% | 3% | 3% | 3% |

#### 3.3.2 Flat Premium Rates (₹)

| Add-On | Age <1 | Age 1-5 | Age >5 |
|--------|--------|---------|--------|
| **Medical Expenses** | 275 | 325 | 450 |
| **Courtesy Car** | 375 | 450 | 600 |

#### 3.3.3 Fixed Premium Rates (₹)

| Add-On | Premium (₹) |
|--------|-------------|
| **Road Side Assistance** | 50 |
| **Geographical Extension OD** | 400 |
| **Geographical Extension TP** | 100 |
| **Loss of Key** | 750 |
| **Additional Towing** | 75 |
| **Personal Effects** | 500 |
| **CPA Owner Driver** | 275 |
| **LL to Paid Driver** | 50 |
| **CNG/LPG TP** | 60 |

#### 3.3.4 Tyre & RIM Protector (SI-Based)

| Sum Insured (₹) | Premium (₹) |
|----------------|-------------|
| 25,000 | 1,000 |
| 50,000 | 2,000 |
| 100,000 | 4,000 |
| 200,000 | 8,000 |

#### 3.3.5 Other Rates

| Item | Rate |
|------|------|
| **CNG/LPG SI Premium** | 4% of SI |
| **Road Tax Cover** | 0.25% of (IDV × 20%) |

---

## 4. DISCOUNT STRUCTURES

### 4.1 No Claim Bonus (NCB)
- **Field:** NCB (Column G)
- **Input Type:** Percentage (0 to 1, e.g., 0.2 = 20%)
- **Application:** Applied to eligible OD premiums
- **Formula:** `((Basic OD - OD Discount) + Nil Dep + RTI + Geo Ext OD + Built-in CNG OD) × NCB%`
- **Eligible Components:**
  - Basic OD Premium (after OD discount)
  - Nil Depreciation Premium
  - Return to Invoice Premium
  - Geographical Extension OD Premium
  - Built-in CNG/LPG OD Premium

### 4.2 OD Discount
- **Field:** OD Discount (Column H)
- **Input Type:** Percentage (e.g., 60 = 60%)
- **Application:** Applied only to Basic OD Premium
- **Formula:** `Basic OD Premium × (OD Discount %)`

### 4.3 Discount Hierarchy
1. **First:** OD Discount is applied to Basic OD
2. **Second:** NCB is applied to (Basic OD - OD Discount) + eligible add-ons
3. **Final Net Premium:** Sum of all premiums - OD Discount - NCB Discount

---

## 5. LOADINGS

### 5.1 Age-Based Loadings
- **OD Base Rate:** Increases with vehicle age (see rate table)
- **Add-On Premiums:** Most increase with age:
  - Nil Dep: 10% → 20% → 30%
  - Engine Protection: 0.13% → 0.32%
  - Consumables: 0.10% → 0.20%
  - Flat amounts also increase (Medical, Courtesy Car)

### 5.2 Zone-Based Loadings
- **Zone A:** Higher OD rates (metropolitan areas)
- **Zone B:** Lower OD rates (non-metropolitan)
- **Differential:** Approximately 3-5% lower rates in Zone B

### 5.3 Vehicle-Based Loadings
- **Cubic Capacity:** Higher CC = Higher premiums
  - Affects both OD and TP base rates
  - Progressive increase across three slabs

### 5.4 CNG/LPG Loadings
- **Built-in CNG/LPG:** Additional OD premium (1-3% of Basic OD based on age)
- **External CNG/LPG:** 4% of Sum Insured
- **TP Loading:** Flat ₹60 for any CNG/LPG

---

## 6. OUTPUT FIELDS

### 6.1 Primary Outputs
1. **Net Premium (BA):** ₹ amount before GST
2. **CGST (BB):** 9% of Net Premium
3. **SGST (BC):** 9% of Net Premium
4. **Total Premium (BD):** Final amount payable

### 6.2 Detailed Breakdown Outputs (Columns BE-CH)
These columns provide a detailed premium breakdown for display/reporting:
- All individual add-on premiums
- All calculation components
- Discounts applied
- GST components
- Final total

---

## 7. CONDITIONAL LOGIC

### 7.1 Eligibility Rules

#### 7.1.1 Boolean Add-Ons (0/1 Flag)
- **If flag = 1:** Calculate and add premium
- **If flag = 0:** Premium = 0
- **Applies to:** Most add-on covers (Nil Dep, RTI, NCB Protect, etc.)

#### 7.1.2 Sum Insured Based
- **Tyre & RIM:** Premium based on selected SI tier
- **CNG/LPG SI:** Premium = 4% of entered SI

#### 7.1.3 Age-Dependent Logic
- **OD Rate Selection:** Different rates for ≤5, 5-10, >10 years
- **Add-On Rates:** Many have age-tiered rates
- **Example:** Nil Dep = 10% (age <1), 20% (age 1-2), 30% (age >2)

### 7.2 Validation Checks (Implicit)

1. **Date of Purchase:** Must be valid date to calculate age
2. **IDV:** Must be positive number
3. **Cubic Capacity:** Must match one of three categories
4. **Zone:** Must be 'A' or 'B'
5. **Boolean Flags:** Must be 0 or 1
6. **NCB:** Must be between 0 and 1 (0-100%)
7. **OD Discount:** Must be valid percentage

### 7.3 Field Dependencies

```
Vehicle Age (AA) depends on: Date of Purchase (E)
    ↓
OD Basic Rate (AB) depends on: Age (AA), Zone (D), Cubic Capacity (C)
    ↓
Basic OD Premium (AC) depends on: IDV (F), OD Basic Rate (AB)
    ↓
Most Add-On Premiums depend on: Age (AA) and/or IDV (F) and/or Basic OD (AC)
    ↓
Discounts depend on: Basic OD, Add-On Premiums, NCB%, OD Discount%
    ↓
Net Premium depends on: All premiums and discounts
    ↓
GST depends on: Net Premium
    ↓
Total Premium depends on: Net Premium + GST
```

---

## 8. CALCULATION SEQUENCE

### Execution Order:
1. **Calculate Vehicle Age** (AA) from Date of Purchase
2. **Determine OD Base Rate** (AB) using Age, Zone, CC
3. **Calculate Basic OD Premium** (AC) = IDV × OD Rate
4. **Calculate All Add-On Premiums** (AD-AS for OD, AT-AX for TP)
5. **Calculate OD Discount** (AY) from Basic OD
6. **Calculate NCB Discount** (AZ) from eligible premiums
7. **Calculate Net Premium** (BA) = Sum of all - Discounts
8. **Calculate GST** (BB, BC) = 9% each
9. **Calculate Total Premium** (BD) = Net + CGST + SGST

---

## 9. EDGE CASES & VALIDATION

### 9.1 Edge Cases to Handle

1. **Very Old Vehicles:** Age > 10 years uses highest rate tier
2. **New Vehicles:** Age < 1 year uses lowest add-on rates
3. **Zero IDV:** Would result in zero OD premium
4. **No Add-Ons Selected:** Only Basic OD + TP + GST
5. **Maximum NCB:** 50% (0.5) typically max allowed
6. **CNG/LPG Combinations:** 
   - Built-in only: CNG OD + CNG TP
   - External only (SI>0): CNG SI Premium + CNG TP
   - Both: All three components

### 9.2 Data Validation Requirements

1. **Date Validation:** Purchase date not in future
2. **Numeric Ranges:**
   - IDV: > 0, reasonable upper limit
   - NCB: 0 to 0.5 (0-50%)
   - OD Discount: 0 to 100
3. **Categorical Values:**
   - Zone: Only 'A' or 'B'
   - Cubic Capacity: Only three defined categories
   - Type of Vehicle: Defined list
4. **Boolean Fields:** Only 0 or 1
5. **Dependency Checks:**
   - If Built-in CNG = 1, CNG SI should be 0
   - If CNG SI > 0, Built-in CNG should be 0

---

## 10. LOOKUP SHEETS / HIDDEN RATE TABLES

### 10.1 Age RTO Sheet
- **Purpose:** Rate table reference
- **Content:** OD base rates by Age × Zone × Cubic Capacity
- **Current Implementation:** Rates hardcoded in formula
- **Recommendation:** Should reference this sheet dynamically

### 10.2 Potential Missing Tables
Based on the calculator, these rate tables should exist (currently hardcoded):
1. **TP Base Rates:** By Cubic Capacity
2. **Add-On Rate Tables:** All percentage-based rates
3. **Flat Premium Table:** All fixed amount premiums
4. **Age Slabs Definition:** Standardized age brackets
5. **GST Rate:** Currently 9% (should be configurable)

---

## 11. SUMMARY STATISTICS

| Category | Count |
|----------|-------|
| **Total Input Fields** | 26 |
| **Total Calculation Fields** | 58 (including intermediates and outputs) |
| **Total Formulas** | 23 unique formula types |
| **Rate Tables** | 2 explicit (OD, TP) + multiple implicit |
| **Discount Types** | 2 (NCB, OD Discount) |
| **Loading Dimensions** | 3 (Age, Zone, Vehicle CC) |
| **Add-On Covers** | 20 |
| **Conditional Logic Points** | 50+ IF conditions |
| **Output Fields** | 4 primary + 54 detailed |

---

## 12. KEY OBSERVATIONS

1. **Complex Nested Logic:** OD rate determination uses deeply nested IF statements
2. **Hardcoded Rates:** All rates are embedded in formulas, not referenced from tables
3. **Age-Centric:** Vehicle age is critical driver for most calculations
4. **Boolean Add-Ons:** Most optional covers are simple on/off flags
5. **Two-Tier Discounts:** OD Discount first, then NCB on reduced base
6. **Modular Structure:** Each add-on calculated independently
7. **Linear GST:** Simple 18% (9%+9%) on net premium
8. **No Complex Dependencies:** Add-ons don't affect each other's calculations
9. **Standardized Patterns:** Similar age-based logic repeated across add-ons
10. **Missing Automation:** Requires dynamic rate table lookup implementation

---

**Document Version:** 1.0  
**Date:** 2026-02-17  
**Source:** Motor Premium Calculation 2.xlsx - Private Car Sheet  
**Next Steps:** Proceed to Phase 2 - Architecture Planning
