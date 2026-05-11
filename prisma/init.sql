CREATE TABLE IF NOT EXISTS "Score" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "concealed" TEXT NOT NULL,
    "exposedMelds" TEXT NOT NULL,
    "flowers" TEXT NOT NULL,
    "winningTile" TEXT NOT NULL,
    "selfDraw" BOOLEAN NOT NULL,
    "concealedHand" BOOLEAN NOT NULL,
    "seatWind" TEXT NOT NULL,
    "roundWind" TEXT NOT NULL,
    "faan" INTEGER NOT NULL,
    "rawFaan" INTEGER NOT NULL,
    "reasons" TEXT NOT NULL,
    "isLimit" BOOLEAN NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
