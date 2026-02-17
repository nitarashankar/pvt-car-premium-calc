# Phase 3: CSV Utility Planning

## Executive Summary

This document provides a comprehensive plan for building a **lightweight, efficient CSV processing utility** for the Private Car Premium Calculator. The utility will allow users to upload a CSV file with input data, perform bulk premium calculations, and download results with all calculated fields in a structured format.

---

## 1. REQUIREMENTS OVERVIEW

### 1.1 Functional Requirements

| Requirement | Description |
|------------|-------------|
| **CSV Upload** | User uploads CSV file containing input fields |
| **Bulk Processing** | Process all rows in single operation |
| **One-Click Calculation** | Single action triggers all calculations |
| **Structured Output** | Export CSV with inputs + calculations + outputs |
| **Error Handling** | Identify and report invalid rows |
| **Performance** | Handle large files (10,000+ rows) efficiently |
| **Validation** | Validate all inputs before calculation |
| **Progress Tracking** | Show processing status for large files |

### 1.2 Non-Functional Requirements

| Requirement | Target |
|------------|--------|
| **Processing Speed** | > 100 rows/second |
| **Max File Size** | 50 MB |
| **Max Rows** | 50,000 rows |
| **Memory Efficiency** | Stream processing, not full load |
| **Error Tolerance** | Continue processing on row errors |
| **Usability** | Simple, no-code interface |

---

## 2. INPUT → CALCULATION → OUTPUT MAPPING

### 2.1 Input CSV Schema

**Required Columns (26 fields):**

```csv
policy_type,vehicle_type,cubic_capacity,zone,purchase_date,idv,ncb,od_discount,builtin_cng_lpg,cng_lpg_si,nil_dep,return_to_invoice,ncb_protect,engine_protection,consumables,road_side_assistance,geo_extension,road_tax_cover,courtesy_car,additional_towing,medical_expenses,loss_of_key,tyre_rim_si,personal_effects,cpa_owner_driver,ll_paid_driver
```

**Example Input Row:**
```csv
Package,New,1000cc - 1500cc,A,2025-01-01,125000,0.2,60,1,0,1,1,1,1,1,1,1,0,1,1,1,1,100000,1,1,1
```

### 2.2 Column Name Mapping

| CSV Column Name | Internal Field | Data Type | Validation |
|----------------|---------------|-----------|-----------|
| `policy_type` | policy_type | String | Must be in ['Package', 'Third Party', 'Standalone OD'] |
| `vehicle_type` | vehicle_type | String | Must be in ['New', 'Existing'] |
| `cubic_capacity` | cc_category | String | Must be in ['Upto 1000cc', '1000cc - 1500cc', '>1500cc'] |
| `zone` | zone | String | Must be in ['A', 'B'] |
| `purchase_date` | purchase_date | Date | Format: YYYY-MM-DD, not future |
| `idv` | idv | Numeric | > 0 |
| `ncb` | ncb_percent | Numeric | 0 to 0.5 (0-50%) |
| `od_discount` | od_discount_percent | Numeric | 0 to 100 |
| `builtin_cng_lpg` | builtin_cng | Boolean | 0 or 1 |
| `cng_lpg_si` | cng_lpg_si | Numeric | >= 0 |
| `nil_dep` | nil_dep | Boolean | 0 or 1 |
| `return_to_invoice` | return_to_invoice | Boolean | 0 or 1 |
| `ncb_protect` | ncb_protect | Boolean | 0 or 1 |
| `engine_protection` | engine_protection | Boolean | 0 or 1 |
| `consumables` | consumables | Boolean | 0 or 1 |
| `road_side_assistance` | road_side_assistance | Boolean | 0 or 1 |
| `geo_extension` | geo_extension | Boolean | 0 or 1 |
| `road_tax_cover` | road_tax_cover | Boolean | 0 or 1 |
| `courtesy_car` | courtesy_car | Boolean | 0 or 1 |
| `additional_towing` | additional_towing | Boolean | 0 or 1 |
| `medical_expenses` | medical_expenses | Boolean | 0 or 1 |
| `loss_of_key` | loss_of_key | Boolean | 0 or 1 |
| `tyre_rim_si` | tyre_rim_si | Numeric | Must be in [25000, 50000, 100000, 200000] or 0 |
| `personal_effects` | personal_effects | Boolean | 0 or 1 |
| `cpa_owner_driver` | cpa_owner_driver | Boolean | 0 or 1 |
| `ll_paid_driver` | ll_paid_driver | Boolean | 0 or 1 |

### 2.3 Output CSV Schema

**Output includes: Input Fields + Calculation Fields + Final Outputs**

**Complete Column Order:**

```
# SECTION 1: INPUT FIELDS (26 columns)
policy_type, vehicle_type, cubic_capacity, zone, purchase_date, idv, ncb, od_discount, 
builtin_cng_lpg, cng_lpg_si, nil_dep, return_to_invoice, ncb_protect, engine_protection, 
consumables, road_side_assistance, geo_extension, road_tax_cover, courtesy_car, 
additional_towing, medical_expenses, loss_of_key, tyre_rim_si, personal_effects, 
cpa_owner_driver, ll_paid_driver,

# SECTION 2: CALCULATED FIELDS (23 columns)
age_years, od_base_rate_percent, basic_od_premium, nil_dep_premium, engine_protection_premium,
road_side_assistance_premium, return_to_invoice_premium, ncb_protect_premium, 
consumables_premium, geo_extension_od_premium, builtin_cng_od_premium, cng_lpg_od_premium,
loss_of_key_premium, towing_charges_premium, medical_expenses_premium, tyre_rim_premium,
personal_effects_premium, courtesy_car_premium, road_tax_premium, basic_tp_premium,
cpa_owner_premium, ll_paid_driver_premium, cng_lpg_tp_premium,

# SECTION 3: DISCOUNT & AGGREGATION (5 columns)
geo_extension_tp_premium, od_discount_amount, ncb_discount_amount, net_premium, 

# SECTION 4: FINAL OUTPUT (4 columns)
cgst, sgst, total_premium, status

# SECTION 5: ERROR INFO (1 column, if applicable)
error_message
```

**Total Output Columns: 59**

---

## 3. ROW-WISE PROCESSING LOGIC

### 3.1 Processing Pipeline

```
┌──────────────────┐
│  Read CSV Row    │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Parse & Map     │  Convert CSV values to internal format
│  Input Data      │  Handle data type conversions
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Validate Input  │  Check required fields
│                  │  Validate data types
│                  │  Apply business rules
└────────┬─────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
  PASS      FAIL
    │         │
    │         └──────────┐
    ▼                    ▼
┌──────────────────┐  ┌──────────────────┐
│  Calculate       │  │  Log Error       │
│  Premium         │  │  Skip Row        │
└────────┬─────────┘  │  Continue to Next│
         │            └──────────────────┘
         ▼
┌──────────────────┐
│  Format Output   │  Combine input + calculated + output
│  Row             │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Write to        │
│  Output CSV      │
└──────────────────┘
```

### 3.2 Single Row Processing

```python
def process_single_row(row_dict, row_number, calculator):
    """Process a single CSV row"""
    try:
        # Step 1: Parse input
        input_data = parse_csv_row(row_dict)
        
        # Step 2: Validate
        validation_errors = validate_input(input_data)
        if validation_errors:
            return create_error_output(row_dict, row_number, validation_errors)
        
        # Step 3: Calculate
        result = calculator.calculate(input_data)
        
        # Step 4: Format output
        output_row = format_output_row(row_dict, result, 'SUCCESS')
        
        return output_row
        
    except Exception as e:
        return create_error_output(row_dict, row_number, str(e))
```

### 3.3 Batch Processing Strategy

```python
class CSVBatchProcessor:
    """Process CSV in batches for memory efficiency"""
    
    def __init__(self, calculator, batch_size=1000):
        self.calculator = calculator
        self.batch_size = batch_size
    
    def process_csv_file(self, input_path, output_path):
        """Process entire CSV file in batches"""
        results = []
        errors = []
        total_rows = 0
        
        with open(input_path, 'r') as infile:
            reader = csv.DictReader(infile)
            
            batch = []
            for row_num, row in enumerate(reader, start=2):  # Start at 2 (header is row 1)
                batch.append((row_num, row))
                
                # Process when batch is full
                if len(batch) >= self.batch_size:
                    batch_results, batch_errors = self._process_batch(batch)
                    results.extend(batch_results)
                    errors.extend(batch_errors)
                    total_rows += len(batch)
                    
                    # Clear batch
                    batch = []
                    
                    # Report progress
                    self._report_progress(total_rows)
            
            # Process remaining rows
            if batch:
                batch_results, batch_errors = self._process_batch(batch)
                results.extend(batch_results)
                errors.extend(batch_errors)
                total_rows += len(batch)
        
        # Write results to output
        self._write_output(results, output_path)
        
        return {
            'total_processed': total_rows,
            'successful': len(results),
            'errors': len(errors),
            'error_details': errors
        }
    
    def _process_batch(self, batch):
        """Process a batch of rows"""
        results = []
        errors = []
        
        for row_num, row in batch:
            output = process_single_row(row, row_num, self.calculator)
            
            if output['status'] == 'SUCCESS':
                results.append(output)
            else:
                errors.append({
                    'row': row_num,
                    'data': row,
                    'error': output['error_message']
                })
        
        return results, errors
```

---

## 4. VALIDATION & ERROR HANDLING STRATEGY

### 4.1 Input Validation Layers

**Layer 1: Schema Validation**
```python
class SchemaValidator:
    """Validate CSV schema and required columns"""
    
    def validate_csv_headers(self, headers):
        """Check if all required columns present"""
        required_columns = [
            'policy_type', 'vehicle_type', 'cubic_capacity', 'zone',
            'purchase_date', 'idv', 'ncb', 'od_discount', ...
        ]
        
        missing = [col for col in required_columns if col not in headers]
        
        if missing:
            raise ValidationError(f"Missing required columns: {missing}")
        
        return True
```

**Layer 2: Data Type Validation**
```python
class DataTypeValidator:
    """Validate data types of individual fields"""
    
    def validate_numeric(self, value, field_name, min_val=None, max_val=None):
        """Validate numeric field"""
        try:
            num_val = float(value)
            
            if min_val is not None and num_val < min_val:
                raise ValueError(f"{field_name} must be >= {min_val}")
            
            if max_val is not None and num_val > max_val:
                raise ValueError(f"{field_name} must be <= {max_val}")
            
            return num_val
        except ValueError:
            raise ValidationError(f"{field_name} must be a valid number")
    
    def validate_date(self, value, field_name):
        """Validate date field"""
        try:
            date_val = datetime.strptime(value, '%Y-%m-%d')
            
            if date_val > datetime.today():
                raise ValueError(f"{field_name} cannot be in future")
            
            return date_val
        except ValueError:
            raise ValidationError(f"{field_name} must be valid date (YYYY-MM-DD)")
    
    def validate_boolean(self, value, field_name):
        """Validate boolean (0/1) field"""
        if value not in ['0', '1', 0, 1]:
            raise ValidationError(f"{field_name} must be 0 or 1")
        return int(value)
    
    def validate_categorical(self, value, field_name, allowed_values):
        """Validate categorical field"""
        if value not in allowed_values:
            raise ValidationError(
                f"{field_name} must be one of {allowed_values}, got '{value}'"
            )
        return value
```

**Layer 3: Business Rule Validation**
```python
class BusinessRuleValidator:
    """Validate business logic rules"""
    
    def validate_cng_lpg_logic(self, input_data):
        """Validate CNG/LPG mutual exclusivity"""
        if input_data['builtin_cng'] == 1 and input_data['cng_lpg_si'] > 0:
            raise ValidationError(
                "Cannot have both built-in CNG and external CNG SI"
            )
    
    def validate_addon_eligibility(self, input_data):
        """Check if add-ons are eligible for vehicle type"""
        # Example: Certain add-ons only for new vehicles
        if input_data['vehicle_type'] != 'New':
            restricted_addons = ['return_to_invoice']
            for addon in restricted_addons:
                if input_data.get(addon) == 1:
                    raise ValidationError(
                        f"{addon} only available for new vehicles"
                    )
```

### 4.2 Error Classification

| Error Type | Severity | Action |
|-----------|----------|---------|
| **Schema Error** | Critical | Stop processing, return error |
| **Data Type Error** | Row-level | Skip row, log error, continue |
| **Range Error** | Row-level | Skip row, log error, continue |
| **Business Rule Error** | Row-level | Skip row, log error, continue |
| **Calculation Error** | Row-level | Skip row, log error, continue |

### 4.3 Error Output Format

**Success Row:**
```csv
...[all input fields]...,5,3.283,4103.75,...,SUCCESS,
```

**Error Row:**
```csv
...[all input fields]...,,,,,...,ERROR,"IDV must be positive; Zone must be A or B"
```

**Error Summary File (errors.json):**
```json
{
  "total_errors": 15,
  "errors": [
    {
      "row": 23,
      "errors": [
        "IDV must be a valid number",
        "purchase_date must be valid date (YYYY-MM-DD)"
      ],
      "data": {
        "policy_type": "Package",
        "idv": "invalid",
        "purchase_date": "2025/01/01"
      }
    }
  ]
}
```

---

## 5. PERFORMANCE CONSIDERATIONS

### 5.1 Optimization Strategies

**1. Streaming Processing**
```python
class StreamingCSVProcessor:
    """Process CSV without loading entire file"""
    
    def process_stream(self, input_file, output_file):
        """Stream process large files"""
        with open(input_file, 'r') as inf, open(output_file, 'w', newline='') as outf:
            reader = csv.DictReader(inf)
            
            # Write output headers
            output_headers = self._generate_output_headers(reader.fieldnames)
            writer = csv.DictWriter(outf, fieldnames=output_headers)
            writer.writeheader()
            
            # Process row by row
            for row_num, row in enumerate(reader, start=2):
                output_row = process_single_row(row, row_num, self.calculator)
                writer.writerow(output_row)
                
                # No memory accumulation - direct write
```

**2. Parallel Processing**
```python
from multiprocessing import Pool, cpu_count

class ParallelCSVProcessor:
    """Process CSV rows in parallel"""
    
    def process_parallel(self, input_file, output_file, num_workers=None):
        """Process using multiple CPU cores"""
        if num_workers is None:
            num_workers = cpu_count() - 1
        
        # Read all rows (or in chunks for very large files)
        rows = self._read_csv(input_file)
        
        # Divide into chunks
        chunk_size = len(rows) // num_workers
        chunks = [rows[i:i+chunk_size] for i in range(0, len(rows), chunk_size)]
        
        # Process in parallel
        with Pool(num_workers) as pool:
            results = pool.map(self._process_chunk, chunks)
        
        # Combine and write results
        all_results = [r for chunk_results in results for r in chunk_results]
        self._write_results(all_results, output_file)
```

**3. Configuration Caching**
```python
class CachedCalculator:
    """Cache configuration for bulk processing"""
    
    def __init__(self):
        # Load config once
        self.config = ConfigurationLoader().load_latest_config()
        self.rate_lookup = RateLookupService(self.config)
        # Cache remains in memory for all calculations
    
    def calculate_bulk(self, input_list):
        """Calculate using cached config"""
        return [self._calculate_single(inp) for inp in input_list]
```

### 5.2 Performance Targets

| Metric | Target | Strategy |
|--------|--------|----------|
| **Processing Speed** | 100-500 rows/sec | Parallel processing, caching |
| **Memory Usage** | < 500 MB for 50K rows | Streaming, batch processing |
| **File Size Limit** | 50 MB | Streaming read/write |
| **Startup Time** | < 2 seconds | Pre-load configurations |
| **Response Time** | < 5 min for 50K rows | Parallel + streaming |

### 5.3 Performance Monitoring

```python
class PerformanceMonitor:
    """Monitor processing performance"""
    
    def __init__(self):
        self.start_time = None
        self.rows_processed = 0
    
    def start(self):
        self.start_time = time.time()
    
    def update(self, rows_count):
        self.rows_processed += rows_count
        
        elapsed = time.time() - self.start_time
        rate = self.rows_processed / elapsed
        
        print(f"Processed: {self.rows_processed} rows | "
              f"Rate: {rate:.1f} rows/sec | "
              f"Elapsed: {elapsed:.1f}s")
```

---

## 6. CLEAN MODULAR IMPLEMENTATION

### 6.1 Module Structure

```
csv_utility/
├── __init__.py
├── core/
│   ├── __init__.py
│   ├── processor.py          # Main CSV processor
│   ├── validator.py          # Input validation
│   ├── mapper.py             # CSV <-> Internal mapping
│   └── formatter.py          # Output formatting
├── calculators/
│   ├── __init__.py
│   ├── calculator.py         # Premium calculator (from Phase 2)
│   └── config_loader.py      # Configuration loader
├── utils/
│   ├── __init__.py
│   ├── file_handler.py       # File I/O utilities
│   ├── progress.py           # Progress tracking
│   └── error_handler.py      # Error management
├── config/
│   ├── rate_tables.json      # Rate configurations
│   ├── formula_defs.json     # Formula definitions
│   └── validation_rules.json # Validation rules
└── cli.py                    # Command-line interface
```

### 6.2 Core Modules

**processor.py**
```python
class CSVPremiumProcessor:
    """Main CSV processing orchestrator"""
    
    def __init__(self, config_version='latest'):
        self.calculator = PremiumCalculator(config_version)
        self.validator = InputValidator()
        self.mapper = DataMapper()
        self.formatter = OutputFormatter()
    
    def process_file(self, input_path, output_path, **options):
        """Main entry point for CSV processing"""
        # Validate CSV structure
        # Process rows
        # Write output
        # Return summary
```

**validator.py**
```python
class InputValidator:
    """Comprehensive input validation"""
    
    def __init__(self):
        self.schema_validator = SchemaValidator()
        self.type_validator = DataTypeValidator()
        self.rule_validator = BusinessRuleValidator()
    
    def validate_row(self, row_dict):
        """Validate single row"""
        errors = []
        
        # Schema validation
        errors.extend(self.schema_validator.validate(row_dict))
        
        # Data type validation
        errors.extend(self.type_validator.validate(row_dict))
        
        # Business rule validation
        errors.extend(self.rule_validator.validate(row_dict))
        
        return errors
```

**mapper.py**
```python
class DataMapper:
    """Map between CSV format and internal format"""
    
    CSV_TO_INTERNAL = {
        'policy_type': 'policy_type',
        'vehicle_type': 'vehicle_type',
        'cubic_capacity': 'cc_category',
        # ... complete mapping
    }
    
    def csv_to_internal(self, csv_row):
        """Convert CSV row to internal format"""
        internal_data = {}
        for csv_field, internal_field in self.CSV_TO_INTERNAL.items():
            internal_data[internal_field] = self._convert_value(
                csv_field, csv_row.get(csv_field)
            )
        return internal_data
    
    def _convert_value(self, field, value):
        """Convert value to appropriate type"""
        # Handle type conversions
```

**formatter.py**
```python
class OutputFormatter:
    """Format calculation results for CSV output"""
    
    OUTPUT_COLUMNS = [
        # Input fields
        'policy_type', 'vehicle_type', ...,
        # Calculated fields
        'age_years', 'basic_od_premium', ...,
        # Output fields
        'net_premium', 'total_premium', 'status', 'error_message'
    ]
    
    def format_result(self, input_row, calculation_result, status='SUCCESS'):
        """Format single result row"""
        output_row = {}
        
        # Include all input fields
        output_row.update(input_row)
        
        # Include all calculated fields
        if status == 'SUCCESS':
            output_row.update(calculation_result)
            output_row['status'] = 'SUCCESS'
            output_row['error_message'] = ''
        else:
            output_row['status'] = 'ERROR'
            # Set calculated fields to empty
        
        return output_row
```

---

## 7. DYNAMIC FORMULA/RATE UPDATE REFLECTION

### 7.1 Automatic Update Mechanism

```python
class DynamicCSVProcessor:
    """CSV processor that automatically uses latest rates"""
    
    def __init__(self, config_version='latest'):
        if config_version == 'latest':
            # Always loads most recent config
            self.config_loader = ConfigurationLoader()
            self.calculator = PremiumCalculator(
                self.config_loader.load_latest_config()
            )
        else:
            # Use specific version
            self.calculator = PremiumCalculator(config_version)
    
    def reload_config(self):
        """Reload configuration (e.g., after update)"""
        latest_config = self.config_loader.load_latest_config()
        self.calculator.update_config(latest_config)
```

### 7.2 Version Selection for Processing

```python
def process_csv_with_version(input_file, output_file, 
                             calculation_date=None, 
                             config_version=None):
    """Process CSV with specific config version"""
    
    # Determine which config to use
    if config_version:
        # Use explicit version
        version = config_version
    elif calculation_date:
        # Use version effective on calculation date
        loader = ConfigurationLoader()
        version = loader.get_version_for_date(calculation_date)
    else:
        # Use latest
        version = 'latest'
    
    # Process with selected version
    processor = CSVPremiumProcessor(config_version=version)
    return processor.process_file(input_file, output_file)
```

### 7.3 Rate Change Impact Testing

```python
class RateChangeImpactAnalyzer:
    """Analyze impact of rate changes on existing data"""
    
    def compare_versions(self, input_file, version_old, version_new):
        """Compare results between two config versions"""
        
        # Calculate with old version
        results_old = process_csv_with_version(
            input_file, '/tmp/old.csv', config_version=version_old
        )
        
        # Calculate with new version
        results_new = process_csv_with_version(
            input_file, '/tmp/new.csv', config_version=version_new
        )
        
        # Compare and report differences
        return self._generate_comparison_report(results_old, results_new)
```

---

## 8. COMMAND-LINE INTERFACE

### 8.1 CLI Design

```bash
# Basic usage
python csv_utility.py --input data.csv --output results.csv

# With options
python csv_utility.py \
    --input data.csv \
    --output results.csv \
    --config-version 2025-v1 \
    --batch-size 1000 \
    --parallel \
    --error-file errors.json \
    --progress

# Version info
python csv_utility.py --list-versions
python csv_utility.py --current-version
```

### 8.2 CLI Implementation

```python
import argparse

def main():
    parser = argparse.ArgumentParser(
        description='Private Car Premium Calculator - CSV Utility'
    )
    
    parser.add_argument('--input', '-i', required=True,
                       help='Input CSV file path')
    parser.add_argument('--output', '-o', required=True,
                       help='Output CSV file path')
    parser.add_argument('--config-version', '-v', default='latest',
                       help='Configuration version to use (default: latest)')
    parser.add_argument('--batch-size', '-b', type=int, default=1000,
                       help='Batch size for processing (default: 1000)')
    parser.add_argument('--parallel', '-p', action='store_true',
                       help='Enable parallel processing')
    parser.add_argument('--error-file', '-e', default='errors.json',
                       help='Error output file (default: errors.json)')
    parser.add_argument('--progress', action='store_true',
                       help='Show progress during processing')
    parser.add_argument('--list-versions', action='store_true',
                       help='List available configuration versions')
    
    args = parser.parse_args()
    
    if args.list_versions:
        list_available_versions()
        return
    
    # Process CSV
    processor = CSVPremiumProcessor(
        config_version=args.config_version,
        batch_size=args.batch_size,
        parallel=args.parallel,
        show_progress=args.progress
    )
    
    result = processor.process_file(args.input, args.output)
    
    # Print summary
    print(f"\nProcessing complete!")
    print(f"Total rows: {result['total_processed']}")
    print(f"Successful: {result['successful']}")
    print(f"Errors: {result['errors']}")
    
    if result['errors'] > 0:
        print(f"Error details saved to: {args.error_file}")
        save_errors(result['error_details'], args.error_file)
```

---

## 9. SAMPLE CSV TEMPLATES

### 9.1 Input Template (input_template.csv)

```csv
policy_type,vehicle_type,cubic_capacity,zone,purchase_date,idv,ncb,od_discount,builtin_cng_lpg,cng_lpg_si,nil_dep,return_to_invoice,ncb_protect,engine_protection,consumables,road_side_assistance,geo_extension,road_tax_cover,courtesy_car,additional_towing,medical_expenses,loss_of_key,tyre_rim_si,personal_effects,cpa_owner_driver,ll_paid_driver
Package,New,1000cc - 1500cc,A,2025-01-01,125000,0.2,60,1,0,1,1,1,1,1,1,1,0,1,1,1,1,100000,1,1,1
Package,Existing,Upto 1000cc,B,2020-05-15,85000,0.3,50,0,0,1,0,1,0,1,1,0,0,0,1,1,0,0,1,1,0
Package,New,>1500cc,A,2024-12-01,200000,0,70,0,25000,1,1,1,1,1,1,1,0,1,0,1,1,50000,1,1,1
```

### 9.2 Output Sample (output_sample.csv)

```csv
policy_type,vehicle_type,cubic_capacity,zone,purchase_date,idv,ncb,od_discount,...,age_years,od_base_rate_percent,basic_od_premium,nil_dep_premium,...,net_premium,cgst,sgst,total_premium,status,error_message
Package,New,1000cc - 1500cc,A,2025-01-01,125000,0.2,60,...,1,3.283,4103.75,410.38,...,5250.50,472.55,472.55,6195.60,SUCCESS,
Package,Existing,Upto 1000cc,B,2020-05-15,85000,0.3,50,...,5,3.191,2712.35,542.47,...,3850.25,346.52,346.52,4543.29,SUCCESS,
```

---

## 10. TESTING STRATEGY

### 10.1 Unit Tests

```python
def test_single_row_calculation():
    """Test single row processing"""
    input_row = {
        'policy_type': 'Package',
        'idv': '125000',
        'zone': 'A',
        # ... complete row
    }
    
    result = process_single_row(input_row, 1, calculator)
    
    assert result['status'] == 'SUCCESS'
    assert 'total_premium' in result
    assert result['total_premium'] > 0

def test_validation_errors():
    """Test validation error handling"""
    invalid_row = {
        'idv': 'invalid',  # Should be numeric
        'zone': 'C'  # Should be A or B
    }
    
    result = process_single_row(invalid_row, 1, calculator)
    
    assert result['status'] == 'ERROR'
    assert 'error_message' in result
```

### 10.2 Integration Tests

```python
def test_csv_end_to_end():
    """Test complete CSV processing"""
    # Create test input file
    create_test_csv('test_input.csv', 100)
    
    # Process
    processor = CSVPremiumProcessor()
    result = processor.process_file('test_input.csv', 'test_output.csv')
    
    # Verify
    assert result['total_processed'] == 100
    assert result['successful'] > 0
    
    # Verify output file
    output_data = read_csv('test_output.csv')
    assert len(output_data) == result['successful']
```

### 10.3 Performance Tests

```python
def test_large_file_performance():
    """Test performance with large files"""
    # Create 10,000 row file
    create_test_csv('large_test.csv', 10000)
    
    start_time = time.time()
    result = process_csv_with_version('large_test.csv', 'output.csv')
    elapsed = time.time() - start_time
    
    # Should process at least 100 rows/sec
    rate = result['total_processed'] / elapsed
    assert rate >= 100, f"Processing rate {rate} rows/sec is too slow"
```

---

## 11. USER DOCUMENTATION

### 11.1 Quick Start Guide

```markdown
# CSV Premium Calculator - Quick Start

## Step 1: Prepare Your CSV
Download the template: `input_template.csv`
Fill in your data following the column format.

## Step 2: Run Calculation
```bash
python csv_utility.py --input your_data.csv --output results.csv --progress
```

## Step 3: Review Results
- Success rows will have `status=SUCCESS` and calculated premiums
- Error rows will have `status=ERROR` and error descriptions
- Check `errors.json` for detailed error information

## Common Issues
- **Date Format:** Use YYYY-MM-DD format
- **Boolean Fields:** Use only 0 or 1
- **Numeric Fields:** No commas or currency symbols
```

---

## 12. SUMMARY

### 12.1 Key Features

✅ **One-Click Processing:** Upload CSV, get results  
✅ **Bulk Efficient:** Handle 10,000+ rows  
✅ **Comprehensive Validation:** Multi-layer validation  
✅ **Error Resilient:** Continue on row errors  
✅ **Dynamic Rates:** Auto-use latest configurations  
✅ **Parallel Processing:** Multi-core support  
✅ **Complete Output:** All inputs + calculations + final results  
✅ **Progress Tracking:** Real-time progress updates  
✅ **Modular Design:** Clean, maintainable code  

### 12.2 Implementation Checklist

- [ ] Implement core CSV processor
- [ ] Implement validation layers
- [ ] Implement input/output mappers
- [ ] Implement batch processing
- [ ] Implement parallel processing
- [ ] Implement error handling
- [ ] Implement progress tracking
- [ ] Implement CLI interface
- [ ] Create CSV templates
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Create user documentation
- [ ] Performance optimization
- [ ] End-to-end testing

---

**Document Version:** 1.0  
**Date:** 2026-02-17  
**Dependencies:** Requires Phase 2 Architecture Implementation  
**Next Steps:** Begin implementation following Phase 2 architecture
