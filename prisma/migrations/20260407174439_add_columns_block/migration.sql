-- AlterEnum
ALTER TYPE "BlockType" ADD VALUE 'COLUMNS';

-- CreateTable
CREATE TABLE "BlockColumn" (
    "id" TEXT NOT NULL,
    "blockId" TEXT NOT NULL,
    "columnIndex" INTEGER NOT NULL,
    "heading" TEXT,
    "body" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "BlockColumn_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BlockColumn_blockId_idx" ON "BlockColumn"("blockId");

-- CreateIndex
CREATE UNIQUE INDEX "BlockColumn_blockId_columnIndex_key" ON "BlockColumn"("blockId", "columnIndex");

-- AddForeignKey
ALTER TABLE "BlockColumn" ADD CONSTRAINT "BlockColumn_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "ContentBlock"("id") ON DELETE CASCADE ON UPDATE CASCADE;
