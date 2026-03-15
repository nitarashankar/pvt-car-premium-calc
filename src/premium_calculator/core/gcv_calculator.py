"""
GCV Premium Calculator - Calculation engine for Goods Carrying Vehicle insurance premiums
Based on GCV Calculator Excel formulas
"""
from datetime import datetime, date
from typing import Dict, Any
from decimal import Decimal, ROUND_HALF_UP
import math
import json
import os
from pathlib import Path


class GCVPremiumCalculator:
    """Premium calculator for Goods Carrying Vehicles (GCV)"""

    def __init__(self, config_dir: str = None):
        """
        Initialize GCV premium calculator

        Args:
            config_dir: Path to GCV configuration directory (optional)
        """
        if config_dir is None:
            env_config_dir = os.getenv('CONFIG_DIR')
            if env_config_dir:
                self.config_dir = Path(env_config_dir) / "gcv"
            else:
                current_file = Path(__file__)
                self.config_dir = current_file.parent.parent.parent.parent / "config" / "gcv"
                if not self.config_dir.exists():
                    docker_config = Path("/app/config/gcv")
                    if docker_config.exists():
                        self.config_dir = docker_config
        else:
            self.config_dir = Path(config_dir)

        self.od_rates = self._load_json("od_rates.json")
        self.tp_rates = self._load_json("tp_rates.json")
        self.gst_config = self._load_json("gst_config.json")

    def _load_json(self, filename: str) -> Dict[str, Any]:
        """Load a JSON configuration file"""
        file_path = self.config_dir / filename
        if not file_path.exists():
            raise FileNotFoundError(f"GCV config file not found: {file_path}")
        with open(file_path, 'r') as f:
            return json.load(f)

    def reload_config(self):
        """Reload all configuration from disk"""
        self.od_rates = self._load_json("od_rates.json")
        self.tp_rates = self._load_json("tp_rates.json")
        self.gst_config = self._load_json("gst_config.json")

    def calculate(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculate GCV premium for given input data - matches Excel exactly

        Args:
            input_data: Dictionary containing all GCV input fields

        Returns:
            Dictionary containing all calculated values
        """
        calc = {}

        policy_type = self._normalize_policy_type(input_data.get("policy_type", "Package"))
        calculate_od = policy_type in ["Package", "Standalone OD"]
        calculate_tp = policy_type in ["Package", "Third Party"]

        # Step 1: W - Calculate vehicle age in years
        calc["age_years"] = self._calculate_age(
            input_data["purchase_date"],
            input_data.get("renewal_date")
        )

        gvw = float(input_data.get("gvw", 0))
        idv = float(input_data.get("idv", 0))
        electrical_si = float(input_data.get("electrical_accessories_si", 0))
        non_electrical_si = float(input_data.get("non_electrical_accessories_si", 0))

        # Step 2: X - Get OD base rate
        if calculate_od:
            calc["od_base_rate_percent"] = self._get_od_rate(
                calc["age_years"], input_data.get("zone", "C")
            )
        else:
            calc["od_base_rate_percent"] = 0

        # Step 3: Y - Basic OD Premium = IDV * rate% + GVW surcharge
        if calculate_od:
            basic_od = idv * calc["od_base_rate_percent"] / 100
            # GVW surcharge: IF(GVW>12000, CEILING((GVW-12000)/100,1)*27, 0)
            if gvw > 12000:
                gvw_surcharge = math.ceil((gvw - 12000) / 100) * 27
                basic_od += gvw_surcharge
            calc["basic_od_premium"] = self._round(basic_od)
        else:
            calc["basic_od_premium"] = 0

        # Step 4: AH - Electrical Accessories Premium = electrical_si * 4%
        if calculate_od:
            calc["electrical_accessories_premium"] = self._round(electrical_si * 0.04)
        else:
            calc["electrical_accessories_premium"] = 0

        # Step 5: AI - Non-Electrical Accessories Premium = non_electrical_si * 1.726%
        if calculate_od:
            calc["non_electrical_accessories_premium"] = self._round(
                non_electrical_si * 0.01726
            )
        else:
            calc["non_electrical_accessories_premium"] = 0

        # Step 6: AN - OD Discount = ((basic_od + non_electrical) * od_discount%) / 100
        if calculate_od:
            od_discount_pct = float(input_data.get("od_discount_percent", 0))
            calc["od_discount_amount"] = self._round(
                (calc["basic_od_premium"] + calc["non_electrical_accessories_premium"])
                * od_discount_pct / 100
            )
        else:
            calc["od_discount_amount"] = 0

        # Step 7: Z - Nil Dep Premium
        if calculate_od:
            calc["nil_dep_premium"] = self._calculate_nil_dep(
                input_data, calc["basic_od_premium"],
                calc["electrical_accessories_premium"],
                calc["non_electrical_accessories_premium"],
                calc["age_years"]
            )
        else:
            calc["nil_dep_premium"] = 0

        # Step 8: AA - Road Side Assistance = flat 200
        if calculate_od:
            calc["road_side_assistance_premium"] = 200.0 if input_data.get("road_side_assistance", 0) else 0
        else:
            calc["road_side_assistance_premium"] = 0

        # Step 9: AB - Return to Invoice Premium
        if calculate_od:
            calc["return_to_invoice_premium"] = self._calculate_return_to_invoice(
                input_data, idv, electrical_si, non_electrical_si, calc["age_years"]
            )
        else:
            calc["return_to_invoice_premium"] = 0

        # Step 10: AC - Consumables Premium
        if calculate_od:
            calc["consumables_premium"] = self._calculate_consumables(
                input_data, idv, calc["age_years"]
            )
        else:
            calc["consumables_premium"] = 0

        # Step 11: AD - Built-in CNG/LPG OD Premium
        if calculate_od:
            calc["builtin_cng_od_premium"] = self._calculate_builtin_cng(
                input_data, calc["basic_od_premium"], calc["od_discount_amount"],
                calc["electrical_accessories_premium"],
                calc["non_electrical_accessories_premium"],
                calc["age_years"]
            )
        else:
            calc["builtin_cng_od_premium"] = 0

        # Step 12: AE - CNG/LPG OD Premium = CNG_SI * 4%
        if calculate_od:
            cng_si = float(input_data.get("cng_lpg_si", 0))
            calc["cng_lpg_od_premium"] = self._round(cng_si * 0.04) if cng_si > 0 else 0
        else:
            calc["cng_lpg_od_premium"] = 0

        # Step 13: AF - Additional Towing Charges Premium
        if calculate_od:
            calc["towing_charges_premium"] = self._calculate_towing(input_data)
        else:
            calc["towing_charges_premium"] = 0

        # Step 14: AG - IMT 23 Premium
        if calculate_od:
            calc["imt23_premium"] = self._calculate_imt23(
                input_data, calc["basic_od_premium"],
                calc["electrical_accessories_premium"],
                calc["non_electrical_accessories_premium"],
                calc["od_discount_amount"]
            )
        else:
            calc["imt23_premium"] = 0

        # Step 15: AJ - Basic TP
        if calculate_tp:
            calc["basic_tp_premium"] = self._get_tp_rate(gvw)
        else:
            calc["basic_tp_premium"] = 0

        # Step 16: AK - CPA Owner Driver = 275 if enabled
        if calculate_tp:
            calc["cpa_owner_premium"] = 275.0 if input_data.get("cpa_owner_driver", 0) else 0
        else:
            calc["cpa_owner_premium"] = 0

        # Step 17: AL - LL to paid Driver = 50 * count
        if calculate_tp:
            ll_count = int(input_data.get("ll_paid_driver", 0))
            calc["ll_paid_driver_premium"] = self._round(50.0 * ll_count) if ll_count > 0 else 0
        else:
            calc["ll_paid_driver_premium"] = 0

        # Step 18: AM - CNG/LPG TP = 60 if built_in or CNG_SI > 0
        if calculate_tp:
            has_cng = (input_data.get("builtin_cng_lpg", 0) or
                       float(input_data.get("cng_lpg_si", 0)) > 0)
            calc["cng_lpg_tp_premium"] = 60.0 if has_cng else 0
        else:
            calc["cng_lpg_tp_premium"] = 0

        # Step 18a: NFPP Employee = 75 * count
        if calculate_tp:
            nfpp_emp_count = int(input_data.get("nfpp_employee", 0))
            calc["nfpp_employee_premium"] = self._round(75.0 * nfpp_emp_count) if nfpp_emp_count > 0 else 0
        else:
            calc["nfpp_employee_premium"] = 0

        # Step 18b: NFPP Non-Employee = 75 * count
        if calculate_tp:
            nfpp_non_emp_count = int(input_data.get("nfpp_non_employee", 0))
            calc["nfpp_non_employee_premium"] = self._round(75.0 * nfpp_non_emp_count) if nfpp_non_emp_count > 0 else 0
        else:
            calc["nfpp_non_employee_premium"] = 0

        # Step 19: AO - NCB Discount
        if calculate_od:
            calc["ncb_discount_amount"] = self._calculate_ncb_discount(input_data, calc)
        else:
            calc["ncb_discount_amount"] = 0

        # Step 20: AP - Net OD Premium = SUM(all OD) - od_discount - ncb_discount
        od_total = (
            calc["basic_od_premium"] +
            calc["nil_dep_premium"] +
            calc["road_side_assistance_premium"] +
            calc["return_to_invoice_premium"] +
            calc["consumables_premium"] +
            calc["builtin_cng_od_premium"] +
            calc["cng_lpg_od_premium"] +
            calc["towing_charges_premium"] +
            calc["imt23_premium"] +
            calc["electrical_accessories_premium"] +
            calc["non_electrical_accessories_premium"]
        )
        calc["net_od_premium"] = self._round(
            od_total - calc["od_discount_amount"] - calc["ncb_discount_amount"]
        )

        # Step 21: AQ - Net TP Premium = SUM(all TP)
        calc["net_tp_premium"] = self._round(
            calc["basic_tp_premium"] +
            calc["cpa_owner_premium"] +
            calc["ll_paid_driver_premium"] +
            calc["cng_lpg_tp_premium"] +
            calc["nfpp_employee_premium"] +
            calc["nfpp_non_employee_premium"]
        )

        # Step 22: AR - IGST @18% - Others = (net_od + cpa + ll_driver + nfpp_employee + nfpp_non_employee) * 18%
        od_igst_rate = self.gst_config["od_igst_percent"]
        calc["igst_od"] = self._round(
            (calc["net_od_premium"] + calc["cpa_owner_premium"] +
             calc["ll_paid_driver_premium"] +
             calc["nfpp_employee_premium"] +
             calc["nfpp_non_employee_premium"]) * od_igst_rate / 100
        )

        # Step 23: AS - IGST TP @5% = (basic_tp + cng_tp) * 5%
        tp_igst_rate = self.gst_config["tp_igst_percent"]
        calc["igst_tp"] = self._round(
            (calc["basic_tp_premium"] + calc["cng_lpg_tp_premium"])
            * tp_igst_rate / 100
        )

        # Step 24: AT - Total Premium
        calc["total_premium"] = self._round(
            calc["net_od_premium"] + calc["net_tp_premium"] +
            calc["igst_od"] + calc["igst_tp"]
        )

        # Also compute net_premium for compatibility
        calc["net_premium"] = self._round(
            calc["net_od_premium"] + calc["net_tp_premium"]
        )

        # Display fields
        display = {k + "_display": v for k, v in calc.items()}

        return {
            "inputs": input_data,
            "calculations": calc,
            "display": display,
            "summary": {
                "net_od_premium": calc["net_od_premium"],
                "net_tp_premium": calc["net_tp_premium"],
                "igst_od": calc["igst_od"],
                "igst_tp": calc["igst_tp"],
                "total_premium": calc["total_premium"]
            }
        }

    def _normalize_policy_type(self, policy_type: str) -> str:
        """Normalize policy type to standard values"""
        if not policy_type:
            return "Package"
        policy_type_upper = policy_type.strip().upper()
        if policy_type_upper in ["PACKAGE", "COMPREHENSIVE"]:
            return "Package"
        elif policy_type_upper in ["THIRD PARTY", "THIRDPARTY", "LIABILITY ONLY", "LIABILITY"]:
            return "Third Party"
        elif policy_type_upper in ["STANDALONE OD", "STANDALONEOD", "OWN DAMAGE ONLY", "OWNDAMAGEONLY", "OD ONLY"]:
            return "Standalone OD"
        return "Package"

    def _calculate_age(self, purchase_date, renewal_date=None) -> float:
        """Calculate vehicle age in years with 2 decimal places"""
        if isinstance(purchase_date, str):
            purchase_date = datetime.fromisoformat(purchase_date.split()[0]).date()
        elif isinstance(purchase_date, datetime):
            purchase_date = purchase_date.date()

        if renewal_date:
            if isinstance(renewal_date, str):
                ref_date = datetime.fromisoformat(renewal_date.split()[0]).date()
            elif isinstance(renewal_date, datetime):
                ref_date = renewal_date.date()
            else:
                ref_date = renewal_date
        else:
            ref_date = date.today()

        delta = ref_date - purchase_date
        age = delta.days / 365.25
        return round(max(0, age), 2)

    def _get_od_rate(self, age: float, zone: str) -> float:
        """Get OD base rate from config based on age and zone"""
        for rate in self.od_rates["rates"]:
            if rate["age_min"] <= age < rate["age_max"] and rate["zone"] == zone:
                return rate["rate_percent"]
        raise ValueError(f"No GCV OD rate found for age={age}, zone={zone}")

    def _get_tp_rate(self, gvw: float) -> float:
        """Get TP base rate from config based on GVW"""
        for rate in self.tp_rates["rates"]:
            if rate["gvw_min"] <= gvw <= rate["gvw_max"]:
                return rate["premium"]
        raise ValueError(f"No GCV TP rate found for GVW={gvw}")

    def _calculate_nil_dep(self, input_data, basic_od, elec_prem, non_elec_prem, age) -> float:
        """
        Nil Dep Premium: IF enabled
        Age < 0.5: (basic_od + electrical + non_electrical) * 10%
        Age < 1.5: (basic_od + electrical + non_electrical) * 20%
        Otherwise: (basic_od + electrical + non_electrical) * 30%
        """
        if not input_data.get("nil_dep", 0):
            return 0
        base = basic_od + elec_prem + non_elec_prem
        if age < 0.5:
            return self._round(base * 0.10)
        elif age < 1.5:
            return self._round(base * 0.20)
        else:
            return self._round(base * 0.30)

    def _calculate_return_to_invoice(self, input_data, idv, elec_si, non_elec_si, age) -> float:
        """
        Return to Invoice: IF enabled
        Age < 1: (IDV + elec_si + non_elec_si) * 0.18%
        Age < 2: (IDV + elec_si + non_elec_si) * 0.20%
        Otherwise: (IDV + elec_si + non_elec_si) * 0.25%
        """
        if not input_data.get("return_to_invoice", 0):
            return 0
        base = idv + elec_si + non_elec_si
        if age < 1:
            return self._round(base * 0.0018)
        elif age < 2:
            return self._round(base * 0.0020)
        else:
            return self._round(base * 0.0025)

    def _calculate_consumables(self, input_data, idv, age) -> float:
        """
        Consumables: IF enabled, based on age
        Age < 1: IDV * 0.15%
        Age <= 2: IDV * 0.18%
        Age <= 3: IDV * 0.22%
        Age <= 4: IDV * 0.25%
        Otherwise: IDV * 0.30%
        """
        if not input_data.get("consumables", 0):
            return 0
        if age < 1:
            return self._round(idv * 0.0015)
        elif age <= 2:
            return self._round(idv * 0.0018)
        elif age <= 3:
            return self._round(idv * 0.0022)
        elif age <= 4:
            return self._round(idv * 0.0025)
        else:
            return self._round(idv * 0.0030)

    def _calculate_builtin_cng(self, input_data, basic_od, od_discount,
                                elec_prem, non_elec_prem, age) -> float:
        """
        Built-in CNG/LPG OD: IF enabled
        Age < 1: (basic_od - od_discount + electrical + non_electrical) * 5%
        Age < 2: (basic_od - od_discount + electrical + non_electrical) * 20% (4*5%)
        Otherwise: (basic_od - od_discount + electrical + non_electrical) * 5%
        """
        if not input_data.get("builtin_cng_lpg", 0):
            return 0
        base = basic_od - od_discount + elec_prem + non_elec_prem
        if age < 1:
            return self._round(base * 0.05)
        elif age < 2:
            return self._round(base * 0.20)
        else:
            return self._round(base * 0.05)

    def _calculate_towing(self, input_data) -> float:
        """
        Additional Towing Charges: IF enabled
        SI capped at Rs.20,000 for GCV
        SI <= 10000: SI * 5%
        Otherwise: SI * 7.5%
        """
        if not input_data.get("additional_towing", 0):
            return 0
        si = float(input_data.get("additional_towing_si", 0))
        if si <= 0:
            return 0
        # Cap towing SI at 20000 for GCV
        si = min(si, 20000)
        if si <= 10000:
            return self._round(si * 0.05)
        else:
            return self._round(si * 0.075)

    def _calculate_imt23(self, input_data, basic_od, elec_prem, non_elec_prem,
                          od_discount) -> float:
        """
        IMT 23 Premium: IF enabled
        (basic_od + electrical + non_electrical - od_discount) * 15%
        """
        if not input_data.get("imt23_cover", 0):
            return 0
        base = basic_od + elec_prem + non_elec_prem - od_discount
        return self._round(base * 0.15)

    def _calculate_ncb_discount(self, input_data, calc) -> float:
        """
        NCB Discount:
        ((basic_od - od_discount) + nil_dep + rti + builtin_cng + imt23 +
         electrical + non_electrical) * ncb%
        """
        ncb_percent = float(input_data.get("ncb_percent", 0))
        if ncb_percent == 0:
            return 0
        ncb_base = (
            calc["basic_od_premium"] - calc["od_discount_amount"] +
            calc["nil_dep_premium"] +
            calc["return_to_invoice_premium"] +
            calc["builtin_cng_od_premium"] +
            calc["imt23_premium"] +
            calc["electrical_accessories_premium"] +
            calc["non_electrical_accessories_premium"]
        )
        return self._round(ncb_base * ncb_percent)

    def _round(self, value: float) -> float:
        """Round to 2 decimal places using ROUND_HALF_UP"""
        return float(Decimal(str(value)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))
