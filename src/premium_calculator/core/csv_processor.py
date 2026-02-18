"""
CSV Processor - Bulk premium calculation from CSV files
"""
import csv
import io
from typing import Dict, List, Any, Optional
from datetime import datetime

from .calculator import PremiumCalculator


class ValidationError(Exception):
    """Custom exception for validation errors"""
    pass


class InputValidator:
    """Enhanced input validation"""
    
    REQUIRED_FIELDS = ["cc_category", "zone", "purchase_date", "idv"]
    
    VALID_CC_CATEGORIES = ["upto_1000cc", "1000cc_1500cc", "above_1500cc"]
    VALID_ZONES = ["A", "B"]
    VALID_POLICY_TYPES = ["Package", "Third Party", "Standalone OD"]
    VALID_VEHICLE_TYPES = ["New", "Existing"]
    
    @classmethod
    def validate_input(cls, data: Dict[str, Any]) -> List[str]:
        """
        Validate input data
        
        Returns:
            List of error messages (empty if valid)
        """
        errors = []
        
        # Check required fields
        for field in cls.REQUIRED_FIELDS:
            if field not in data or data[field] is None or data[field] == "":
                errors.append(f"Missing required field: {field}")
        
        # Validate cc_category
        if "cc_category" in data and data["cc_category"] not in cls.VALID_CC_CATEGORIES:
            errors.append(f"Invalid cc_category. Must be one of: {cls.VALID_CC_CATEGORIES}")
        
        # Validate zone
        if "zone" in data and data["zone"] not in cls.VALID_ZONES:
            errors.append(f"Invalid zone. Must be one of: {cls.VALID_ZONES}")
        
        # Validate IDV
        if "idv" in data:
            try:
                idv = float(data["idv"])
                if idv <= 0:
                    errors.append("IDV must be positive")
                if idv > 10000000:  # 1 crore max
                    errors.append("IDV cannot exceed ₹1,00,00,000")
            except (ValueError, TypeError):
                errors.append("IDV must be a valid number")
        
        # Validate NCB
        if "ncb_percent" in data and data["ncb_percent"]:
            try:
                ncb = float(data["ncb_percent"])
                if ncb < 0 or ncb > 0.5:
                    errors.append("NCB must be between 0 and 0.5 (0-50%)")
            except (ValueError, TypeError):
                errors.append("NCB must be a valid number")
        
        # Validate OD discount
        if "od_discount_percent" in data and data["od_discount_percent"]:
            try:
                od_discount = float(data["od_discount_percent"])
                if od_discount < 0 or od_discount > 100:
                    errors.append("OD discount must be between 0 and 100")
            except (ValueError, TypeError):
                errors.append("OD discount must be a valid number")
        
        # Validate date
        if "purchase_date" in data and data["purchase_date"]:
            try:
                date_str = str(data["purchase_date"]).split()[0]
                date_obj = datetime.fromisoformat(date_str)
                if date_obj > datetime.now():
                    errors.append("Purchase date cannot be in the future")
            except (ValueError, TypeError):
                errors.append("Purchase date must be in YYYY-MM-DD format")
        
        # Validate renewal_date if provided
        if "renewal_date" in data and data["renewal_date"]:
            try:
                date_str = str(data["renewal_date"]).split()[0]
                datetime.fromisoformat(date_str)
            except (ValueError, TypeError):
                errors.append("Renewal date must be in YYYY-MM-DD format")
        
        # Validate tyre_rim_si
        if "tyre_rim_si" in data and data["tyre_rim_si"]:
            try:
                tyre_si = float(data["tyre_rim_si"])
                valid_values = [0, 25000, 50000, 100000, 200000]
                if tyre_si not in valid_values:
                    errors.append(f"Tyre RIM SI must be one of: {valid_values}")
            except (ValueError, TypeError):
                errors.append("Tyre RIM SI must be a valid number")
        
        return errors


class CSVProcessor:
    """Process CSV files for bulk premium calculation"""
    
    def __init__(self, calculator: Optional[PremiumCalculator] = None):
        """
        Initialize CSV processor
        
        Args:
            calculator: PremiumCalculator instance (creates new if None)
        """
        self.calculator = calculator or PremiumCalculator()
        self.validator = InputValidator()
    
    def process_csv_file(self, file_path: str) -> Dict[str, Any]:
        """
        Process CSV file and calculate premiums for all rows
        
        Args:
            file_path: Path to input CSV file
            
        Returns:
            Dictionary with results and errors
        """
        with open(file_path, 'r') as f:
            content = f.read()
        
        return self.process_csv_content(content)
    
    def process_csv_content(self, csv_content: str) -> Dict[str, Any]:
        """
        Process CSV content and calculate premiums
        
        Args:
            csv_content: CSV content as string
            
        Returns:
            Dictionary with results and errors
        """
        results = []
        errors = []
        
        csv_file = io.StringIO(csv_content)
        reader = csv.DictReader(csv_file)
        
        for row_num, row in enumerate(reader, start=2):  # Start at 2 (header is row 1)
            try:
                # Convert CSV row to input data
                input_data = self._csv_row_to_input(row)
                
                # Validate input
                validation_errors = self.validator.validate_input(input_data)
                if validation_errors:
                    errors.append({
                        "row": row_num,
                        "errors": validation_errors,
                        "data": row
                    })
                    continue
                
                # Calculate premium
                result = self.calculator.calculate(input_data)
                
                # Add row number to result
                result["row_number"] = row_num
                results.append(result)
                
            except Exception as e:
                errors.append({
                    "row": row_num,
                    "errors": [str(e)],
                    "data": row
                })
        
        return {
            "total_rows": len(results) + len(errors),
            "successful": len(results),
            "failed": len(errors),
            "results": results,
            "errors": errors
        }
    
    def generate_output_csv(self, results: List[Dict[str, Any]]) -> str:
        """
        Generate output CSV from calculation results - ALL 86 Excel columns
        
        Args:
            results: List of calculation results
            
        Returns:
            CSV content as string matching Excel exactly (86 columns total)
        """
        if not results:
            return ""
        
        output = io.StringIO()
        
        # Define output columns matching Excel exactly (A-CH, 86 columns total)
        # Columns A-Z: Input Fields (26 columns)
        input_fields = [
            "policy_type", "vehicle_type", "cc_category", "zone",
            "purchase_date", "renewal_date", "idv",
            "ncb_percent", "od_discount_percent", "builtin_cng_lpg", "cng_lpg_si",
            "nil_dep", "return_to_invoice", "ncb_protect", "engine_protection",
            "consumables", "road_side_assistance", "geo_extension", "road_tax_cover",
            "courtesy_car", "additional_towing", "medical_expenses", "loss_of_key",
            "tyre_rim_si", "personal_effects", "cpa_owner_driver", "ll_paid_driver"
        ]
        
        # Columns AA-BD: Primary Calculation Fields (30 columns)
        calc_fields = [
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
        
        # Columns BE-CH: Display Fields (30 columns) - exact copies of AA-BD
        display_fields = [f + "_display" for f in calc_fields]
        
        # All 86 columns
        all_fields = ["row_number"] + input_fields + calc_fields + display_fields
        
        writer = csv.DictWriter(output, fieldnames=all_fields)
        writer.writeheader()
        
        for result in results:
            row = {"row_number": result.get("row_number", "")}
            
            # Add input fields (A-Z)
            row.update(result["inputs"])
            
            # Add calculation fields (AA-BD)
            row.update(result["calculations"])
            
            # Add display fields (BE-CH) - copies of calculations
            if "display" in result:
                row.update(result["display"])
            else:
                # Fallback: create display fields from calculations
                for field in calc_fields:
                    row[field + "_display"] = result["calculations"].get(field, 0)
            
            writer.writerow(row)
        
        return output.getvalue()
    
    def _csv_row_to_input(self, row: Dict[str, str]) -> Dict[str, Any]:
        """
        Convert CSV row to calculator input format
        
        Args:
            row: CSV row as dictionary
            
        Returns:
            Input data dictionary
        """
        # Helper function to convert boolean
        def to_bool(val):
            if isinstance(val, str):
                val = val.strip().lower()
                if val in ['1', 'true', 'yes']:
                    return 1
                elif val in ['0', 'false', 'no', '']:
                    return 0
            try:
                return int(val)
            except:
                return 0
        
        # Helper function to convert float
        def to_float(val, default=0):
            try:
                return float(val) if val and val.strip() else default
            except:
                return default
        
        return {
            "policy_type": row.get("policy_type", "Package"),
            "vehicle_type": row.get("vehicle_type", "New"),
            "cc_category": row.get("cc_category", "").strip(),
            "zone": row.get("zone", "").strip(),
            "purchase_date": row.get("purchase_date", "").strip(),
            "renewal_date": row.get("renewal_date", "").strip(),
            "idv": to_float(row.get("idv")),
            "ncb_percent": to_float(row.get("ncb_percent", "0")) / 100 if "ncb_percent" in row else 0,
            "od_discount_percent": to_float(row.get("od_discount_percent", "0")),
            "builtin_cng_lpg": to_bool(row.get("builtin_cng_lpg", "0")),
            "cng_lpg_si": to_float(row.get("cng_lpg_si", "0")),
            "nil_dep": to_bool(row.get("nil_dep", "0")),
            "return_to_invoice": to_bool(row.get("return_to_invoice", "0")),
            "ncb_protect": to_bool(row.get("ncb_protect", "0")),
            "engine_protection": to_bool(row.get("engine_protection", "0")),
            "consumables": to_bool(row.get("consumables", "0")),
            "road_side_assistance": to_bool(row.get("road_side_assistance", "0")),
            "geo_extension": to_bool(row.get("geo_extension", "0")),
            "road_tax_cover": to_bool(row.get("road_tax_cover", "0")),
            "courtesy_car": to_bool(row.get("courtesy_car", "0")),
            "additional_towing": to_bool(row.get("additional_towing", "0")),
            "medical_expenses": to_bool(row.get("medical_expenses", "0")),
            "loss_of_key": to_bool(row.get("loss_of_key", "0")),
            "tyre_rim_si": to_float(row.get("tyre_rim_si", "0")),
            "personal_effects": to_bool(row.get("personal_effects", "0")),
            "cpa_owner_driver": to_bool(row.get("cpa_owner_driver", "0")),
            "ll_paid_driver": to_bool(row.get("ll_paid_driver", "0"))
        }
