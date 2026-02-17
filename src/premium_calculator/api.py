"""
FastAPI Web Application for Premium Calculator
"""
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field, validator
from typing import Dict, Any, List, Optional
import io
import json
import os

from .core.calculator import PremiumCalculator
from .core.csv_processor import CSVProcessor, InputValidator
from .config.loader import ConfigurationLoader


app = FastAPI(
    title="Motor Premium Calculator API",
    description="API for calculating motor insurance premiums",
    version="1.0.0"
)

# Configure CORS - allow all origins for Railway deployment
# Note: In production with credentials, you must specify exact origins
# For now, we'll allow all origins without credentials
allowed_origins = [
    "http://localhost:3000",  # Local development
    "http://localhost:8000",
    "https://pvt-car-premium-calc-production.up.railway.app",  # Production frontend
    "*"  # Allow any other origin
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=False,  # Must be False when using wildcard origins
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Initialize calculator
calculator = PremiumCalculator()
csv_processor = CSVProcessor(calculator)
config_loader = ConfigurationLoader()


class PremiumInput(BaseModel):
    """Input model for premium calculation"""
    policy_type: str = "Package"
    vehicle_type: str = "New"
    cc_category: str = Field(..., description="Cubic capacity category")
    zone: str = Field(..., description="RTO zone (A or B)")
    purchase_date: str = Field(..., description="Purchase date (YYYY-MM-DD)")
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
    
    @validator('cc_category')
    def validate_cc(cls, v):
        valid = ["upto_1000cc", "1000cc_1500cc", "above_1500cc"]
        if v not in valid:
            raise ValueError(f"Must be one of {valid}")
        return v
    
    @validator('zone')
    def validate_zone(cls, v):
        if v not in ["A", "B"]:
            raise ValueError("Must be A or B")
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
        data = input_data.dict()
        
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


@app.put("/config/od-rates")
def update_od_rates(config: Dict[str, Any]):
    """
    Update OD rates configuration
    
    Args:
        config: New OD rates configuration
    """
    try:
        # Save to file
        import json
        from pathlib import Path
        
        config_path = Path(__file__).parent.parent.parent / "config" / "od_base_rates.json"
        with open(config_path, 'w') as f:
            json.dump(config, f, indent=2)
        
        # Reload config
        config_loader.clear_cache()
        
        return {"success": True, "message": "OD rates updated"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/config/addons")
def update_addon_config(config: Dict[str, Any]):
    """
    Update add-on configuration
    
    Args:
        config: New add-on configuration
    """
    try:
        import json
        from pathlib import Path
        
        config_path = Path(__file__).parent.parent.parent / "config" / "addon_premiums.json"
        with open(config_path, 'w') as f:
            json.dump(config, f, indent=2)
        
        config_loader.clear_cache()
        
        return {"success": True, "message": "Add-on config updated"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
