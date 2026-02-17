"""
Configuration Loader - Loads and manages JSON configuration files
"""
import json
import os
from pathlib import Path
from typing import Dict, Any, Optional
from datetime import datetime


class ConfigurationLoader:
    """Loads configuration from JSON files"""
    
    def __init__(self, config_dir: Optional[str] = None):
        """
        Initialize configuration loader
        
        Args:
            config_dir: Path to configuration directory. 
                       Defaults to ../../../config from this file
        """
        if config_dir is None:
            # Try environment variable first (for Docker/Railway)
            env_config_dir = os.getenv('CONFIG_DIR')
            if env_config_dir:
                self.config_dir = Path(env_config_dir)
            else:
                # Default to config directory at repository root
                current_file = Path(__file__)
                # Go up from src/premium_calculator/config/loader.py to root
                self.config_dir = current_file.parent.parent.parent.parent / "config"
                
                # Fallback: if that doesn't exist, try /app/config (Docker)
                if not self.config_dir.exists():
                    docker_config = Path("/app/config")
                    if docker_config.exists():
                        self.config_dir = docker_config
        else:
            self.config_dir = Path(config_dir)
        
        if not self.config_dir.exists():
            raise FileNotFoundError(
                f"Configuration directory not found: {self.config_dir}\n"
                f"Tried paths:\n"
                f"  - Environment variable CONFIG_DIR: {os.getenv('CONFIG_DIR')}\n"
                f"  - Calculated path: {Path(__file__).parent.parent.parent.parent / 'config'}\n"
                f"  - Docker fallback: /app/config\n"
                f"Current working directory: {Path.cwd()}"
            )
        
        self._config_cache = {}
    
    def load_od_base_rates(self) -> Dict[str, Any]:
        """Load OD base rate configuration"""
        return self._load_json("od_base_rates.json")
    
    def load_tp_base_rates(self) -> Dict[str, Any]:
        """Load TP base rate configuration"""
        return self._load_json("tp_base_rates.json")
    
    def load_addon_premiums(self) -> Dict[str, Any]:
        """Load add-on premium configuration"""
        return self._load_json("addon_premiums.json")
    
    def load_discount_rules(self) -> Dict[str, Any]:
        """Load discount rules configuration"""
        return self._load_json("discount_rules.json")
    
    def load_gst_config(self) -> Dict[str, Any]:
        """Load GST configuration"""
        return self._load_json("gst_config.json")
    
    def load_all_configs(self) -> Dict[str, Dict[str, Any]]:
        """Load all configuration files"""
        return {
            "od_base_rates": self.load_od_base_rates(),
            "tp_base_rates": self.load_tp_base_rates(),
            "addon_premiums": self.load_addon_premiums(),
            "discount_rules": self.load_discount_rules(),
            "gst_config": self.load_gst_config()
        }
    
    def get_config_version(self, config_name: str) -> str:
        """Get version of a specific configuration"""
        config = self._load_json(f"{config_name}.json")
        return config.get("version", "unknown")
    
    def _load_json(self, filename: str) -> Dict[str, Any]:
        """
        Load a JSON configuration file
        
        Args:
            filename: Name of the JSON file to load
            
        Returns:
            Parsed JSON data as dictionary
        """
        # Check cache first
        if filename in self._config_cache:
            return self._config_cache[filename]
        
        file_path = self.config_dir / filename
        if not file_path.exists():
            raise FileNotFoundError(f"Configuration file not found: {file_path}")
        
        with open(file_path, 'r') as f:
            config_data = json.load(f)
        
        # Cache the configuration
        self._config_cache[filename] = config_data
        
        return config_data
    
    def clear_cache(self):
        """Clear the configuration cache"""
        self._config_cache = {}
    
    def reload_config(self, filename: str) -> Dict[str, Any]:
        """
        Reload a specific configuration file (bypassing cache)
        
        Args:
            filename: Name of the JSON file to reload
            
        Returns:
            Freshly loaded configuration data
        """
        if filename in self._config_cache:
            del self._config_cache[filename]
        return self._load_json(filename)
