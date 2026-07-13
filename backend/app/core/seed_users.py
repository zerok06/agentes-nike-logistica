import asyncio
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from sqlalchemy import select

from app.core.database import CentralSessionLocal
from app.core.security import hash_password
from app.models.user import User

DEMO_USERS = [
    {
        "email": "admin@nike.com",
        "username": "admin",
        "password": "admin123",
        "role": "admin",
    },
    {
        "email": "supervisor@nike.com",
        "username": "supervisor",
        "password": "supervisor123",
        "role": "supervisor",
    },
    {
        "email": "operador@nike.com",
        "username": "operador",
        "password": "operador123",
        "role": "operador",
    },
]


async def seed_users():
    print("Iniciando semillero de usuarios demo...")

    async with CentralSessionLocal() as session:
        for user_data in DEMO_USERS:
            result = await session.execute(
                select(User).where(User.email == user_data["email"])
            )
            existing = result.scalar_one_or_none()

            if existing:
                print(f"  Usuario {user_data['email']} ya existe. Saltando...")
                continue

            user = User(
                email=user_data["email"],
                username=user_data["username"],
                password_hash=hash_password(user_data["password"]),
                role=user_data["role"],
            )
            session.add(user)
            print(f"  Usuario {user_data['email']} creado con rol {user_data['role']}.")

        await session.commit()
        print("Semillero de usuarios completado.")


if __name__ == "__main__":
    asyncio.run(seed_users())
