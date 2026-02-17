"""
Rate Lookup Service - Retrieves rates from configuration based on criteria
"""
from typing import Dict, Any, Optional, List


class RateLookupService:
    """Service for looking up rates from configuration"""
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize rate lookup service
        
        Args:
            config: Complete configuration dictionary from ConfigurationLoader
        """
        self.config = config
        self.od_rates = config["od_base_rates"]["rates"]
        self.tp_rates = config["tp_base_rates"]["rates"]
        self.addon_config = config["addon_premiums"]["addons"]
        self.gst_config = config["gst_config"]
    
    def get_od_base_rate(self, age: int, zone: str, cc_category: str) -> float:
        """
        Lookup OD base rate
        
        Args:
            age: Vehicle age in years
            zone: RTO zone ('A' or 'B')
            cc_category: Cubic capacity category
            
        Returns:
            OD base rate as percentage
            
        Raises:
            ValueError: If no matching rate found
        """
        for rate in self.od_rates:
            if (rate["age_min"] <= age < rate["age_max"] and
                rate["zone"] == zone and
                rate["cc_category"] == cc_category):
                return rate["rate_percent"]
        
        raise ValueError(
            f"No OD rate found for age={age}, zone={zone}, cc_category={cc_category}"
        )
    
    def get_tp_base_rate(self, cc_category: str) -> float:
        """
        Lookup TP base rate
        
        Args:
            cc_category: Cubic capacity category
            
        Returns:
            TP premium amount
            
        Raises:
            ValueError: If no matching rate found
        """
        for rate in self.tp_rates:
            if rate["cc_category"] == cc_category:
                return rate["premium"]
        
        raise ValueError(f"No TP rate found for cc_category={cc_category}")
    
    def get_addon_config(self, addon_id: str) -> Dict[str, Any]:
        """
        Get configuration for a specific add-on
        
        Args:
            addon_id: Add-on identifier
            
        Returns:
            Add-on configuration dictionary
            
        Raises:
            ValueError: If add-on not found
        """
        if addon_id not in self.addon_config:
            raise ValueError(f"Add-on '{addon_id}' not found in configuration")
        
        return self.addon_config[addon_id]
    
    def get_addon_rate(self, addon_id: str, age: Optional[int] = None, 
                       si: Optional[float] = None) -> Any:
        """
        Lookup add-on rate based on calculation type
        
        Args:
            addon_id: Add-on identifier
            age: Vehicle age (for age-based add-ons)
            si: Sum insured (for SI-based add-ons)
            
        Returns:
            Rate/premium based on add-on calculation type
            
        Raises:
            ValueError: If rate not found or invalid parameters
        """
        addon = self.get_addon_config(addon_id)
        calc_type = addon["calculation_type"]
        
        # Flat premium (no age/SI dependency)
        if calc_type == "flat":
            return addon["premium"]
        
        # Percentage of IDV (age-based slabs)
        if calc_type == "percentage_of_idv":
            if age is None:
                raise ValueError(f"Age required for '{addon_id}'")
            if not addon.get("age_based", False):
                return addon["rate_percent"]
            return self._get_rate_from_slabs(addon["slabs"], age, "rate_percent")
        
        # Percentage of Basic OD (age-based slabs)
        if calc_type == "percentage_of_basic_od":
            if age is None:
                raise ValueError(f"Age required for '{addon_id}'")
            return self._get_rate_from_slabs(addon["slabs"], age, "rate_percent")
        
        # Percentage of SI
        if calc_type == "percentage_of_si":
            return addon["rate_percent"]
        
        # Flat amount based on age slabs
        if calc_type == "flat_age_based":
            if age is None:
                raise ValueError(f"Age required for '{addon_id}'")
            return self._get_rate_from_slabs(addon["slabs"], age, "premium")
        
        # SI-based flat amount
        if calc_type == "si_based_flat":
            if si is None:
                raise ValueError(f"SI required for '{addon_id}'")
            return self._get_si_based_premium(addon["si_slabs"], si)
        
        # Percentage of computed value
        if calc_type == "percentage_of_computed":
            return addon
        
        raise ValueError(f"Unknown calculation type: {calc_type}")
    
    def _get_rate_from_slabs(self, slabs: List[Dict], age: int, field: str) -> Any:
        """
        Get rate from age-based slabs
        
        Args:
            slabs: List of slab dictionaries
            age: Vehicle age
            field: Field name to extract ('rate_percent' or 'premium')
            
        Returns:
            Rate or premium from matching slab
            
        Raises:
            ValueError: If no matching slab found
        """
        for slab in slabs:
            if slab["age_min"] <= age < slab["age_max"]:
                return slab[field]
        
        raise ValueError(f"No slab found for age={age}")
    
    def _get_si_based_premium(self, si_slabs: List[Dict], si: float) -> float:
        """
        Get premium from SI-based slabs
        
        Args:
            si_slabs: List of SI slab dictionaries
            si: Sum insured amount
            
        Returns:
            Premium for matching SI slab
            
        Raises:
            ValueError: If no matching slab found or SI is 0
        """
        if si == 0:
            return 0
        
        for slab in si_slabs:
            if slab["si"] == si:
                return slab["premium"]
        
        raise ValueError(f"No premium found for SI={si}")
    
    def get_gst_rates(self) -> tuple:
        """
        Get GST rates
        
        Returns:
            Tuple of (CGST%, SGST%)
        """
        return (self.gst_config["cgst_percent"], self.gst_config["sgst_percent"])
