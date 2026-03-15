"""
FastAPI Web Application for Premium Calculator
"""
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field, field_validator
from typing import Dict, Any
import io
import json
import os
from pathlib import Path

from .core.calculator import PremiumCalculator
from .core.gcv_calculator import GCVPremiumCalculator
from .core.csv_processor import CSVProcessor, InputValidator
from .core.rate_lookup import RateLookupService
from .config.loader import ConfigurationLoader


app = FastAPI(
    title="Motor Premium Calculator API",
    description="API for calculating motor insurance premiums",
    version="1.0.0"
)

# Configure CORS - allow all origins for Railway deployment
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=False,  # Must be False when using wildcard origins
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Initialize calculator and configuration
print("=" * 60)
print("Initializing Motor Premium Calculator API...")
print(f"Working directory: {os.getcwd()}")
print(f"Python path: {os.path.dirname(__file__)}")

try:
    print("Loading configuration...")
    config_loader = ConfigurationLoader()
    print(f"✓ Configuration loaded from: {config_loader.config_dir}")
    
    print("Initializing calculator...")
    calculator = PremiumCalculator()
    print("✓ Calculator initialized")
    
    print("Initializing CSV processor...")
    csv_processor = CSVProcessor(calculator)
    print("✓ CSV processor initialized")

    print("Initializing GCV calculator...")
    gcv_calculator = GCVPremiumCalculator()
    print("✓ GCV calculator initialized")
    
    print("=" * 60)
    print("API initialization complete!")
    print("=" * 60)
    
except Exception as e:
    print("=" * 60)
    print(f"ERROR during API initialization: {e}")
    print("=" * 60)
    import traceback
    traceback.print_exc()
    raise


class PremiumInput(BaseModel):
    """Input model for premium calculation"""
    policy_type: str = "Package"
    vehicle_type: str = "New"
    cc_category: str = Field(..., description="Cubic capacity category")
    zone: str = Field(..., description="RTO zone (A or B)")
    purchase_date: str = Field(..., description="Registration/Purchase date (YYYY-MM-DD)")
    renewal_date: str = Field("", description="Renewal date (YYYY-MM-DD), optional")
    idv: float = Field(..., gt=0, description="Insured Declared Value")
    ncb_percent: float = Field(0, ge=0, le=0.5, description="NCB percentage (0-0.5)")
    od_discount_percent: float = Field(0, ge=0, le=100, description="OD discount %")
    builtin_cng_lpg: int = Field(0, ge=0, le=1)
    cng_lpg_si: float = Field(0, ge=0)
    nil_dep: int = Field(0, ge=0, le=1)
    return_to_invoice: int = Field(0, ge=0, le=1)
    ncb_protect: int = Field(0, ge=0, le=1)
    engine_protection: int = Field(0, ge=0, le=1)
    consumables: int = Field(0, ge=0, le=1)
    road_side_assistance: int = Field(0, ge=0, le=1)
    geo_extension: int = Field(0, ge=0, le=1)
    road_tax_cover: int = Field(0, ge=0, le=1)
    courtesy_car: int = Field(0, ge=0, le=1)
    additional_towing: int = Field(0, ge=0, le=1)
    medical_expenses: int = Field(0, ge=0, le=1)
    loss_of_key: int = Field(0, ge=0, le=1)
    tyre_rim_si: float = Field(0, ge=0)
    personal_effects: int = Field(0, ge=0, le=1)
    cpa_owner_driver: int = Field(0, ge=0, le=1)
    ll_paid_driver: int = Field(0, ge=0, le=1)
    pa_unnamed_persons: int = Field(0, ge=0, description="PA Cover Unnamed Persons - number of persons")
    pa_unnamed_si: float = Field(0, ge=0, description="PA Cover Unnamed Persons - capital sum insured per person")
    road_tax_si: float = Field(0, ge=0, description="Road Tax Cover sum insured")
    
    @field_validator('cc_category')
    @classmethod
    def validate_cc(cls, v):
        valid = ["upto_1000cc", "1000cc_1500cc", "above_1500cc"]
        if v not in valid:
            raise ValueError(f"Must be one of {valid}")
        return v
    
    @field_validator('zone')
    @classmethod
    def validate_zone(cls, v):
        if v not in ["A", "B"]:
            raise ValueError("Must be A or B")
        return v


class GCVPremiumInput(BaseModel):
    """Input model for GCV premium calculation"""
    policy_type: str = "Package"
    vehicle_type: str = "New"
    gvw: float = Field(..., gt=0, description="Gross Vehicle Weight in kg")
    zone: str = Field(..., description="RTO zone (A, B, or C)")
    purchase_date: str = Field(..., description="Registration/Purchase date (YYYY-MM-DD)")
    renewal_date: str = Field("", description="Renewal date (YYYY-MM-DD), optional")
    idv: float = Field(..., gt=0, description="Insured Declared Value")
    ncb_percent: float = Field(0, ge=0, le=0.5, description="NCB percentage (0-0.5)")
    od_discount_percent: float = Field(0, ge=0, le=100, description="OD discount %")
    builtin_cng_lpg: int = Field(0, ge=0, le=1)
    cng_lpg_si: float = Field(0, ge=0)
    nil_dep: int = Field(0, ge=0, le=1)
    return_to_invoice: int = Field(0, ge=0, le=1)
    consumables: int = Field(0, ge=0, le=1)
    road_side_assistance: int = Field(0, ge=0, le=1)
    additional_towing: int = Field(0, ge=0, le=1)
    additional_towing_si: float = Field(0, ge=0, description="Additional Towing Charges SI")
    imt23_cover: int = Field(0, ge=0, le=1)
    electrical_accessories_si: float = Field(0, ge=0, description="Electrical Accessories SI")
    non_electrical_accessories_si: float = Field(0, ge=0, description="Non-Electrical Accessories SI")
    cpa_owner_driver: int = Field(0, ge=0, le=1)
    ll_paid_driver: int = Field(0, ge=0, description="LL to paid driver - number of drivers")
    nfpp_employee: int = Field(0, ge=0, description="NFPP (Employee) - number of passengers")
    nfpp_non_employee: int = Field(0, ge=0, description="NFPP (Non-Employee) - number of passengers")

    @field_validator('zone')
    @classmethod
    def validate_gcv_zone(cls, v):
        if v not in ["A", "B", "C"]:
            raise ValueError("Must be A, B, or C")
        return v


@app.get("/")
def root():
    """Root endpoint"""
    return {
        "message": "Motor Premium Calculator API",
        "version": "1.0.0",
        "endpoints": {
            "calculate": "/calculate",
            "csv_upload": "/csv/process",
            "config": "/config",
            "health": "/health"
        }
    }


@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "calculator": "ready"}


@app.post("/calculate")
def calculate_premium(input_data: PremiumInput):
    """
    Calculate premium for single input
    
    Args:
        input_data: Premium calculation input
        
    Returns:
        Calculation results with premium breakdown
    """
    try:
        # Convert to dict
        data = input_data.model_dump()
        
        # Validate
        errors = InputValidator.validate_input(data)
        if errors:
            raise HTTPException(status_code=400, detail={"errors": errors})
        
        # Calculate
        result = calculator.calculate(data)
        
        return {
            "success": True,
            "data": result
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/csv/process")
async def process_csv(file: UploadFile = File(...)):
    """
    Process CSV file for bulk calculations
    
    Args:
        file: Uploaded CSV file
        
    Returns:
        Processing results with success/error counts
    """
    try:
        # Read file content
        content = await file.read()
        csv_content = content.decode('utf-8')
        
        # Process CSV
        results = csv_processor.process_csv_content(csv_content)
        
        return {
            "success": True,
            "total_rows": results["total_rows"],
            "successful": results["successful"],
            "failed": results["failed"],
            "results": results["results"][:100],  # Limit to first 100 for response
            "errors": results["errors"][:100],
            "has_more": results["successful"] > 100
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/csv/download")
async def download_csv(file: UploadFile = File(...)):
    """
    Process CSV and return results as downloadable CSV
    
    Args:
        file: Uploaded CSV file
        
    Returns:
        Processed CSV file with calculations
    """
    try:
        # Read and process
        content = await file.read()
        csv_content = content.decode('utf-8')
        results = csv_processor.process_csv_content(csv_content)
        
        # Generate output CSV
        output_csv = csv_processor.generate_output_csv(results["results"])
        
        # Return as streaming response
        return StreamingResponse(
            io.BytesIO(output_csv.encode('utf-8')),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=premium_results.csv"}
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/config/od-rates")
def get_od_rates():
    """Get OD base rates configuration"""
    return config_loader.load_od_base_rates()


@app.get("/config/tp-rates")
def get_tp_rates():
    """Get TP base rates configuration"""
    return config_loader.load_tp_base_rates()


@app.get("/config/addons")
def get_addon_config():
    """Get add-on premiums configuration"""
    return config_loader.load_addon_premiums()


@app.get("/config/discounts")
def get_discount_config():
    """Get discount rules configuration"""
    return config_loader.load_discount_rules()


@app.get("/config/gst")
def get_gst_config():
    """Get GST configuration"""
    return config_loader.load_gst_config()


_CONFIG_DIR = Path(__file__).parent.parent.parent / "config"


def _reload_calculator():
    """Reload calculator with fresh configuration after config changes"""
    global csv_processor
    config_loader.clear_cache()
    new_config = config_loader.load_all_configs()
    calculator.config = new_config
    calculator.rate_lookup = RateLookupService(new_config)
    csv_processor = CSVProcessor(calculator)


def _save_config(filename: str, config: Dict[str, Any], label: str):
    """Save configuration to JSON file and reload calculator"""
    try:
        config_path = _CONFIG_DIR / filename
        with open(config_path, 'w') as f:
            json.dump(config, f, indent=2)
        _reload_calculator()
        return {"success": True, "message": f"{label} updated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/config/od-rates")
def update_od_rates(config: Dict[str, Any]):
    """Update OD rates configuration"""
    return _save_config("od_base_rates.json", config, "OD rates")


@app.put("/config/addons")
def update_addon_config(config: Dict[str, Any]):
    """Update add-on configuration"""
    return _save_config("addon_premiums.json", config, "Add-on config")


@app.put("/config/tp-rates")
def update_tp_rates(config: Dict[str, Any]):
    """Update TP rates configuration"""
    return _save_config("tp_base_rates.json", config, "TP rates")


@app.put("/config/discounts")
def update_discount_config(config: Dict[str, Any]):
    """Update discount rules configuration"""
    return _save_config("discount_rules.json", config, "Discount rules")


@app.put("/config/gst")
def update_gst_config(config: Dict[str, Any]):
    """Update GST configuration"""
    return _save_config("gst_config.json", config, "GST config")


@app.get("/validate")
def validate_input(
    cc_category: str,
    zone: str,
    purchase_date: str,
    idv: float,
    ncb_percent: float = 0,
    od_discount_percent: float = 0
):
    """
    Validate input parameters
    
    Returns:
        Validation result
    """
    data = {
        "cc_category": cc_category,
        "zone": zone,
        "purchase_date": purchase_date,
        "idv": idv,
        "ncb_percent": ncb_percent,
        "od_discount_percent": od_discount_percent
    }
    
    errors = InputValidator.validate_input(data)
    
    return {
        "valid": len(errors) == 0,
        "errors": errors
    }


# ============================================================
# GCV (Goods Carrying Vehicle) Endpoints
# ============================================================

_GCV_CONFIG_DIR = Path(__file__).parent.parent.parent / "config" / "gcv"


def _reload_gcv_calculator():
    """Reload GCV calculator with fresh configuration"""
    gcv_calculator.reload_config()


def _save_gcv_config(filename: str, config: Dict[str, Any], label: str):
    """Save GCV configuration to JSON file and reload calculator"""
    try:
        config_path = _GCV_CONFIG_DIR / filename
        with open(config_path, 'w') as f:
            json.dump(config, f, indent=2)
        _reload_gcv_calculator()
        return {"success": True, "message": f"GCV {label} updated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/gcv/calculate")
def calculate_gcv_premium(input_data: GCVPremiumInput):
    """
    Calculate GCV premium for single input

    Args:
        input_data: GCV premium calculation input

    Returns:
        Calculation results with premium breakdown
    """
    try:
        data = input_data.model_dump()

        # Convert NCB from percentage to decimal if needed
        ncb_value = data.get("ncb_percent", 0)
        if ncb_value > 1:
            data["ncb_percent"] = ncb_value / 100

        result = gcv_calculator.calculate(data)

        return {
            "success": True,
            "data": result
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/gcv/config/od-rates")
def get_gcv_od_rates():
    """Get GCV OD base rates configuration"""
    return gcv_calculator.od_rates


@app.get("/gcv/config/tp-rates")
def get_gcv_tp_rates():
    """Get GCV TP base rates configuration"""
    return gcv_calculator.tp_rates


@app.get("/gcv/config/gst")
def get_gcv_gst_config():
    """Get GCV GST configuration"""
    return gcv_calculator.gst_config


@app.put("/gcv/config/od-rates")
def update_gcv_od_rates(config: Dict[str, Any]):
    """Update GCV OD rates configuration"""
    return _save_gcv_config("od_rates.json", config, "OD rates")


@app.put("/gcv/config/tp-rates")
def update_gcv_tp_rates(config: Dict[str, Any]):
    """Update GCV TP rates configuration"""
    return _save_gcv_config("tp_rates.json", config, "TP rates")


@app.put("/gcv/config/gst")
def update_gcv_gst_config(config: Dict[str, Any]):
    """Update GCV GST configuration"""
    return _save_gcv_config("gst_config.json", config, "GST config")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
