# CSV Processing Guide - All 86 Excel Fields

## Complete CSV Implementation for Motor Premium Calculator

This guide explains how to use CSV files for bulk premium calculation with **ALL 86 fields exactly as they appear in Excel**.

---

## 📊 Overview

The CSV processor supports:
- ✅ **Input:** 26 fields (Excel columns A-Z)
- ✅ **Output:** 87 columns (row# + 86 Excel fields)
  - 26 input fields (A-Z)
  - 30 calculation fields (AA-BD)
  - 30 display fields (BE-CH)

---

## Part 1: Input CSV Format

### CSV Template

Use the provided template: `CSV_INPUT_TEMPLATE.csv`

**All 26 Input Columns (A-Z):**

```csv
policy_type,vehicle_type,cc_category,zone,purchase_date,idv,ncb_percent,od_discount_percent,builtin_cng_lpg,cng_lpg_si,nil_dep,return_to_invoice,ncb_protect,engine_protection,consumables,road_side_assistance,geo_extension,road_tax_cover,courtesy_car,additional_towing,medical_expenses,loss_of_key,tyre_rim_si,personal_effects,cpa_owner_driver,ll_paid_driver
```

### Field Descriptions

| # | Column | Field Name | Type | Example | Excel Col |
|---|--------|------------|------|---------|-----------|
| 1 | policy_type | Policy Type | Text | Package | A |
| 2 | vehicle_type | Type of Vehicle | Text | New | B |
| 3 | cc_category | Cubic Capacity | Text | 1000cc_1500cc | C |
| 4 | zone | Zone | Text | A | D |
| 5 | purchase_date | Date of Purchase | Date | 2024-01-01 | E |
| 6 | idv | Insured Declared Value | Number | 125000 | F |
| 7 | ncb_percent | NCB Percentage | Number | 20 | G |
| 8 | od_discount_percent | OD Discount % | Number | 0 | H |
| 9 | builtin_cng_lpg | Built-in CNG/LPG | Boolean | 0 or 1 | I |
| 10 | cng_lpg_si | CNG/LPG Sum Insured | Number | 0 or 15000 | J |
| 11 | nil_dep | Nil Depreciation | Boolean | 0 or 1 | K |
| 12 | return_to_invoice | Return to Invoice | Boolean | 0 or 1 | L |
| 13 | ncb_protect | NCB Protect | Boolean | 0 or 1 | M |
| 14 | engine_protection | Engine Protection | Boolean | 0 or 1 | N |
| 15 | consumables | Consumables | Boolean | 0 or 1 | O |
| 16 | road_side_assistance | Road Side Assistance | Boolean | 0 or 1 | P |
| 17 | geo_extension | Geo Extension | Boolean | 0 or 1 | Q |
| 18 | road_tax_cover | Road Tax Cover | Boolean | 0 or 1 | R |
| 19 | courtesy_car | Courtesy Car | Boolean | 0 or 1 | S |
| 20 | additional_towing | Additional Towing | Boolean | 0 or 1 | T |
| 21 | medical_expenses | Medical Expenses | Boolean | 0 or 1 | U |
| 22 | loss_of_key | Loss of Key | Boolean | 0 or 1 | V |
| 23 | tyre_rim_si | Tyre & RIM SI | Number | 0, 25000, 50000, 100000, 200000 | W |
| 24 | personal_effects | Personal Effects | Boolean | 0 or 1 | X |
| 25 | cpa_owner_driver | CPA Owner Driver | Boolean | 0 or 1 | Y |
| 26 | ll_paid_driver | LL to Paid Driver | Boolean | 0 or 1 | Z |

---

## Part 2: Field Value Guidelines

### Text Fields

**policy_type:** (Column A)
- `Package` - Comprehensive coverage
- `Third Party` - Only TP coverage
- `Standalone OD` - Only OD coverage

**vehicle_type:** (Column B)
- `New` - Brand new vehicle
- `Existing` - Used vehicle
- `Rollover` - Policy renewal

**cc_category:** (Column C) - REQUIRED
- `upto_1000cc` - Up to 1000cc
- `1000cc_1500cc` - 1000cc to 1500cc
- `above_1500cc` - Above 1500cc

**zone:** (Column D) - REQUIRED
- `A` - Metro cities
- `B` - Other cities

### Date Fields

**purchase_date:** (Column E) - REQUIRED
- Format: `YYYY-MM-DD`
- Example: `2024-01-01`
- Must be past date

### Numeric Fields

**idv:** (Column F) - REQUIRED
- Insured Declared Value
- Range: 10,000 to 10,000,000
- Example: `125000`

**ncb_percent:** (Column G)
- No Claim Bonus percentage
- Values: 0, 20, 25, 35, 45, 50
- Example: `20` (for 20%)
- Default: `0`

**od_discount_percent:** (Column H)
- OD Discount percentage
- Range: 0 to 100
- Example: `60` (for 60%)
- Default: `0`

**cng_lpg_si:** (Column J)
- CNG/LPG Sum Insured
- Example: `15000`
- Use when builtin_cng_lpg=0 and external CNG

**tyre_rim_si:** (Column W)
- Tyre & RIM Sum Insured
- Valid values: 0, 25000, 50000, 100000, 200000
- Default: `0`

### Boolean Fields (0 or 1)

All add-on fields use 0 or 1:
- `0` - Not selected
- `1` - Selected

Boolean fields: builtin_cng_lpg, nil_dep, return_to_invoice, ncb_protect, engine_protection, consumables, road_side_assistance, geo_extension, road_tax_cover, courtesy_car, additional_towing, medical_expenses, loss_of_key, personal_effects, cpa_owner_driver, ll_paid_driver

---

## Part 3: Output CSV Format

### Output Structure - 87 Columns Total

The output CSV contains **87 columns**:
1. `row_number` - Reference to input row
2-27. **Input Fields (A-Z)** - Original 26 inputs
28-57. **Calculation Fields (AA-BD)** - 30 calculated values
58-87. **Display Fields (BE-CH)** - 30 display copies

### Output Column Headers

```csv
row_number,policy_type,vehicle_type,cc_category,zone,purchase_date,idv,ncb_percent,od_discount_percent,builtin_cng_lpg,cng_lpg_si,nil_dep,return_to_invoice,ncb_protect,engine_protection,consumables,road_side_assistance,geo_extension,road_tax_cover,courtesy_car,additional_towing,medical_expenses,loss_of_key,tyre_rim_si,personal_effects,cpa_owner_driver,ll_paid_driver,age_years,od_base_rate_percent,basic_od_premium,nil_dep_premium,engine_protection_premium,road_side_assistance_premium,return_to_invoice_premium,ncb_protect_premium,consumables_premium,geo_extension_od_premium,builtin_cng_od_premium,cng_lpg_od_premium,loss_of_key_premium,towing_charges_premium,medical_expenses_premium,tyre_rim_premium,personal_effects_premium,courtesy_car_premium,road_tax_premium,basic_tp_premium,cpa_owner_premium,ll_paid_driver_premium,cng_lpg_tp_premium,geo_extension_tp_premium,od_discount_amount,ncb_discount_amount,net_premium,cgst,sgst,total_premium,age_years_display,od_base_rate_percent_display,basic_od_premium_display,nil_dep_premium_display,engine_protection_premium_display,road_side_assistance_premium_display,return_to_invoice_premium_display,ncb_protect_premium_display,consumables_premium_display,geo_extension_od_premium_display,builtin_cng_od_premium_display,cng_lpg_od_premium_display,loss_of_key_premium_display,towing_charges_premium_display,medical_expenses_premium_display,tyre_rim_premium_display,personal_effects_premium_display,courtesy_car_premium_display,road_tax_premium_display,basic_tp_premium_display,cpa_owner_premium_display,ll_paid_driver_premium_display,cng_lpg_tp_premium_display,geo_extension_tp_premium_display,od_discount_amount_display,ncb_discount_amount_display,net_premium_display,cgst_display,sgst_display,total_premium_display
```

### Calculation Fields (AA-BD) - Columns 28-57

| # | Column | Field | Excel | Description |
|---|--------|-------|-------|-------------|
| 28 | age_years | Age | AA | Vehicle age in years |
| 29 | od_base_rate_percent | OD Rate | AB | OD base rate % |
| 30 | basic_od_premium | Basic OD | AC | Basic OD premium |
| 31 | nil_dep_premium | Nil Dep | AD | Nil depreciation premium |
| 32 | engine_protection_premium | Engine Prot | AE | Engine protection premium |
| 33 | road_side_assistance_premium | RSA | AF | Road side assistance |
| 34 | return_to_invoice_premium | RTI | AG | Return to invoice premium |
| 35 | ncb_protect_premium | NCB Protect | AH | NCB protect premium |
| 36 | consumables_premium | Consumables | AI | Consumables premium |
| 37 | geo_extension_od_premium | Geo Ext OD | AJ | Geo extension OD |
| 38 | builtin_cng_od_premium | Built CNG OD | AK | Built-in CNG OD |
| 39 | cng_lpg_od_premium | CNG/LPG OD | AL | External CNG OD |
| 40 | loss_of_key_premium | Key Loss | AM | Loss of key premium |
| 41 | towing_charges_premium | Towing | AN | Additional towing |
| 42 | medical_expenses_premium | Medical | AO | Medical expenses |
| 43 | tyre_rim_premium | Tyre RIM | AP | Tyre & RIM premium |
| 44 | personal_effects_premium | Pers Effects | AQ | Personal effects |
| 45 | courtesy_car_premium | Courtesy | AR | Courtesy car |
| 46 | road_tax_premium | Road Tax | AS | Road tax cover |
| 47 | basic_tp_premium | Basic TP | AT | Basic TP premium |
| 48 | cpa_owner_premium | CPA Owner | AU | CPA owner driver |
| 49 | ll_paid_driver_premium | LL Paid | AV | LL to paid driver |
| 50 | cng_lpg_tp_premium | CNG TP | AW | CNG/LPG TP |
| 51 | geo_extension_tp_premium | Geo Ext TP | AX | Geo extension TP |
| 52 | od_discount_amount | OD Disc | AY | OD discount amount |
| 53 | ncb_discount_amount | NCB Disc | AZ | NCB discount amount |
| 54 | net_premium | Net Prem | BA | Net premium |
| 55 | cgst | CGST | BB | CGST @ 9% |
| 56 | sgst | SGST | BC | SGST @ 9% |
| 57 | total_premium | **TOTAL** | BD | **Total Premium** |

### Display Fields (BE-CH) - Columns 58-87

These are exact copies of calculation fields (AA-BD) for display purposes, matching Excel structure.

Each field has `_display` suffix:
- `age_years_display` (BE)
- `od_base_rate_percent_display` (BF)
- ... continues for all 30 fields
- `total_premium_display` (CH)

---

## Part 4: Usage Examples

### Example 1: Single Vehicle - New Car with Full Coverage

**Input CSV:**
```csv
policy_type,vehicle_type,cc_category,zone,purchase_date,idv,ncb_percent,od_discount_percent,builtin_cng_lpg,cng_lpg_si,nil_dep,return_to_invoice,ncb_protect,engine_protection,consumables,road_side_assistance,geo_extension,road_tax_cover,courtesy_car,additional_towing,medical_expenses,loss_of_key,tyre_rim_si,personal_effects,cpa_owner_driver,ll_paid_driver
Package,New,1000cc_1500cc,A,2024-01-01,125000,20,0,0,0,1,1,0,1,1,1,0,0,0,0,1,0,0,1,1,0
```

**Output:** 87 columns including:
- `row_number`: 2
- `total_premium`: ₹16,113.01
- All 86 fields populated

### Example 2: Multiple Vehicles - Bulk Processing

**Input CSV:**
```csv
policy_type,vehicle_type,cc_category,zone,purchase_date,idv,ncb_percent,od_discount_percent,builtin_cng_lpg,cng_lpg_si,nil_dep,return_to_invoice,ncb_protect,engine_protection,consumables,road_side_assistance,geo_extension,road_tax_cover,courtesy_car,additional_towing,medical_expenses,loss_of_key,tyre_rim_si,personal_effects,cpa_owner_driver,ll_paid_driver
Package,New,1000cc_1500cc,A,2024-01-01,125000,20,0,0,0,1,1,0,1,1,1,0,0,0,0,1,0,0,1,1,0
Package,Rollover,upto_1000cc,B,2020-06-15,75000,50,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0
Package,Used,above_1500cc,A,2022-03-20,200000,0,0,0,15000,1,1,0,1,1,0,1,0,0,0,1,0,0,0,1,1
```

**Output:** 3 rows × 87 columns with complete calculations for each vehicle

### Example 3: Old Car with Minimal Coverage

**Input CSV:**
```csv
policy_type,vehicle_type,cc_category,zone,purchase_date,idv,ncb_percent,od_discount_percent,builtin_cng_lpg,cng_lpg_si,nil_dep,return_to_invoice,ncb_protect,engine_protection,consumables,road_side_assistance,geo_extension,road_tax_cover,courtesy_car,additional_towing,medical_expenses,loss_of_key,tyre_rim_si,personal_effects,cpa_owner_driver,ll_paid_driver
Package,Rollover,upto_1000cc,B,2020-06-15,75000,50,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0
```

**Output:** Minimal premium with only TP coverage selected

---

## Part 5: Processing Methods

### Method 1: Frontend UI

1. **Navigate to CSV Tab**
2. **Download Template** - Gets `CSV_INPUT_TEMPLATE.csv`
3. **Fill Template** - Add your vehicles
4. **Upload CSV** - Click "Upload CSV"
5. **Process** - Click "Process CSV"
6. **Download Results** - Get output with 87 columns

### Method 2: API Endpoint

```bash
curl -X POST http://localhost:8000/csv/process \
  -H "Content-Type: multipart/form-data" \
  -F "file=@input.csv"
```

**Response:**
```json
{
  "total_rows": 3,
  "successful": 3,
  "failed": 0,
  "results": [...],
  "errors": []
}
```

Download output:
```bash
curl http://localhost:8000/csv/download/{session_id}
```

### Method 3: Python Script

```python
from src.premium_calculator.core.csv_processor import CSVProcessor

# Initialize processor
processor = CSVProcessor()

# Process CSV file
results = processor.process_csv_file("input.csv")

# Generate output CSV
output_csv = processor.generate_output_csv(results["results"])

# Save output
with open("output.csv", "w") as f:
    f.write(output_csv)

print(f"Processed {results['successful']} rows successfully")
print(f"Failed: {results['failed']} rows")
```

---

## Part 6: Validation Rules

### Required Fields

These fields **must** be provided:
- `cc_category` - Cubic capacity category
- `zone` - Zone A or B
- `purchase_date` - Date in YYYY-MM-DD format
- `idv` - Insured Declared Value

### Valid Values

**cc_category:**
- `upto_1000cc`
- `1000cc_1500cc`
- `above_1500cc`

**zone:**
- `A`
- `B`

**ncb_percent:**
- 0, 20, 25, 35, 45, or 50

**tyre_rim_si:**
- 0, 25000, 50000, 100000, or 200000

**Boolean fields:**
- 0 or 1 only

### Date Validation

- Must be in `YYYY-MM-DD` format
- Cannot be in future
- Used to calculate vehicle age

---

## Part 7: Error Handling

### Common Errors

**1. Missing Required Fields**
```
Error: Missing required field: cc_category
```
**Solution:** Add cc_category column with valid value

**2. Invalid CC Category**
```
Error: Invalid cc_category. Must be one of: ['upto_1000cc', '1000cc_1500cc', 'above_1500cc']
```
**Solution:** Use exact category names

**3. Invalid IDV**
```
Error: IDV must be positive
```
**Solution:** Provide positive number for IDV

**4. Invalid Date Format**
```
Error: Purchase date must be in YYYY-MM-DD format
```
**Solution:** Use correct date format

### Error Response

When errors occur, the response includes:
```json
{
  "total_rows": 5,
  "successful": 3,
  "failed": 2,
  "results": [...],
  "errors": [
    {
      "row": 3,
      "errors": ["Missing required field: idv"],
      "data": {...}
    }
  ]
}
```

---

## Part 8: Performance

### Batch Size Recommendations

- **Small batches:** 1-100 rows - Instant processing
- **Medium batches:** 100-1,000 rows - Few seconds
- **Large batches:** 1,000-10,000 rows - Under 1 minute
- **Very large:** 10,000+ rows - Few minutes

### Memory Usage

- Each row: ~5KB in memory
- 10,000 rows: ~50MB
- No hard limit (depends on server)

### Optimization Tips

1. **Remove unnecessary columns** - Only include the 26 input fields
2. **Pre-validate data** - Check format before upload
3. **Split large files** - Process in chunks if needed
4. **Use API directly** - Bypass UI for automation

---

## Part 9: Complete Workflow

### Step-by-Step Process

1. **Download Template**
   - Use `CSV_INPUT_TEMPLATE.csv`
   - Or create with all 26 input columns

2. **Prepare Data**
   - Fill all required fields
   - Validate values against rules
   - Check date formats

3. **Upload & Process**
   - Upload via UI or API
   - Wait for processing
   - Check for errors

4. **Review Results**
   - Check successful vs failed count
   - Review error messages
   - Verify calculations

5. **Download Output**
   - Get CSV with 87 columns
   - Contains all 86 Excel fields
   - Review in Excel/spreadsheet

6. **Verify Output**
   - Check total_premium column
   - Verify all 30 calculation fields
   - Compare with expected values

---

## Part 10: Excel Comparison

### Input Columns Match

| Excel | CSV Column | Match |
|-------|------------|-------|
| A | policy_type | ✅ |
| B | vehicle_type | ✅ |
| C | cc_category | ✅ |
| D | zone | ✅ |
| E | purchase_date | ✅ |
| F | idv | ✅ |
| ... | ... | ✅ |
| Z | ll_paid_driver | ✅ |

**All 26 input columns exactly match Excel A-Z**

### Output Columns Match

| Excel | CSV Column | Match |
|-------|------------|-------|
| AA | age_years | ✅ |
| AB | od_base_rate_percent | ✅ |
| AC | basic_od_premium | ✅ |
| ... | ... | ✅ |
| BD | total_premium | ✅ |

**All 30 calculation columns exactly match Excel AA-BD**

### Display Columns Match

| Excel | CSV Column | Match |
|-------|------------|-------|
| BE | age_years_display | ✅ |
| BF | od_base_rate_percent_display | ✅ |
| ... | ... | ✅ |
| CH | total_premium_display | ✅ |

**All 30 display columns exactly match Excel BE-CH**

---

## ✅ Summary

**CSV Input:**
- ✅ 26 columns (A-Z from Excel)
- ✅ All fields documented
- ✅ Template provided

**CSV Output:**
- ✅ 87 columns total
- ✅ row_number + 86 Excel fields
- ✅ Exact Excel structure

**Processing:**
- ✅ Bulk processing supported
- ✅ Validation included
- ✅ Error handling
- ✅ Multiple access methods

**Compatibility:**
- ✅ 100% Excel field match
- ✅ Same calculations
- ✅ Same formulas
- ✅ Same output structure

---

## 📞 Support

For issues or questions:
1. Check validation rules
2. Review error messages
3. Verify input format
4. Compare with template
5. Check API documentation at `/docs`

**The CSV processor now supports ALL 86 Excel fields exactly! 🎉**
