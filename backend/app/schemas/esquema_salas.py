from pydantic import BaseModel


class RoomResponse(BaseModel):
    id: int
    name: str
    capacity: int

    class Config:
        from_attributes = True



