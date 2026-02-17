"""
Premium Calculator - Main calculation engine for motor insurance premiums
"""
from datetime import datetime, date
from typing import Dict, Any
from decimal import Decimal, ROUND_HALF_UP

from ..config.loader import ConfigurationLoader
from .rate_lookup import RateLookupService


class PremiumCalculator:
    """Main premium calculator"""
    
    def __init__(self, config_dir: str = None):
        """
        Initialize premium calculator
        
        Args:
            config_dir: Path to configuration directory (optional)
        """
        self.config_loader = ConfigurationLoader(config_dir)
        self.config = self.config_loader.load_all_configs()
        self.rate_lookup = RateLookupService(self.config)
    
    def calculate(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculate premium for given input data - matches Excel exactly (all 86 fields)
        
        Args:
            input_data: Dictionary containing all input fields (26 fields from Excel A-Z)
            
        Returns:
            Dictionary containing all calculated values (30 fields AA-BD) 
            and display fields (30 fields BE-CH) exactly matching Excel
        """
        # Initialize calculation context - Primary calculations (AA-BD)
        calc = {}
        
        # Normalize policy type (accept both naming conventions)
        policy_type = self._normalize_policy_type(input_data.get("policy_type", "Package"))
        
        # Determine which components to calculate
        calculate_od = policy_type in ["Package", "Standalone OD"]
        calculate_tp = policy_type in ["Package", "Third Party"]
        
        # Step 1: AA - Calculate vehicle age in years (Excel column AA)
        calc["age_years"] = self._calculate_age(input_data["purchase_date"])
        
        # Step 2: AB - Get OD base rate (Excel column AB)
        # Only calculate if OD is needed
        if calculate_od:
            calc["od_base_rate_percent"] = self.rate_lookup.get_od_base_rate(
                calc["age_years"],
                input_data["zone"],
                input_data["cc_category"]
            )
        else:
            calc["od_base_rate_percent"] = 0
        
        # Step 3: AC - Calculate Basic OD Premium (Excel column AC)
        # Only calculate if OD is needed
        if calculate_od:
            calc["basic_od_premium"] = self._round(
                input_data["idv"] * calc["od_base_rate_percent"] / 100
            )
        else:
            calc["basic_od_premium"] = 0
        
        # Step 4: AD-AS - Calculate all OD add-on premiums (Excel columns AD-AS)
        # Only calculate OD add-ons if OD is needed
        if calculate_od:
            # AD - Nil Dep Premium
            calc["nil_dep_premium"] = self._calculate_nil_dep(
                input_data, calc["basic_od_premium"], calc["age_years"]
            )
        else:
            calc["nil_dep_premium"] = 0
        
        # AE - Engine and Gearbox Protection Premium
        if calculate_od:
            calc["engine_protection_premium"] = self._calculate_addon_percentage_idv(
                "engine_protection", input_data, calc["age_years"]
            )
        else:
            calc["engine_protection_premium"] = 0
        
        # AF - Road Side Assistance
        if calculate_od:
            calc["road_side_assistance_premium"] = self._calculate_flat_addon(
                "road_side_assistance", input_data
            )
        else:
            calc["road_side_assistance_premium"] = 0
        
        # AG - Return to Invoice Premium
        if calculate_od:
            calc["return_to_invoice_premium"] = self._calculate_addon_percentage_idv(
                "return_to_invoice", input_data, calc["age_years"]
            )
        else:
            calc["return_to_invoice_premium"] = 0
        
        # AH - NCB Protect Premium
        if calculate_od:
            calc["ncb_protect_premium"] = self._calculate_addon_percentage_idv(
                "ncb_protect", input_data, calc["age_years"]
            )
        else:
            calc["ncb_protect_premium"] = 0
        
        # AI - Consumables Premium
        if calculate_od:
            calc["consumables_premium"] = self._calculate_addon_percentage_idv(
                "consumables", input_data, calc["age_years"]
            )
        else:
            calc["consumables_premium"] = 0
        
        # AJ - Geographical Area Extension OD Premium
        if calculate_od:
            calc["geo_extension_od_premium"] = self._calculate_flat_addon(
                "geo_extension_od", input_data
            )
        else:
            calc["geo_extension_od_premium"] = 0
        
        # AK - Built in CNG/LPG OD Premium
        if calculate_od:
            calc["builtin_cng_od_premium"] = self._calculate_builtin_cng(
                input_data, calc["basic_od_premium"], calc["age_years"]
            )
        else:
            calc["builtin_cng_od_premium"] = 0
        
        # AL - CNG/LPG OD Premium
        if calculate_od:
            calc["cng_lpg_od_premium"] = self._calculate_cng_lpg_si(input_data)
        else:
            calc["cng_lpg_od_premium"] = 0
        
        # AM - Loss of Key (SI - 25k) Premium
        if calculate_od:
            calc["loss_of_key_premium"] = self._calculate_flat_addon(
                "loss_of_key", input_data
            )
        else:
            calc["loss_of_key_premium"] = 0
        
        # AN - Additional Towing Charges Premium
        if calculate_od:
            calc["towing_charges_premium"] = self._calculate_flat_addon(
                "additional_towing", input_data
            )
        else:
            calc["towing_charges_premium"] = 0
        
        # AO - Medical Expenses Premium
        if calculate_od:
            calc["medical_expenses_premium"] = self._calculate_flat_age_based(
                "medical_expenses", input_data, calc["age_years"]
            )
        else:
            calc["medical_expenses_premium"] = 0
        
        # AP - Tyre and RIM protector Premium
        if calculate_od:
            calc["tyre_rim_premium"] = self._calculate_si_based_flat(
                "tyre_rim", input_data
            )
        else:
            calc["tyre_rim_premium"] = 0
        
        # AQ - Personal Effects (SI - 10k) Premium
        if calculate_od:
            calc["personal_effects_premium"] = self._calculate_flat_addon(
                "personal_effects", input_data
            )
        else:
            calc["personal_effects_premium"] = 0
        
        # AR - Courtesy Car Cover Premium
        if calculate_od:
            calc["courtesy_car_premium"] = self._calculate_flat_age_based(
                "courtesy_car", input_data, calc["age_years"]
            )
        else:
            calc["courtesy_car_premium"] = 0
        
        # AS - Road Tax Premium
        if calculate_od:
            calc["road_tax_premium"] = self._calculate_road_tax(input_data)
        else:
            calc["road_tax_premium"] = 0
        
        # Step 5: AT-AX - Calculate TP premiums (Excel columns AT-AX)
        # Only calculate TP premiums if TP is needed
        # AT - Basic TP
        if calculate_tp:
            calc["basic_tp_premium"] = self.rate_lookup.get_tp_base_rate(
                input_data["cc_category"]
            )
        else:
            calc["basic_tp_premium"] = 0
        
        # AU - CPA owner Driver Premium
        if calculate_tp:
            calc["cpa_owner_premium"] = self._calculate_flat_addon(
                "cpa_owner_driver", input_data
            )
        else:
            calc["cpa_owner_premium"] = 0
        
        # AV - LL to paid Driver
        if calculate_tp:
            calc["ll_paid_driver_premium"] = self._calculate_flat_addon(
                "ll_paid_driver", input_data
            )
        else:
            calc["ll_paid_driver_premium"] = 0
        
        # AW - CNG/LPG TP Premium
        if calculate_tp:
            calc["cng_lpg_tp_premium"] = self._calculate_cng_lpg_tp(input_data)
        else:
            calc["cng_lpg_tp_premium"] = 0
        
        # AX - Geographical Area Extension TP Premium
        if calculate_tp:
            calc["geo_extension_tp_premium"] = self._calculate_flat_addon(
                "geo_extension_tp", input_data
            )
        else:
            calc["geo_extension_tp_premium"] = 0
        
        # Step 6: AY-AZ - Calculate discounts (Excel columns AY-AZ)
        # Only apply discounts if OD is calculated
        # AY - OD Discount
        if calculate_od:
            calc["od_discount_amount"] = self._round(
                calc["basic_od_premium"] * input_data.get("od_discount_percent", 0) / 100
            )
        else:
            calc["od_discount_amount"] = 0
        
        # AZ - NCB Discount
        if calculate_od:
            calc["ncb_discount_amount"] = self._calculate_ncb_discount(
                input_data, calc
            )
        else:
            calc["ncb_discount_amount"] = 0
        
        # Step 7: BA - Calculate net premium (Excel column BA)
        calc["net_premium"] = self._calculate_net_premium(calc)
        
        # Step 8: BB-BC - Calculate GST (Excel columns BB-BC)
        cgst_rate, sgst_rate = self.rate_lookup.get_gst_rates()
        # BB - CGST @9%
        calc["cgst"] = self._round(calc["net_premium"] * cgst_rate / 100)
        # BC - SGST @9%
        calc["sgst"] = self._round(calc["net_premium"] * sgst_rate / 100)
        
        # Step 9: BD - Calculate total premium (Excel column BD)
        calc["total_premium"] = self._round(
            calc["net_premium"] + calc["cgst"] + calc["sgst"]
        )
        
        # Step 10: BE-CH - Create display fields (Excel columns BE-CH) - exact copies of AA-BD
        display = {
            # BE-CH are exact copies of AA-BD for display/output section
            "age_years_display": calc["age_years"],
            "od_base_rate_percent_display": calc["od_base_rate_percent"],
            "basic_od_premium_display": calc["basic_od_premium"],
            "nil_dep_premium_display": calc["nil_dep_premium"],
            "engine_protection_premium_display": calc["engine_protection_premium"],
            "road_side_assistance_premium_display": calc["road_side_assistance_premium"],
            "return_to_invoice_premium_display": calc["return_to_invoice_premium"],
            "ncb_protect_premium_display": calc["ncb_protect_premium"],
            "consumables_premium_display": calc["consumables_premium"],
            "geo_extension_od_premium_display": calc["geo_extension_od_premium"],
            "builtin_cng_od_premium_display": calc["builtin_cng_od_premium"],
            "cng_lpg_od_premium_display": calc["cng_lpg_od_premium"],
            "loss_of_key_premium_display": calc["loss_of_key_premium"],
            "towing_charges_premium_display": calc["towing_charges_premium"],
            "medical_expenses_premium_display": calc["medical_expenses_premium"],
            "tyre_rim_premium_display": calc["tyre_rim_premium"],
            "personal_effects_premium_display": calc["personal_effects_premium"],
            "courtesy_car_premium_display": calc["courtesy_car_premium"],
            "road_tax_premium_display": calc["road_tax_premium"],
            "basic_tp_premium_display": calc["basic_tp_premium"],
            "cpa_owner_premium_display": calc["cpa_owner_premium"],
            "ll_paid_driver_premium_display": calc["ll_paid_driver_premium"],
            "cng_lpg_tp_premium_display": calc["cng_lpg_tp_premium"],
            "geo_extension_tp_premium_display": calc["geo_extension_tp_premium"],
            "od_discount_amount_display": calc["od_discount_amount"],
            "ncb_discount_amount_display": calc["ncb_discount_amount"],
            "net_premium_display": calc["net_premium"],
            "cgst_display": calc["cgst"],
            "sgst_display": calc["sgst"],
            "total_premium_display": calc["total_premium"]
        }
        
        return {
            "inputs": input_data,  # A-Z: All 26 input fields
            "calculations": calc,  # AA-BD: All 30 primary calculation fields
            "display": display,    # BE-CH: All 30 display fields (copies of calculations)
            "summary": {
                "net_premium": calc["net_premium"],
                "cgst": calc["cgst"],
                "sgst": calc["sgst"],
                "total_premium": calc["total_premium"]
            }
        }
    
    def _normalize_policy_type(self, policy_type: str) -> str:
        """
        Normalize policy type to standard values
        Accepts both frontend labels and backend values
        
        Returns one of: "Package", "Third Party", "Standalone OD"
        """
        if not policy_type:
            return "Package"  # Default
        
        policy_type_upper = policy_type.strip().upper()
        
        # Map various forms to standard values
        if policy_type_upper in ["PACKAGE", "COMPREHENSIVE"]:
            return "Package"
        elif policy_type_upper in ["THIRD PARTY", "THIRDPARTY", "LIABILITY ONLY", "LIABILITY"]:
            return "Third Party"
        elif policy_type_upper in ["STANDALONE OD", "STANDALONEOD", "OWN DAMAGE ONLY", "OWNDAMAGEONLY", "OD ONLY"]:
            return "Standalone OD"
        else:
            # Default to Package if unrecognized
            return "Package"
    
    def _calculate_age(self, purchase_date) -> int:
        """Calculate vehicle age in years"""
        if isinstance(purchase_date, str):
            purchase_date = datetime.fromisoformat(purchase_date.split()[0]).date()
        elif isinstance(purchase_date, datetime):
            purchase_date = purchase_date.date()
        
        today = date.today()
        age = today.year - purchase_date.year
        if (today.month, today.day) < (purchase_date.month, purchase_date.day):
            age -= 1
        
        return max(0, age)
    
    def _calculate_nil_dep(self, input_data, basic_od, age) -> float:
        """Calculate Nil Depreciation premium"""
        if not input_data.get("nil_dep", 0):
            return 0
        
        rate = self.rate_lookup.get_addon_rate("nil_dep", age=age)
        return self._round(basic_od * rate / 100)
    
    def _calculate_builtin_cng(self, input_data, basic_od, age) -> float:
        """Calculate Built-in CNG/LPG premium"""
        if not input_data.get("builtin_cng_lpg", 0):
            return 0
        
        rate = self.rate_lookup.get_addon_rate("builtin_cng_od", age=age)
        return self._round(basic_od * rate / 100)
    
    def _calculate_addon_percentage_idv(self, addon_id, input_data, age) -> float:
        """Calculate add-on premium as percentage of IDV"""
        # Map input fields to addon IDs
        field_map = {
            "engine_protection": "engine_protection",
            "return_to_invoice": "return_to_invoice",
            "ncb_protect": "ncb_protect",
            "consumables": "consumables"
        }
        
        input_field = field_map.get(addon_id, addon_id)
        
        if not input_data.get(input_field, 0):
            return 0
        
        rate = self.rate_lookup.get_addon_rate(addon_id, age=age)
        return self._round(input_data["idv"] * rate / 100)
    
    def _calculate_flat_addon(self, addon_id, input_data) -> float:
        """Calculate flat premium add-on"""
        # Map input fields to addon IDs
        field_map = {
            "road_side_assistance": "road_side_assistance",
            "geo_extension_od": "geo_extension",
            "loss_of_key": "loss_of_key",
            "additional_towing": "additional_towing",
            "personal_effects": "personal_effects",
            "cpa_owner_driver": "cpa_owner_driver",
            "ll_paid_driver": "ll_paid_driver",
            "geo_extension_tp": "geo_extension"
        }
        
        input_field = field_map.get(addon_id, addon_id)
        
        if not input_data.get(input_field, 0):
            return 0
        
        premium = self.rate_lookup.get_addon_rate(addon_id)
        return self._round(premium)
    
    def _calculate_flat_age_based(self, addon_id, input_data, age) -> float:
        """Calculate flat age-based premium"""
        field_map = {
            "medical_expenses": "medical_expenses",
            "courtesy_car": "courtesy_car"
        }
        
        input_field = field_map.get(addon_id, addon_id)
        
        if not input_data.get(input_field, 0):
            return 0
        
        premium = self.rate_lookup.get_addon_rate(addon_id, age=age)
        return self._round(premium)
    
    def _calculate_si_based_flat(self, addon_id, input_data) -> float:
        """Calculate SI-based flat premium"""
        field_map = {
            "tyre_rim": "tyre_rim_si"
        }
        
        si_field = field_map.get(addon_id, addon_id + "_si")
        si = input_data.get(si_field, 0)
        
        if si == 0:
            return 0
        
        premium = self.rate_lookup.get_addon_rate(addon_id, si=si)
        return self._round(premium)
    
    def _calculate_cng_lpg_si(self, input_data) -> float:
        """Calculate CNG/LPG SI premium"""
        si = input_data.get("cng_lpg_si", 0)
        if si == 0:
            return 0
        
        rate = self.rate_lookup.get_addon_rate("cng_lpg_si")
        return self._round(si * rate / 100)
    
    def _calculate_cng_lpg_tp(self, input_data) -> float:
        """Calculate CNG/LPG TP premium"""
        # TP premium applies if built-in CNG or external SI > 0
        if input_data.get("builtin_cng_lpg", 0) or input_data.get("cng_lpg_si", 0) > 0:
            return self.rate_lookup.get_addon_rate("cng_lpg_tp")
        return 0
    
    def _calculate_road_tax(self, input_data) -> float:
        """Calculate road tax cover premium"""
        if not input_data.get("road_tax_cover", 0):
            return 0
        
        # Road tax is 0.25% of (IDV * 20%)
        base_amount = input_data["idv"] * 0.20
        premium = base_amount * 0.25 / 100
        return self._round(premium)
    
    def _calculate_ncb_discount(self, input_data, calc) -> float:
        """Calculate NCB discount"""
        ncb_percent = input_data.get("ncb_percent", 0)
        if ncb_percent == 0:
            return 0
        
        # NCB applies to: (Basic OD - OD Discount) + Nil Dep + RTI + Geo Ext OD + Built-in CNG OD
        ncb_base = (
            calc["basic_od_premium"] - calc["od_discount_amount"] +
            calc["nil_dep_premium"] +
            calc["return_to_invoice_premium"] +
            calc["geo_extension_od_premium"] +
            calc["builtin_cng_od_premium"]
        )
        
        return self._round(ncb_base * ncb_percent)  # ncb_percent is in decimal (0.2 = 20%)
    
    def _calculate_net_premium(self, calc) -> float:
        """Calculate net premium (before GST)"""
        # Sum all OD premiums
        od_total = (
            calc["basic_od_premium"] +
            calc["nil_dep_premium"] +
            calc["engine_protection_premium"] +
            calc["road_side_assistance_premium"] +
            calc["return_to_invoice_premium"] +
            calc["ncb_protect_premium"] +
            calc["consumables_premium"] +
            calc["geo_extension_od_premium"] +
            calc["builtin_cng_od_premium"] +
            calc["cng_lpg_od_premium"] +
            calc["loss_of_key_premium"] +
            calc["towing_charges_premium"] +
            calc["medical_expenses_premium"] +
            calc["tyre_rim_premium"] +
            calc["personal_effects_premium"] +
            calc["courtesy_car_premium"] +
            calc["road_tax_premium"]
        )
        
        # Sum all TP premiums
        tp_total = (
            calc["basic_tp_premium"] +
            calc["cpa_owner_premium"] +
            calc["ll_paid_driver_premium"] +
            calc["cng_lpg_tp_premium"] +
            calc["geo_extension_tp_premium"]
        )
        
        # Net = (OD + TP) - Discounts
        net = od_total + tp_total - calc["od_discount_amount"] - calc["ncb_discount_amount"]
        
        return self._round(net)
    
    def _round(self, value: float) -> float:
        """Round to 2 decimal places"""
        return float(Decimal(str(value)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))
