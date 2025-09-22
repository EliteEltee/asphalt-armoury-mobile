from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Vehicle Checklist Models
class VehicleInfo(BaseModel):
    make: str
    model: str
    series: Optional[str] = ""
    year: str
    bodyType: Optional[str] = ""
    doors: Optional[str] = ""
    assembly: Optional[str] = ""
    licensing: Optional[str] = ""
    purchaseDate: Optional[str] = ""
    vin: Optional[str] = ""
    buildDate: Optional[str] = ""
    trimCode: Optional[str] = ""
    optionCode: Optional[str] = ""
    odometer: Optional[str] = ""
    paintColor: Optional[str] = ""
    engine: Optional[str] = ""
    transmission: Optional[str] = ""
    drive: Optional[str] = ""
    layout: Optional[str] = ""
    rimSize: Optional[str] = ""
    tyreSize: Optional[str] = ""
    weight: Optional[str] = ""
    wheelbase: Optional[str] = ""
    length: Optional[str] = ""
    height: Optional[str] = ""
    width: Optional[str] = ""

class EngineInfo(BaseModel):
    engineNumber: Optional[str] = ""
    engineCode: Optional[str] = ""
    description: Optional[str] = ""
    bore: Optional[str] = ""
    stroke: Optional[str] = ""
    compressionRatio: Optional[str] = ""
    power: Optional[str] = ""
    torque: Optional[str] = ""

class ChecklistItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    text: str
    completed: bool = False
    completed_at: Optional[datetime] = None

class Photo(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    base64_data: str
    description: Optional[str] = ""
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class VehicleChecklist(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    vehicle_info: VehicleInfo
    engine_info: EngineInfo
    tasks: List[ChecklistItem] = []
    parts_to_install: List[ChecklistItem] = []
    maintenance: List[ChecklistItem] = []
    research_items: List[ChecklistItem] = []
    photos: List[Photo] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    is_template: bool = False

class VehicleChecklistCreate(BaseModel):
    title: str
    vehicle_info: VehicleInfo
    engine_info: EngineInfo
    is_template: Optional[bool] = False

class VehicleChecklistUpdate(BaseModel):
    title: Optional[str] = None
    vehicle_info: Optional[VehicleInfo] = None
    engine_info: Optional[EngineInfo] = None
    tasks: Optional[List[ChecklistItem]] = None
    parts_to_install: Optional[List[ChecklistItem]] = None
    maintenance: Optional[List[ChecklistItem]] = None
    research_items: Optional[List[ChecklistItem]] = None
    photos: Optional[List[Photo]] = None

# API Routes
@api_router.get("/")
async def root():
    return {"message": "Vehicle Checklist API"}

@api_router.post("/checklists", response_model=VehicleChecklist)
async def create_checklist(checklist_data: VehicleChecklistCreate):
    """Create a new vehicle checklist"""
    checklist_dict = checklist_data.dict()
    checklist = VehicleChecklist(**checklist_dict)
    
    result = await db.checklists.insert_one(checklist.dict())
    if result.inserted_id:
        return checklist
    else:
        raise HTTPException(status_code=400, detail="Failed to create checklist")

@api_router.get("/checklists", response_model=List[VehicleChecklist])
async def get_checklists(is_template: Optional[bool] = None):
    """Get all vehicle checklists, optionally filter by template status"""
    query = {}
    if is_template is not None:
        query["is_template"] = is_template
    
    checklists = await db.checklists.find(query).to_list(1000)
    return [VehicleChecklist(**checklist) for checklist in checklists]

@api_router.get("/checklists/{checklist_id}", response_model=VehicleChecklist)
async def get_checklist(checklist_id: str):
    """Get a specific vehicle checklist by ID"""
    checklist = await db.checklists.find_one({"id": checklist_id})
    if not checklist:
        raise HTTPException(status_code=404, detail="Checklist not found")
    return VehicleChecklist(**checklist)

@api_router.put("/checklists/{checklist_id}", response_model=VehicleChecklist)
async def update_checklist(checklist_id: str, update_data: VehicleChecklistUpdate):
    """Update a vehicle checklist"""
    # Get the existing checklist
    existing = await db.checklists.find_one({"id": checklist_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Checklist not found")
    
    # Update only provided fields
    update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
    update_dict["updated_at"] = datetime.utcnow()
    
    result = await db.checklists.update_one(
        {"id": checklist_id},
        {"$set": update_dict}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Failed to update checklist")
    
    # Return updated checklist
    updated_checklist = await db.checklists.find_one({"id": checklist_id})
    return VehicleChecklist(**updated_checklist)

@api_router.delete("/checklists/{checklist_id}")
async def delete_checklist(checklist_id: str):
    """Delete a vehicle checklist"""
    result = await db.checklists.delete_one({"id": checklist_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Checklist not found")
    return {"message": "Checklist deleted successfully"}

@api_router.post("/checklists/{checklist_id}/items/{section}")
async def add_checklist_item(checklist_id: str, section: str, item_text: str):
    """Add an item to a specific section of the checklist"""
    valid_sections = ["tasks", "parts_to_install", "maintenance", "research_items"]
    if section not in valid_sections:
        raise HTTPException(status_code=400, detail=f"Invalid section. Must be one of: {valid_sections}")
    
    # Check if checklist exists
    existing = await db.checklists.find_one({"id": checklist_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Checklist not found")
    
    # Create new item
    new_item = ChecklistItem(text=item_text)
    
    # Add item to the specified section
    result = await db.checklists.update_one(
        {"id": checklist_id},
        {
            "$push": {section: new_item.dict()},
            "$set": {"updated_at": datetime.utcnow()}
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Failed to add item")
    
    return {"message": "Item added successfully", "item": new_item}

@api_router.put("/checklists/{checklist_id}/items/{section}/{item_id}/toggle")
async def toggle_checklist_item(checklist_id: str, section: str, item_id: str):
    """Toggle completion status of a checklist item"""
    valid_sections = ["tasks", "parts_to_install", "maintenance", "research_items"]
    if section not in valid_sections:
        raise HTTPException(status_code=400, detail=f"Invalid section. Must be one of: {valid_sections}")
    
    # Get the checklist
    checklist = await db.checklists.find_one({"id": checklist_id})
    if not checklist:
        raise HTTPException(status_code=404, detail="Checklist not found")
    
    # Find and toggle the item
    items = checklist.get(section, [])
    item_found = False
    
    for item in items:
        if item["id"] == item_id:
            item["completed"] = not item["completed"]
            item["completed_at"] = datetime.utcnow() if item["completed"] else None
            item_found = True
            break
    
    if not item_found:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Update the checklist
    result = await db.checklists.update_one(
        {"id": checklist_id},
        {
            "$set": {
                section: items,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Failed to update item")
    
    return {"message": "Item toggled successfully"}

@api_router.post("/checklists/{checklist_id}/photos")
async def add_photo(checklist_id: str, photo_data: Photo):
    """Add a photo to the checklist"""
    # Check if checklist exists
    existing = await db.checklists.find_one({"id": checklist_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Checklist not found")
    
    # Add photo
    result = await db.checklists.update_one(
        {"id": checklist_id},
        {
            "$push": {"photos": photo_data.dict()},
            "$set": {"updated_at": datetime.utcnow()}
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Failed to add photo")
    
    return {"message": "Photo added successfully", "photo": photo_data}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()