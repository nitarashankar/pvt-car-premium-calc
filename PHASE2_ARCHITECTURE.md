# Phase 2: Dynamic & Future-Ready Architecture Planning

## Executive Summary

This document outlines a comprehensive architecture for building a **dynamic, configurable, and future-ready** motor insurance premium calculation system. The design ensures that rates, formulas, discounts, and calculation logic can be modified without code changes, supporting scalability and maintainability.

---

## 1. ARCHITECTURAL PRINCIPLES

### 1.1 Core Design Principles
1. **Separation of Concerns:** Clear boundaries between data, business rules, and calculation logic
2. **Configuration-Driven:** All rates, formulas, and rules stored as configurable data
3. **Extensibility:** Easy addition of new add-ons and premium components
4. **Version Control:** Track changes to rates and formulas over time
5. **Backward Compatibility:** Support for historical calculations
6. **Performance:** Efficient for bulk processing
7. **Maintainability:** Non-technical users can update rates
8. **Auditability:** Complete trail of calculations and rate changes

---

## 2. SYSTEM ARCHITECTURE LAYERS

### 2.1 Four-Layer Architecture

```
┌─────────────────────────────────────────────────────────┐
│           Layer 4: Data Input/Output Layer              │
│  (CSV Upload, API Endpoints, UI Forms, Export)          │
└─────────────────────────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────┐
│           Layer 3: Calculation Engine Layer             │
│  (Premium Calculator, Formula Evaluator)                │
└─────────────────────────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────┐
│           Layer 2: Business Rules Layer                 │
│  (Rate Tables, Discount Rules, Eligibility Logic)       │
└─────────────────────────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────┐
│           Layer 1: Configuration Data Layer             │
│  (JSON/Database, Rate Tables, Formula Definitions)      │
└─────────────────────────────────────────────────────────┘
```

---

## 3. LAYER-BY-LAYER DESIGN

### Layer 1: Configuration Data Layer

#### 3.1 Rate Table Storage Structure

**Recommended Format: JSON** (easily portable, can migrate to database)

##### 3.1.1 OD Base Rate Table
```json
{
  "od_base_rates": {
    "version": "2025-v1",
    "effective_date": "2025-01-01",
    "rates": [
      {
        "age_min": 0,
        "age_max": 5,
        "zone": "A",
        "cc_category": "upto_1000cc",
        "rate_percent": 3.127
      },
      {
        "age_min": 0,
        "age_max": 5,
        "zone": "A",
        "cc_category": "1000cc_1500cc",
        "rate_percent": 3.283
      },
      {
        "age_min": 0,
        "age_max": 5,
        "zone": "A",
        "cc_category": "above_1500cc",
        "rate_percent": 3.44
      },
      // ... more entries for zones, age ranges
    ]
  }
}
```

##### 3.1.2 Third Party Base Rate Table
```json
{
  "tp_base_rates": {
    "version": "2025-v1",
    "effective_date": "2025-01-01",
    "rates": [
      {
        "cc_category": "upto_1000cc",
        "premium": 2094
      },
      {
        "cc_category": "1000cc_1500cc",
        "premium": 3416
      },
      {
        "cc_category": "above_1500cc",
        "premium": 7897
      }
    ]
  }
}
```

##### 3.1.3 Add-On Premium Configuration
```json
{
  "addon_premiums": {
    "version": "2025-v1",
    "effective_date": "2025-01-01",
    "addons": {
      "nil_dep": {
        "name": "Zero Depreciation",
        "category": "od",
        "calculation_type": "percentage_of_basic_od",
        "age_based": true,
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
        "age_based": true,
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
        "age_based": false,
        "premium": 50
      },
      "medical_expenses": {
        "name": "Medical Expenses Cover",
        "category": "od",
        "calculation_type": "flat_age_based",
        "age_based": true,
        "slabs": [
          {"age_min": 0, "age_max": 1, "premium": 275},
          {"age_min": 1, "age_max": 5, "premium": 325},
          {"age_min": 5, "age_max": 100, "premium": 450}
        ]
      },
      "tyre_rim_protector": {
        "name": "Tyre and RIM Protector",
        "category": "od",
        "calculation_type": "si_based_flat",
        "age_based": false,
        "si_slabs": [
          {"si": 25000, "premium": 1000},
          {"si": 50000, "premium": 2000},
          {"si": 100000, "premium": 4000},
          {"si": 200000, "premium": 8000}
        ]
      },
      "cng_lpg_si": {
        "name": "External CNG/LPG Kit",
        "category": "od",
        "calculation_type": "percentage_of_si",
        "age_based": false,
        "rate_percent": 4
      }
      // ... more add-ons
    }
  }
}
```

##### 3.1.4 Discount Configuration
```json
{
  "discount_rules": {
    "version": "2025-v1",
    "effective_date": "2025-01-01",
    "discounts": {
      "od_discount": {
        "name": "Own Damage Discount",
        "applicable_to": ["basic_od"],
        "type": "percentage_input",
        "min": 0,
        "max": 100
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
        "min": 0,
        "max": 50,
        "description": "Applied after OD discount on eligible components"
      }
    }
  }
}
```

##### 3.1.5 GST Configuration
```json
{
  "gst_config": {
    "version": "2025-v1",
    "effective_date": "2025-01-01",
    "cgst_percent": 9,
    "sgst_percent": 9,
    "applicable_to": "net_premium"
  }
}
```

#### 3.2 Formula Definition Storage

```json
{
  "formula_definitions": {
    "version": "2025-v1",
    "formulas": {
      "vehicle_age": {
        "name": "Calculate Vehicle Age",
        "expression": "years_between(purchase_date, current_date)",
        "output": "age_years"
      },
      "basic_od_rate": {
        "name": "Determine OD Base Rate",
        "type": "lookup",
        "lookup_table": "od_base_rates",
        "lookup_keys": ["age_years", "zone", "cc_category"],
        "output": "od_rate_percent"
      },
      "basic_od_premium": {
        "name": "Calculate Basic OD Premium",
        "expression": "idv * (od_rate_percent / 100)",
        "output": "basic_od"
      },
      "od_discount_amount": {
        "name": "Calculate OD Discount",
        "expression": "basic_od * (od_discount_percent / 100)",
        "output": "od_discount"
      },
      "ncb_base": {
        "name": "Calculate NCB Base Amount",
        "expression": "(basic_od - od_discount) + nil_dep + return_to_invoice + geo_ext_od + builtin_cng_od",
        "output": "ncb_base_amount"
      },
      "ncb_discount_amount": {
        "name": "Calculate NCB Discount",
        "expression": "ncb_base_amount * (ncb_percent / 100)",
        "output": "ncb_discount"
      },
      "net_premium": {
        "name": "Calculate Net Premium",
        "expression": "sum_all_premiums() - od_discount - ncb_discount",
        "output": "net_premium"
      },
      "total_premium": {
        "name": "Calculate Total Premium with GST",
        "expression": "net_premium * (1 + (cgst_percent + sgst_percent) / 100)",
        "output": "total_premium"
      }
    }
  }
}
```

---

### Layer 2: Business Rules Layer

#### 3.3 Business Rule Engine

**Purpose:** Encapsulate all business logic separate from calculation mechanics

**Components:**

##### 3.3.1 Rule Validator
```python
class RuleValidator:
    """Validates input data against business rules"""
    
    def validate_vehicle_data(self, data):
        """Validate vehicle information"""
        rules = [
            ('idv', lambda x: x > 0, "IDV must be positive"),
            ('zone', lambda x: x in ['A', 'B'], "Zone must be A or B"),
            ('cc_category', lambda x: x in VALID_CC_CATEGORIES, "Invalid CC category"),
            ('purchase_date', lambda x: x <= today(), "Purchase date cannot be future")
        ]
        # Execute validations
        
    def validate_addon_eligibility(self, addon_id, vehicle_data):
        """Check if addon is eligible for this vehicle"""
        # Age restrictions, vehicle type restrictions, etc.
```

##### 3.3.2 Rate Lookup Service
```python
class RateLookupService:
    """Retrieves rates from configuration based on criteria"""
    
    def __init__(self, config_loader):
        self.config = config_loader.load_all_configs()
    
    def get_od_base_rate(self, age, zone, cc_category):
        """Lookup OD base rate"""
        rates = self.config['od_base_rates']['rates']
        for rate in rates:
            if (rate['age_min'] <= age < rate['age_max'] and
                rate['zone'] == zone and
                rate['cc_category'] == cc_category):
                return rate['rate_percent']
        raise RateNotFoundException()
    
    def get_addon_rate(self, addon_id, age=None, si=None):
        """Lookup addon premium rate"""
        addon_config = self.config['addon_premiums']['addons'][addon_id]
        
        if addon_config['calculation_type'] == 'flat':
            return addon_config['premium']
        
        elif addon_config['calculation_type'] == 'percentage_of_idv':
            # Find age-appropriate slab
            for slab in addon_config['slabs']:
                if slab['age_min'] <= age < slab['age_max']:
                    return slab['rate_percent']
        
        # ... other calculation types
```

##### 3.3.3 Discount Rule Engine
```python
class DiscountRuleEngine:
    """Manages discount application logic"""
    
    def calculate_od_discount(self, basic_od, discount_percent):
        """Calculate OD discount"""
        return basic_od * (discount_percent / 100)
    
    def calculate_ncb_discount(self, premiums, ncb_percent):
        """Calculate NCB discount on eligible components"""
        eligible_components = [
            premiums['basic_od_after_discount'],
            premiums.get('nil_dep', 0),
            premiums.get('return_to_invoice', 0),
            premiums.get('geo_extension_od', 0),
            premiums.get('builtin_cng_od', 0)
        ]
        ncb_base = sum(eligible_components)
        return ncb_base * (ncb_percent / 100)
    
    def get_discount_hierarchy(self):
        """Return order of discount application"""
        return ['od_discount', 'ncb']
```

##### 3.3.4 Formula Registry
```python
class FormulaRegistry:
    """Central registry of all calculation formulas"""
    
    def __init__(self, formula_definitions):
        self.formulas = formula_definitions
        self.execution_order = self._determine_execution_order()
    
    def get_formula(self, formula_name):
        """Retrieve formula definition"""
        return self.formulas['formulas'][formula_name]
    
    def _determine_execution_order(self):
        """Calculate correct execution order based on dependencies"""
        # Topological sort of formula dependencies
        # Returns: ['vehicle_age', 'basic_od_rate', 'basic_od_premium', ...]
```

---

### Layer 3: Calculation Engine Layer

#### 3.4 Calculation Engine Architecture

**Purpose:** Execute calculations using business rules and configuration data

##### 3.4.1 Premium Calculator (Main Orchestrator)
```python
class PremiumCalculator:
    """Main calculation orchestrator"""
    
    def __init__(self, config_version='latest'):
        self.config_loader = ConfigurationLoader(config_version)
        self.rule_validator = RuleValidator(self.config_loader)
        self.rate_lookup = RateLookupService(self.config_loader)
        self.discount_engine = DiscountRuleEngine(self.config_loader)
        self.formula_registry = FormulaRegistry(self.config_loader.load_formulas())
        self.evaluator = FormulaEvaluator()
    
    def calculate(self, input_data):
        """Main calculation method"""
        # Step 1: Validate input
        self.rule_validator.validate_all(input_data)
        
        # Step 2: Initialize calculation context
        context = CalculationContext(input_data)
        
        # Step 3: Execute formulas in order
        for formula_name in self.formula_registry.execution_order:
            formula = self.formula_registry.get_formula(formula_name)
            result = self.evaluator.evaluate(formula, context)
            context.set_value(formula['output'], result)
        
        # Step 4: Return complete calculation
        return context.get_output()
```

##### 3.4.2 Formula Evaluator
```python
class FormulaEvaluator:
    """Evaluates formula expressions"""
    
    def evaluate(self, formula, context):
        """Evaluate a single formula"""
        if formula['type'] == 'lookup':
            return self._evaluate_lookup(formula, context)
        elif formula['type'] == 'expression':
            return self._evaluate_expression(formula, context)
        elif formula['type'] == 'addon_calculation':
            return self._evaluate_addon(formula, context)
    
    def _evaluate_lookup(self, formula, context):
        """Perform table lookup"""
        # Extract lookup key values from context
        # Query rate table
        # Return matched rate
    
    def _evaluate_expression(self, formula, context):
        """Evaluate mathematical expression"""
        # Parse expression
        # Substitute variables from context
        # Compute result
```

##### 3.4.3 Calculation Context
```python
class CalculationContext:
    """Maintains state during calculation"""
    
    def __init__(self, input_data):
        self.inputs = input_data
        self.calculated_values = {}
        self.premiums = {}
        self.discounts = {}
    
    def get_value(self, key):
        """Get value (from inputs or calculated)"""
        if key in self.calculated_values:
            return self.calculated_values[key]
        return self.inputs.get(key)
    
    def set_value(self, key, value):
        """Store calculated value"""
        self.calculated_values[key] = value
    
    def get_output(self):
        """Generate final output structure"""
        return {
            'inputs': self.inputs,
            'calculated': self.calculated_values,
            'premiums': self.premiums,
            'discounts': self.discounts,
            'net_premium': self.calculated_values['net_premium'],
            'gst': {
                'cgst': self.calculated_values['cgst'],
                'sgst': self.calculated_values['sgst']
            },
            'total_premium': self.calculated_values['total_premium']
        }
```

##### 3.4.4 Add-On Calculator
```python
class AddOnCalculator:
    """Specialized calculator for add-on premiums"""
    
    def __init__(self, rate_lookup):
        self.rate_lookup = rate_lookup
    
    def calculate_addon(self, addon_id, context):
        """Calculate single add-on premium"""
        addon_config = self.rate_lookup.get_addon_config(addon_id)
        
        if not self._is_addon_selected(addon_id, context):
            return 0
        
        calc_type = addon_config['calculation_type']
        
        if calc_type == 'flat':
            return addon_config['premium']
        
        elif calc_type == 'percentage_of_idv':
            age = context.get_value('age_years')
            rate = self.rate_lookup.get_addon_rate(addon_id, age=age)
            idv = context.get_value('idv')
            return idv * (rate / 100)
        
        elif calc_type == 'percentage_of_basic_od':
            age = context.get_value('age_years')
            rate = self.rate_lookup.get_addon_rate(addon_id, age=age)
            basic_od = context.get_value('basic_od')
            return basic_od * (rate / 100)
        
        # ... other calculation types
```

---

### Layer 4: Data Input/Output Layer

#### 3.5 I/O Interfaces

##### 3.5.1 CSV Processor
```python
class CSVProcessor:
    """Handles CSV file upload and processing"""
    
    def __init__(self, calculator):
        self.calculator = calculator
    
    def process_csv(self, file_path):
        """Process CSV file row by row"""
        results = []
        errors = []
        
        with open(file_path, 'r') as f:
            reader = csv.DictReader(f)
            
            for row_num, row in enumerate(reader, start=2):
                try:
                    # Map CSV columns to input data
                    input_data = self._map_csv_row(row)
                    
                    # Calculate premium
                    result = self.calculator.calculate(input_data)
                    
                    # Prepare output row
                    output_row = self._prepare_output_row(row, result)
                    results.append(output_row)
                    
                except Exception as e:
                    errors.append({
                        'row': row_num,
                        'data': row,
                        'error': str(e)
                    })
        
        return {
            'success_count': len(results),
            'error_count': len(errors),
            'results': results,
            'errors': errors
        }
    
    def export_results(self, results, output_path):
        """Export results to CSV"""
        # Write results with all input + calculated + output fields
```

##### 3.5.2 API Interface
```python
from flask import Flask, request, jsonify

class PremiumCalculatorAPI:
    """REST API for premium calculation"""
    
    def __init__(self, calculator):
        self.calculator = calculator
        self.app = Flask(__name__)
        self._setup_routes()
    
    def _setup_routes(self):
        @self.app.route('/calculate', methods=['POST'])
        def calculate():
            input_data = request.json
            try:
                result = self.calculator.calculate(input_data)
                return jsonify({
                    'status': 'success',
                    'data': result
                })
            except ValidationError as e:
                return jsonify({
                    'status': 'error',
                    'message': str(e)
                }), 400
```

---

## 4. FORMULA MODULARIZATION STRATEGY

### 4.1 Formula Categories

**Category 1: Lookup-Based Formulas**
- OD Base Rate determination
- TP Base Rate determination
- Extract from configuration tables

**Category 2: Expression-Based Formulas**
- Mathematical calculations
- IDV × Rate%, discount calculations
- Defined as evaluable expressions

**Category 3: Conditional Logic Formulas**
- Age-based slab selection
- IF-THEN-ELSE logic
- Defined as rule trees

**Category 4: Aggregation Formulas**
- Sum of premiums
- Net premium calculation
- Defined as aggregate operations

### 4.2 Formula Expression Language

**Simple Expression Syntax:**
```
// Mathematical operations
"idv * (od_rate / 100)"
"basic_od * (od_discount / 100)"

// Conditional expressions
"if(age < 1, 275, if(age <= 5, 325, 450))"

// Lookups
"lookup(od_base_rates, age, zone, cc_category)"

// Aggregations
"sum(all_od_premiums) + sum(all_tp_premiums)"
```

### 4.3 Dynamic Formula Updates

**Process:**
1. Load new formula definition JSON
2. Validate formula syntax
3. Mark with version and effective date
4. System automatically uses appropriate version based on calculation date

---

## 5. VERSION CONTROL MECHANISM

### 5.1 Configuration Versioning

**Structure:**
```json
{
  "config_metadata": {
    "version": "2025-v2",
    "effective_date": "2025-07-01",
    "supersedes": "2025-v1",
    "created_by": "admin",
    "created_at": "2025-06-15T10:00:00Z",
    "approved_by": "manager",
    "approved_at": "2025-06-20T14:00:00Z",
    "change_summary": "Updated OD rates for Zone A, added new addon"
  },
  // ... rate tables, formulas, etc.
}
```

### 5.2 Version Selection Logic

```python
class ConfigurationLoader:
    """Loads appropriate configuration version"""
    
    def load_config_for_date(self, calculation_date):
        """Load config effective on given date"""
        # Find all versions effective on or before calculation_date
        # Return most recent applicable version
    
    def load_latest_config(self):
        """Load most recent configuration"""
        return self.load_config_for_date(datetime.today())
    
    def load_specific_version(self, version_id):
        """Load specific version by ID"""
        # For testing, auditing, or historical calculations
```

### 5.3 Change Tracking

**Change Log Structure:**
```json
{
  "change_log": [
    {
      "version": "2025-v2",
      "date": "2025-07-01",
      "changes": [
        {
          "type": "rate_update",
          "table": "od_base_rates",
          "field": "zone_a_upto_1000cc_age_0_5",
          "old_value": 3.127,
          "new_value": 3.150,
          "reason": "Regulatory update"
        },
        {
          "type": "addon_added",
          "addon_id": "key_replacement_plus",
          "details": {
            "name": "Key Replacement Plus",
            "premium": 1000
          }
        }
      ]
    }
  ]
}
```

---

## 6. ADDING NEW PREMIUM COMPONENTS

### 6.1 Extensibility Pattern

**To Add New Add-On:**

1. **Define in Configuration:**
```json
{
  "new_addon_id": {
    "name": "New Add-On Name",
    "category": "od",
    "calculation_type": "percentage_of_idv",
    "age_based": true,
    "slabs": [
      {"age_min": 0, "age_max": 5, "rate_percent": 0.5},
      {"age_min": 5, "age_max": 100, "rate_percent": 0.8}
    ],
    "eligible_for_ncb": true
  }
}
```

2. **Update Formula Registry (if needed):**
```json
{
  "new_addon_formula": {
    "name": "Calculate New Add-On",
    "type": "addon_calculation",
    "addon_id": "new_addon_id",
    "output": "new_addon_premium"
  }
}
```

3. **No Code Changes Required**
- Calculation engine automatically processes based on `calculation_type`
- Rate lookup service handles slab-based logic
- Aggregation includes new premium automatically

### 6.2 Plugin Architecture (Advanced)

For complex custom logic:

```python
class AddOnPlugin:
    """Base class for custom add-on calculators"""
    
    def calculate(self, context):
        """Override to implement custom logic"""
        raise NotImplementedError()

# Register custom plugin
calculator.register_addon_plugin('custom_addon_id', CustomAddOnPlugin())
```

---

## 7. BACKWARD COMPATIBILITY

### 7.1 Compatibility Strategies

**Strategy 1: Version-Specific Calculation**
- Each calculation request specifies or infers config version
- Historical calculations use historical configs

**Strategy 2: Migration Scripts**
- When config structure changes, provide migration
- Convert old input format to new format

**Strategy 3: Deprecation Policy**
```python
class DeprecatedFieldHandler:
    """Handle deprecated fields gracefully"""
    
    def map_deprecated_field(self, old_field, input_data):
        """Map old field names to new ones"""
        if old_field == 'old_name':
            return input_data.get('new_name', default_value)
```

### 7.2 Data Migration

**Example Migration:**
```json
{
  "migration_v1_to_v2": {
    "field_renames": {
      "cc_capacity": "cc_category"
    },
    "value_transformations": {
      "cc_category": {
        "1000cc": "upto_1000cc",
        "1500cc": "1000cc_1500cc",
        "2000cc": "above_1500cc"
      }
    }
  }
}
```

---

## 8. DATABASE SCHEMA (FOR PRODUCTION)

### 8.1 Core Tables

```sql
-- Configuration Versions
CREATE TABLE config_versions (
    version_id VARCHAR(50) PRIMARY KEY,
    effective_date DATE NOT NULL,
    supersedes VARCHAR(50),
    created_at TIMESTAMP,
    approved_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    change_summary TEXT
);

-- OD Base Rates
CREATE TABLE od_base_rates (
    id SERIAL PRIMARY KEY,
    version_id VARCHAR(50) REFERENCES config_versions(version_id),
    age_min INT,
    age_max INT,
    zone VARCHAR(10),
    cc_category VARCHAR(50),
    rate_percent DECIMAL(10, 4),
    UNIQUE(version_id, age_min, age_max, zone, cc_category)
);

-- TP Base Rates
CREATE TABLE tp_base_rates (
    id SERIAL PRIMARY KEY,
    version_id VARCHAR(50) REFERENCES config_versions(version_id),
    cc_category VARCHAR(50),
    premium DECIMAL(10, 2),
    UNIQUE(version_id, cc_category)
);

-- Add-On Configurations
CREATE TABLE addon_configs (
    id SERIAL PRIMARY KEY,
    version_id VARCHAR(50) REFERENCES config_versions(version_id),
    addon_id VARCHAR(100),
    addon_name VARCHAR(255),
    category VARCHAR(50),
    calculation_type VARCHAR(100),
    age_based BOOLEAN,
    config_json JSONB,  -- Stores slabs, rates, etc.
    UNIQUE(version_id, addon_id)
);

-- Calculation History (for audit)
CREATE TABLE calculation_history (
    id SERIAL PRIMARY KEY,
    calculation_date TIMESTAMP,
    config_version VARCHAR(50),
    input_data JSONB,
    output_data JSONB,
    user_id VARCHAR(100),
    source VARCHAR(50)  -- 'csv', 'api', 'ui'
);
```

### 8.2 Query Examples

```sql
-- Get OD rate for specific criteria
SELECT rate_percent 
FROM od_base_rates 
WHERE version_id = '2025-v1'
  AND age_min <= 3 AND age_max > 3
  AND zone = 'A'
  AND cc_category = '1000cc_1500cc';

-- Get all active add-ons for a version
SELECT addon_id, addon_name, config_json
FROM addon_configs
WHERE version_id = '2025-v1';
```

---

## 9. PERFORMANCE CONSIDERATIONS

### 9.1 Optimization Strategies

**1. Configuration Caching**
```python
class CachedConfigLoader:
    """Cache configurations in memory"""
    
    def __init__(self):
        self._cache = {}
    
    def load_config(self, version):
        if version not in self._cache:
            self._cache[version] = self._load_from_source(version)
        return self._cache[version]
```

**2. Bulk Processing**
```python
class BulkCalculator:
    """Optimized for processing multiple records"""
    
    def calculate_bulk(self, input_list):
        # Load config once
        config = self.config_loader.load_latest_config()
        
        # Process all records with same config
        results = []
        for input_data in input_list:
            result = self.calculator.calculate(input_data, config)
            results.append(result)
        
        return results
```

**3. Parallel Processing**
```python
from concurrent.futures import ProcessPoolExecutor

def process_csv_parallel(csv_file, num_workers=4):
    """Process CSV in parallel chunks"""
    chunks = split_csv_into_chunks(csv_file, num_workers)
    
    with ProcessPoolExecutor(max_workers=num_workers) as executor:
        futures = [executor.submit(process_chunk, chunk) for chunk in chunks]
        results = [f.result() for f in futures]
    
    return combine_results(results)
```

**4. Database Indexing**
```sql
-- Index for fast rate lookups
CREATE INDEX idx_od_rates_lookup 
ON od_base_rates(version_id, age_min, age_max, zone, cc_category);

CREATE INDEX idx_addon_lookup 
ON addon_configs(version_id, addon_id);
```

---

## 10. IMPLEMENTATION ROADMAP

### Phase 1: Foundation (Weeks 1-2)
- [ ] Design and implement Layer 1 (Configuration Data Layer)
- [ ] Create JSON schema for all rate tables
- [ ] Implement ConfigurationLoader
- [ ] Set up version control structure

### Phase 2: Business Logic (Weeks 3-4)
- [ ] Implement Layer 2 (Business Rules Layer)
- [ ] Build RateLookupService
- [ ] Build RuleValidator
- [ ] Build DiscountRuleEngine
- [ ] Create FormulaRegistry

### Phase 3: Calculation Engine (Weeks 5-6)
- [ ] Implement Layer 3 (Calculation Engine)
- [ ] Build PremiumCalculator
- [ ] Build FormulaEvaluator
- [ ] Build AddOnCalculator
- [ ] Unit test all calculations against Excel

### Phase 4: I/O Layer (Weeks 7-8)
- [ ] Implement Layer 4 (I/O Layer)
- [ ] Build CSVProcessor
- [ ] Create input/output mappers
- [ ] Implement error handling and validation
- [ ] Build bulk processing capability

### Phase 5: Testing & Validation (Weeks 9-10)
- [ ] Comprehensive testing against Excel file
- [ ] Performance testing with large datasets
- [ ] Validation of all edge cases
- [ ] Documentation

### Phase 6: Production Features (Weeks 11-12)
- [ ] Database integration (optional)
- [ ] API development (if needed)
- [ ] Admin UI for rate management
- [ ] Audit logging
- [ ] Deployment

---

## 11. SUMMARY

### Key Architectural Decisions

1. **JSON-Based Configuration:** Easy to version, edit, and migrate
2. **Four-Layer Architecture:** Clear separation of concerns
3. **Formula Registry:** Centralized, versioned formula definitions
4. **Plugin Support:** Extensible for custom logic
5. **Version Control:** Built-in from day one
6. **Calculation Context:** Maintains state, enables debugging
7. **Bulk Optimization:** Designed for CSV processing from start

### Benefits of This Architecture

✅ **Zero Code Changes** for rate updates  
✅ **Easy Versioning** of rates and formulas  
✅ **Audit Trail** of all changes  
✅ **Backward Compatible** with historical data  
✅ **Extensible** for new add-ons  
✅ **Testable** - each layer independently testable  
✅ **Performant** - optimized for bulk processing  
✅ **Maintainable** - non-technical users can update rates  

---

**Document Version:** 1.0  
**Date:** 2026-02-17  
**Next Steps:** Proceed to Phase 3 - CSV Utility Planning
